import {
  supabaseGet,
  supabasePost,
  supabasePatch,
  supabasePatchWhere,
  supabaseDelete,
  supabaseDeleteWhere,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { formatPhoneForStorage, phoneAuthLookupVariants } from '@/lib/phoneUz'
import { hydrateEmployee } from '@/lib/staffHelpers'
import { syncLegacyPermissionFlags } from '@/lib/staffPermissions'

const EMPLOYEES_TABLE = 'employees'
const PERMISSIONS_TABLE = 'employee_permissions'
const SCHEDULES_TABLE = 'doctor_schedules'
const LOGS_TABLE = 'activity_logs'
const CASH_REGISTERS_TABLE = 'cash_registers'

const NESTED_SELECT = encodeURIComponent('*,employee_permissions(*),doctor_schedules(*)')

const stripPassword = (row) => {
  if (!row || typeof row !== 'object') return row
  const { password: _password, ...safe } = row
  return safe
}

const stripUndefined = (payload) => {
  const cleaned = { ...payload }
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key]
  })
  return cleaned
}

async function rollbackEmployee(employeeId) {
  if (!employeeId) return
  try {
    await supabaseDeleteWhere(SCHEDULES_TABLE, `doctor_id=eq.${employeeId}`)
  } catch (e) {
    console.warn('⚠️ Rollback schedules:', e?.message)
  }
  try {
    await supabaseDeleteWhere(PERMISSIONS_TABLE, `employee_id=eq.${employeeId}`)
  } catch (e) {
    console.warn('⚠️ Rollback permissions:', e?.message)
  }
  try {
    await supabaseDelete(EMPLOYEES_TABLE, employeeId)
  } catch (e) {
    console.error('⚠️ Rollback employee failed:', e)
    throw e
  }
}

function buildEmployeesQuery(suffix = '') {
  return `select=${NESTED_SELECT}${suffix ? `&${suffix}` : ''}`
}

/**
 * Xodimni telefon yoki email + parol bilan tekshirish (administrator kirish uchun).
 * @returns {Promise<ReturnType<typeof hydrateEmployee>|null>}
 */
export const authenticateEmployee = async (login, password) => {
  const p = String(password || '')
  if (!login || !p) return null

  const matchActive = (rows) => {
    const row = (Array.isArray(rows) ? rows : []).find(
      (item) => item?.password === p && item?.is_active !== false
    )
    return row ? hydrateEmployee(stripPassword(row)) : null
  }

  try {
    for (const phoneVariant of phoneAuthLookupVariants(login)) {
      const rows = await supabaseGet(
        EMPLOYEES_TABLE,
        `phone=eq.${encodeURIComponent(phoneVariant)}`
      )
      const found = matchActive(rows)
      if (found) return found
    }

    const email = String(login).trim().toLowerCase()
    if (email.includes('@')) {
      const rows = await supabaseGet(
        EMPLOYEES_TABLE,
        `email=eq.${encodeURIComponent(email)}`
      )
      const found = matchActive(rows)
      if (found) return found
    }
  } catch (error) {
    console.error('❌ Failed to authenticate employee:', error)
  }

  return null
}

export const getAllEmployees = async () => {
  const cid = await getCurrentClinicId()
  let query = buildEmployeesQuery('order=created_at.desc')
  if (cid != null && Number.isFinite(Number(cid))) {
    query += `&clinic_id=eq.${Number(cid)}`
  }

  let rows = await supabaseGet(EMPLOYEES_TABLE, query)

  // clinic_id bo'sh migratsiya qilingan yozuvlar uchun fallback
  if (
    cid != null
    && Number.isFinite(Number(cid))
    && (!Array.isArray(rows) || rows.length === 0)
  ) {
    const fallbackQuery = buildEmployeesQuery('order=created_at.desc')
    rows = await supabaseGet(EMPLOYEES_TABLE, fallbackQuery)
    rows = (Array.isArray(rows) ? rows : []).filter(
      (row) => row.clinic_id == null || Number(row.clinic_id) === Number(cid)
    )
  }

  return (Array.isArray(rows) ? rows : []).map((row) => hydrateEmployee(stripPassword(row)))
}

export const getEmployeeById = async (employeeId) => {
  if (!employeeId) return null
  const query = buildEmployeesQuery(`id=eq.${employeeId}`)
  const rows = await supabaseGet(EMPLOYEES_TABLE, query)
  const row = rows?.[0]
  return row ? hydrateEmployee(stripPassword(row)) : null
}

export const createEmployee = async (employeeData, permissionsData, scheduleData) => {
  let createdEmployeeId = null

  try {
    const now = new Date().toISOString()
    const payload = stripUndefined({ ...employeeData })
    if (payload.created_at === undefined) payload.created_at = now
    if (payload.updated_at === undefined) payload.updated_at = now

    const result = await supabasePost(EMPLOYEES_TABLE, payload)
    const created = result?.[0]
    if (!created) throw new Error('Xodim yaratishda javob olinmadi')

    createdEmployeeId = created.id

    if (permissionsData) {
      const permissionsPayload = stripUndefined({
        ...permissionsData,
        updated_at: now,
      })
      await supabasePatchWhere(
        PERMISSIONS_TABLE,
        `employee_id=eq.${createdEmployeeId}`,
        permissionsPayload
      )
    }

    const schedules = Array.isArray(scheduleData)
      ? scheduleData
      : (scheduleData ? [scheduleData] : [])

    if (schedules.length > 0) {
      const schedulesPayload = schedules.map((entry) => {
        const normalized = stripUndefined({ ...entry })
        return {
          ...normalized,
          doctor_id: createdEmployeeId,
          created_at: normalized.created_at ?? now,
          updated_at: normalized.updated_at ?? now,
        }
      })
      await supabasePost(SCHEDULES_TABLE, schedulesPayload)
    }

    const full = await getEmployeeById(createdEmployeeId)
    return full ?? hydrateEmployee(stripPassword(created))
  } catch (error) {
    if (createdEmployeeId) {
      try {
        await rollbackEmployee(createdEmployeeId)
      } catch (rollbackError) {
        console.error('⚠️ Rollback failed:', rollbackError)
        throw new Error(
          error?.message
            ? `${error.message} (va qisman yaratilgan yozuvni tozalab bo'lmadi)`
            : 'Xodim yaratishda xatolik va rollback muvaffaqiyatsiz'
        )
      }
    }
    throw error
  }
}

