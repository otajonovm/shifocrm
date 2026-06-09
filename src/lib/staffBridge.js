/**
 * Bridge 2-bosqich: employees ↔ doctors sinxron yozish
 * Faqat shifokor rollari kalendar (doctors) bilan bog'lanadi.
 */

import * as doctorsApi from '@/api/doctorsApi'
import * as employeesApi from '@/api/employeesApi'
import {
  hydrateEmployee,
  scheduleRowsToWorkSchedule,
  isDoctorRole,
  requiresDoctorCalendarBridge,
} from '@/lib/staffHelpers'
import { normalizePhoneDigits } from '@/lib/phoneUz'

function resolveSpecialty(employeeData) {
  return employeeData?.specialty || employeeData?.specialization || null
}

function ensureDoctorEmail(email, phone) {
  const trimmed = String(email || '').trim()
  if (trimmed) return trimmed
  const digits = normalizePhoneDigits(phone)
  return `staff-${digits || 'unknown'}@shifocrm.local`
}

function buildDoctorPayload(employeeData, scheduleData, { includePassword = true } = {}) {
  const workSchedule = scheduleRowsToWorkSchedule(scheduleData)
  const chairNumber = workSchedule?.chair_number ?? null

  const payload = {
    full_name: employeeData.full_name,
    phone: employeeData.phone,
    email: ensureDoctorEmail(employeeData.email, employeeData.phone),
    specialization: resolveSpecialty(employeeData),
    is_active: employeeData.is_active !== false,
    clinic_id: employeeData.clinic_id ?? null,
    work_schedule: workSchedule,
    chair_number: chairNumber,
  }

  if (isDoctorRole(payload.specialization)) {
    if (employeeData.salary_percentage != null) {
      payload.salary_percentage = employeeData.salary_percentage
    }
  }

  if (includePassword && employeeData.password) {
    payload.password = employeeData.password
  }

  return payload
}

async function safeDeleteDoctor(legacyDoctorId) {
  const id = Number(legacyDoctorId)
  if (!Number.isFinite(id)) return
  try {
    await doctorsApi.deleteDoctor(id)
  } catch (error) {
    console.warn('[staffBridge] Doctor rollback/delete failed:', error?.message)
  }
}

async function unlinkLegacyDoctor(employeeId, legacyDoctorId) {
  if (!Number.isFinite(Number(legacyDoctorId))) return
  await safeDeleteDoctor(legacyDoctorId)
  await employeesApi.updateEmployee(employeeId, { legacy_doctor_id: null })
}

/**
 * Yangi xodim: shifokor bo'lsa doctors + employees, aks holda faqat employees
 */
export async function createStaffBridged({
  employeeData,
  permissionsData,
  scheduleData,
}) {
  const specialty = resolveSpecialty(employeeData)
  const needsDoctorBridge = requiresDoctorCalendarBridge(specialty)

  if (!needsDoctorBridge) {
    const created = await employeesApi.createEmployee(
      employeeData,
      permissionsData,
      scheduleData
    )
    return hydrateEmployee(created)
  }

  let createdDoctorId = null

  try {
    const doctorPayload = buildDoctorPayload(employeeData, scheduleData, {
      includePassword: true,
    })

    if (!doctorPayload.password) {
      throw new Error('Shifokor login uchun parol majburiy.')
    }

    const doctor = await doctorsApi.createDoctor(doctorPayload)
    createdDoctorId = doctor?.id

    if (!createdDoctorId) {
      throw new Error('Doktor yozuvi yaratilmadi (kalendar sinxroni).')
    }

    const employeePayload = {
      ...employeeData,
      legacy_doctor_id: Number(createdDoctorId),
    }

    const created = await employeesApi.createEmployee(
      employeePayload,
      permissionsData,
      scheduleData
    )

    const hydrated = hydrateEmployee(created)

    if (permissionsData) {
      const { module_permissions, ...data_permissions } = permissionsData
      await syncDoctorPermissionsFromEmployee(hydrated, {
        module_permissions,
        data_permissions,
      })
    }

    return hydrated
  } catch (error) {
    if (createdDoctorId) {
      await safeDeleteDoctor(createdDoctorId)
    }
    throw error
  }
}

/**
 * Xodim yangilash + shifokor bo'lsa bog'langan doctors yozuvini sinxronlash
 */
export async function updateStaffBridged({
  employeeId,
  existingEmployee,
  employeeData,
  scheduleData,
}) {
  const specialty = resolveSpecialty(employeeData)
  const needsDoctorBridge = requiresDoctorCalendarBridge(specialty)

  let legacyDoctorId = existingEmployee?.legacy_doctor_id
    ? Number(existingEmployee.legacy_doctor_id)
    : null

  await employeesApi.updateEmployee(employeeId, employeeData)
  await employeesApi.replaceEmployeeSchedules(employeeId, scheduleData)

  if (!needsDoctorBridge) {
    if (Number.isFinite(legacyDoctorId)) {
      await unlinkLegacyDoctor(employeeId, legacyDoctorId)
    }
    const full = await employeesApi.getEmployeeById(employeeId)
    return hydrateEmployee(full)
  }

  const doctorPayload = buildDoctorPayload(employeeData, scheduleData, {
    includePassword: !!employeeData.password,
  })

  if (!legacyDoctorId || !Number.isFinite(legacyDoctorId)) {
    if (!employeeData.password) {
      throw new Error(
        'Kalendar bilan bog\'lash uchun bir marta parol kiriting (legacy doktor yo\'q).'
      )
    }
    const doctor = await doctorsApi.createDoctor({
      ...doctorPayload,
      password: employeeData.password,
    })
    legacyDoctorId = Number(doctor?.id)
    if (!Number.isFinite(legacyDoctorId)) {
      throw new Error('Doktor yozuvi yaratilmadi.')
    }
    await employeesApi.updateEmployee(employeeId, {
      legacy_doctor_id: legacyDoctorId,
    })
  } else {
    const patch = { ...doctorPayload }
    if (!employeeData.password) {
      delete patch.password
    }
    await doctorsApi.updateDoctor(legacyDoctorId, patch)
  }

  const full = await employeesApi.getEmployeeById(employeeId)
  return hydrateEmployee(full)
}

/**
 * Xodim o'chirish + bog'langan doctors yozuvini olib tashlash (agar bor bo'lsa)
 */
export async function deleteStaffBridged(employee) {
  const legacyDoctorId = employee?.legacy_doctor_id
    ? Number(employee.legacy_doctor_id)
    : null

  await employeesApi.deleteEmployee(employee.id)

  if (Number.isFinite(legacyDoctorId)) {
    await safeDeleteDoctor(legacyDoctorId)
  }

  return { id: employee.id }
}

/**
 * employee_permissions → doctors.module_permissions / data_permissions
 */
export async function syncDoctorPermissionsFromEmployee(employee, { module_permissions, data_permissions } = {}) {
  const legacyDoctorId = employee?.legacy_doctor_id
    ? Number(employee.legacy_doctor_id)
    : null

  if (!Number.isFinite(legacyDoctorId)) return null

  return doctorsApi.updateDoctorPermissions(legacyDoctorId, {
    module_permissions,
    data_permissions,
  })
}