export const updateEmployee = async (employeeId, updatedData) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  const payload = stripUndefined({
    ...updatedData,
    updated_at: new Date().toISOString(),
  })

  const result = await supabasePatch(EMPLOYEES_TABLE, employeeId, payload)
  const row = result?.[0] || null
  return row ? hydrateEmployee(stripPassword(row)) : null
}

export const replaceEmployeeSchedules = async (employeeId, scheduleData) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  await supabaseDeleteWhere(SCHEDULES_TABLE, `doctor_id=eq.${employeeId}`)

  const schedules = Array.isArray(scheduleData) ? scheduleData : []
  if (!schedules.length) return []

  const now = new Date().toISOString()
  const payload = schedules.map((entry) => ({
    ...stripUndefined({ ...entry }),
    doctor_id: employeeId,
    created_at: now,
    updated_at: now,
  }))

  return await supabasePost(SCHEDULES_TABLE, payload)
}

export const updateEmployeePermissions = async (employeeId, permissions) => {
  if (!employeeId) throw new Error('Xodim id majburiy')

  const { module_permissions, permissions: matrix, ...scalarPerms } = permissions || {}

  let payload = stripUndefined({
    ...scalarPerms,
    ...(module_permissions !== undefined ? { module_permissions } : {}),
    updated_at: new Date().toISOString(),
  })

  if (matrix !== undefined) {
    const synced = syncLegacyPermissionFlags(matrix)
    payload = stripUndefined({
      ...payload,
      permissions: synced.permissions,
      module_permissions: synced.module_permissions,
      can_view_revenue: synced.can_view_revenue,
      can_export_data: synced.can_export_data,
      can_edit_prices: synced.can_edit_prices,
      can_manage_medical_records: synced.can_manage_medical_records,
      can_allow_debt_treatment: synced.can_allow_debt_treatment,
    })
  }

  const result = await supabasePatchWhere(
    PERMISSIONS_TABLE,
    `employee_id=eq.${employeeId}`,
    payload
  )

  return result?.[0] || null
}

/** Telefon klinika ichida takrorlanmasligini tekshirish */
export const checkPhoneUnique = async (phone, { clinicId, excludeEmployeeId } = {}) => {
  const stored = formatPhoneForStorage(phone)
  if (!stored) return { unique: false, reason: 'empty' }

  const variants = phoneAuthLookupVariants(stored)
  for (const variant of variants) {
    let query = `phone=eq.${encodeURIComponent(variant)}&select=id,clinic_id`
    if (clinicId != null && Number.isFinite(Number(clinicId))) {
      query += `&clinic_id=eq.${Number(clinicId)}`
    }
    const rows = await supabaseGet(EMPLOYEES_TABLE, query)
    const conflict = (Array.isArray(rows) ? rows : []).find(
      (row) => !excludeEmployeeId || row.id !== excludeEmployeeId
    )
    if (conflict) {
      return { unique: false, employeeId: conflict.id }
    }
  }

  return { unique: true }
}

export const getCashRegisters = async (clinicId) => {
  if (clinicId == null || !Number.isFinite(Number(clinicId))) {
    return []
  }
  const query = `clinic_id=eq.${Number(clinicId)}&is_active=eq.true&order=name.asc`
  const rows = await supabaseGet(CASH_REGISTERS_TABLE, query)
  return Array.isArray(rows) ? rows : []
}

/** Avatar yuklash — Supabase Storage staff-avatars bucket */
export const uploadEmployeeAvatar = async (file, employeeId) => {
  if (!file || !employeeId) throw new Error('Fayl va xodim id majburiy')

  const ext = String(file.name || '').split('.').pop() || 'jpg'
  const path = `${employeeId}/${Date.now()}.${ext}`
  const url = `${SUPABASE_URL}/storage/v1/object/staff-avatars/${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type || 'image/jpeg',
      'x-upsert': 'true',
    },
    body: file,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || body.error || 'Rasm yuklashda xatolik')
  }

  return `${SUPABASE_URL}/storage/v1/object/public/staff-avatars/${path}`
}

export const deleteEmployee = async (employeeId) => {
  if (!employeeId) throw new Error('Xodim id majburiy')
  await supabaseDelete(EMPLOYEES_TABLE, employeeId)
  return { id: employeeId }
}

export const logEmployeeActivity = async (employeeId, action, details = {}) => {
  if (!action) throw new Error('Action is required')

  const payload = {
    employee_id: employeeId || null,
    action,
    details: details || {},
    created_at: new Date().toISOString(),
  }

  const result = await supabasePost(LOGS_TABLE, payload)
  return result?.[0] || null
}
