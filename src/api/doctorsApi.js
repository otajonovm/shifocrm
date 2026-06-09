/**
 * Doctors API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import {
  getDefaultClinicId,
  assertDoctorLimitNotReached,
  MAX_DOCTORS_ERROR
} from '@/services/adminService'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { phoneAuthLookupVariants } from '@/lib/phoneUz'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'doctors'

/** Har doim mavjud bo'lishi kutiladigan ustunlar */
const DOCTOR_CORE_COLUMNS = [
  'id',
  'full_name',
  'phone',
  'email',
  'specialization',
  'is_active',
  'clinic_id',
  'created_at',
  'updated_at',
]

/** Migratsiya qilinmagan bazalarda bo'lmasligi mumkin (ustun fallback) */
const DOCTOR_OPTIONAL_SELECT_COLUMNS = [
  'patients_scope',
  'is_public',
  'public_slug',
  'public_bio',
  'public_avatar_url',
  'public_location_url',
  'public_phone',
  'public_telegram',
  'public_whatsapp',
  'work_schedule',
  'chair_number',
  'salary_percentage',
  'module_permissions',
  'data_permissions',
]

/** Network javoblarida parol qaytmasligi uchun (password bundan mustasno) */
export const DOCTOR_PUBLIC_COLUMNS = [
  ...DOCTOR_CORE_COLUMNS,
  ...DOCTOR_OPTIONAL_SELECT_COLUMNS,
].join(',')

let resolvedDoctorSelectColumns = null

const getDoctorSelectColumnList = () =>
  resolvedDoctorSelectColumns ?? [...DOCTOR_CORE_COLUMNS, ...DOCTOR_OPTIONAL_SELECT_COLUMNS]

const buildDoctorSelectQuery = (baseQuery = '', columns = getDoctorSelectColumnList()) => {
  const select = `select=${encodeURIComponent(columns.join(','))}`
  return baseQuery ? `${select}&${baseQuery}` : select
}

const findMissingSelectColumn = (error, columns) =>
  columns.find((col) => isMissingColumnError(error, col))

/**
 * SELECT so'rovida yo'q ustun 400 bersa, o'sha ustunni olib tashlab qayta urinadi.
 */
async function fetchDoctorsWithSelectFallback(baseQuery, cid) {
  let columns = [...getDoctorSelectColumnList()]

  while (columns.length >= DOCTOR_CORE_COLUMNS.length) {
    try {
      const rows = await supabaseGetWithClinicFallback(
        TABLE,
        buildDoctorSelectQuery(baseQuery, columns),
        cid
      )
      resolvedDoctorSelectColumns = columns
      return Array.isArray(rows) ? rows : []
    } catch (error) {
      const missing = findMissingSelectColumn(error, columns)
      if (!missing || columns.length <= DOCTOR_CORE_COLUMNS.length) throw error
      columns = columns.filter((col) => col !== missing)
    }
  }

  throw new Error('Doktorlar ro\'yxatini yuklab bo\'lmadi')
}

const stripPasswordFromDoctor = (doctor) => {
  if (!doctor || typeof doctor !== 'object') return doctor
  const { password: _password, ...safe } = doctor
  return safe
}

const isMissingColumnError = (error, columnName) => {
  const message = String(error?.message || '').toLowerCase()
  const details = String(error?.details || '').toLowerCase()
  return message.includes(columnName) || details.includes(columnName)
}

export const listDoctors = async () => {
  try {
    const cid = await getCurrentClinicId()
    const rows = await fetchDoctorsWithSelectFallback('order=created_at.desc', cid)
    return rows.map(stripPasswordFromDoctor)
  } catch (error) {
    console.error('❌ Failed to fetch doctors:', error)
    throw error
  }
}

export const getDoctorById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const rows = await fetchDoctorsWithSelectFallback(`id=eq.${numId}`, cid)
    return rows[0] ? stripPasswordFromDoctor(rows[0]) : null
  } catch (error) {
    console.error('❌ Failed to fetch doctor:', error)
    throw error
  }
}

// Doktor autentifikatsiyasi (telefon raqami va parol bo'yicha)
export const authenticateDoctor = async (phone, password) => {
  if (!phone || !password) return null

  try {
    const phoneVariants = phoneAuthLookupVariants(phone)
    if (!phoneVariants.length) return null

    for (const phoneVariant of phoneVariants) {
      const doctors = await supabaseGet(
        TABLE,
        `phone=eq.${encodeURIComponent(phoneVariant)}&password=eq.${encodeURIComponent(password)}`
      )
      const doctor = doctors?.[0]
      if (doctor && doctor.is_active !== false) {
        return stripPasswordFromDoctor(doctor)
      }
    }

    // Telefon formati mos kelmasa: faqat telefon bo'yicha o'qib parolni tekshirish
    for (const phoneVariant of phoneVariants) {
      const doctors = await supabaseGet(TABLE, `phone=eq.${encodeURIComponent(phoneVariant)}`)
      const doctor = doctors?.find(
        (row) => row?.password === password && row?.is_active !== false
      )
      if (doctor) return stripPasswordFromDoctor(doctor)
    }

    return null
  } catch (error) {
    console.error('❌ Failed to authenticate doctor:', error)
    return null
  }
}

const generateId = async () => {
  try {
    const doctors = await listDoctors()
    const existingIds = doctors.map(d => Number(d.id))

    let newId
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
    } while (existingIds.includes(newId))

    return newId
  } catch {
    // Fallback: random ID
    return Math.floor(10000 + Math.random() * 90000)
  }
}

const OPTIONAL_DOCTOR_CREATE_FIELDS = [
  'work_schedule',
  'salary_percentage',
  'chair_number',
  'module_permissions',
  'data_permissions',
]

async function postDoctorWithColumnFallback(payload) {
  let data = { ...payload }
  let attempts = 0
  while (attempts < OPTIONAL_DOCTOR_CREATE_FIELDS.length + 1) {
    try {
      return await supabasePost(TABLE, data)
    } catch (error) {
      const missing = OPTIONAL_DOCTOR_CREATE_FIELDS.find(
        (col) => Object.prototype.hasOwnProperty.call(data, col) && isMissingColumnError(error, col)
      )
      if (!missing) throw error
      delete data[missing]
      attempts += 1
    }
  }
  throw new Error('Doktor yaratishda xatolik yuz berdi')
}

// Yangi doktor yaratish (max_doctors limit tekshiriladi)
export const createDoctor = async ({
  full_name,
  phone,
  email,
  password,
  is_active = true,
  specialization = null,
  patients_scope = 'own',
  clinic_id: rawClinicId = null,
  work_schedule = null,
  salary_percentage = null,
  chair_number = null,
}) => {
  try {
    const clinicId = rawClinicId != null
      ? Number(rawClinicId)
      : (await getCurrentClinicId()) ?? (await getDefaultClinicId())
    if (!Number.isFinite(clinicId)) {
      throw new Error('Clinic not found. Create a clinic first (Super Admin).')
    }
    await assertDoctorLimitNotReached(clinicId)

    // Telefon raqami bo'yicha tekshirish (login uchun telefon ishlatiladi)
    const existing = await fetchDoctorsWithSelectFallback(
      `phone=eq.${encodeURIComponent(phone)}&clinic_id=eq.${clinicId}`,
      clinicId
    )
    if (existing && existing.length > 0) {
      throw new Error('Telefon raqami allaqachon mavjud')
    }

    const now = new Date().toISOString()
    const id = await generateId()

    const normalizedPatientsScope = patients_scope === 'all' ? 'all' : 'own'

    // Avtomatik formadagi ismdan slug yaratib berish
    const baseSlug = full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'doctor'
    const publicSlug = `${baseSlug}-${id}`

    const newDoctor = {
      id,
      full_name,
      phone,
      email,
      password,
      specialization,
      patients_scope: normalizedPatientsScope,
      is_active,
      is_public: false,
      public_slug: publicSlug,
      clinic_id: clinicId,
      created_at: now,
      updated_at: now,
    }

    if (work_schedule != null) newDoctor.work_schedule = work_schedule
    if (chair_number != null && chair_number !== '') newDoctor.chair_number = chair_number
    if (salary_percentage != null && salary_percentage !== '') {
      const pct = Number(salary_percentage)
      if (Number.isFinite(pct)) newDoctor.salary_percentage = pct
    }

    const result = await postDoctorWithColumnFallback(newDoctor)
    const created = result && result[0]
    if (!created) throw new Error('Doktor yaratishda javob olinmadi.')
    const safe = stripPasswordFromDoctor(created)
    console.log('✅ Doctor created:', safe)
    return safe
  } catch (error) {
    if (error.code === 'MAX_DOCTORS_REACHED' || error.message === MAX_DOCTORS_ERROR) {
      throw error
    }
    console.error('❌ Failed to create doctor:', error)
    throw error
  }
}

// Doktor ma'lumotlarini yangilash
export const updateDoctor = async (id, payload) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const updateData = {
      ...payload,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid doctor id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)

    const OPTIONAL_UPDATE_FIELDS = [
      'work_schedule',
      'salary_percentage',
      'chair_number',
      'public_location_url',
    ]

    let patchPayload = { ...updateData }
    let result = null
    let attempts = 0

    while (attempts < OPTIONAL_UPDATE_FIELDS.length + 1) {
      try {
        result = await supabasePatchWhere(TABLE, q, patchPayload)
        break
      } catch (error) {
        const missing = OPTIONAL_UPDATE_FIELDS.find(
          (col) => Object.prototype.hasOwnProperty.call(patchPayload, col) && isMissingColumnError(error, col)
        )
        if (!missing) throw error
        delete patchPayload[missing]
        attempts += 1
      }
    }

    const updated = result && result[0] ? stripPasswordFromDoctor(result[0]) : null
    console.log('✅ Doctor updated:', updated)
    return updated
  } catch (error) {
    console.error('❌ Failed to update doctor:', error)
    throw error
  }
}

const PERMISSION_COLUMNS = ['module_permissions', 'data_permissions']

/** Doktor modul va ma'lumot ruxsatlarini Supabase ga saqlash */
export const updateDoctorPermissions = async (id, { module_permissions, data_permissions } = {}) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid doctor id')

  const updateData = { updated_at: new Date().toISOString() }
  if (module_permissions !== undefined) updateData.module_permissions = module_permissions
  if (data_permissions !== undefined) updateData.data_permissions = data_permissions

  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  let payload = { ...updateData }
  let attempts = 0

  while (attempts < PERMISSION_COLUMNS.length + 1) {
    try {
      const result = await supabasePatchWhere(TABLE, q, payload)
      return result?.[0] ? stripPasswordFromDoctor(result[0]) : null
    } catch (error) {
      const missingCol = PERMISSION_COLUMNS.find(
        (col) => Object.prototype.hasOwnProperty.call(payload, col) && isMissingColumnError(error, col)
      )
      if (!missingCol) throw error
      delete payload[missingCol]
      attempts += 1
      const hasPermissionPayload = PERMISSION_COLUMNS.some((col) => Object.prototype.hasOwnProperty.call(payload, col))
      if (!hasPermissionPayload) {
        throw new Error(
          'Supabase da ruxsat ustunlari yo\'q. SUPABASE_DOCTORS_PERMISSIONS_MIGRATION.sql faylini bajaring.'
        )
      }
    }
  }

  throw new Error('Ruxsatlarni saqlashda xatolik yuz berdi')
}

// Doktorni o'chirish
export const deleteDoctor = async (id) => {
  try {
    const doctorId = Number(id)
    if (!Number.isFinite(doctorId)) throw new Error('Invalid doctor id')
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const q = mergeClinicQuery(`id=eq.${doctorId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Doctor deleted:', id)
    return { id }
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase()
    // If there are patients linked to this doctor, unassign them first then retry delete
    if (/foreign key constraint|patients_doctor_id_fkey/.test(msg)) {
      try {
        const cid = await getCurrentClinicId()
        const base = `doctor_id=eq.${Number(id)}`
        const q = mergeClinicQuery(base, cid)
        await supabasePatchWhere('patients', q, {
          doctor_id: null,
          doctor_name: null,
          updated_at: new Date().toISOString()
        })
        const delQ = mergeClinicQuery(`id=eq.${Number(id)}`, cid)
        await supabaseDeleteWhere(TABLE, delQ)
        console.log('✅ Doctor deleted (after unassigning patients):', id)
        return { id }
      } catch (e2) {
        console.error('❌ Failed to delete doctor (after unassign):', e2)
        throw e2
      }
    }

    console.error('❌ Failed to delete doctor:', error)
    throw error
  }
}

// Initialization (backward compatibility)
export const initDoctors = async () => {
  return true
}

// Refresh (backward compatibility)
export const refreshFromServer = async () => {
  return await listDoctors()
}

// Export to JSON file
export const downloadDbJson = async () => {
  const doctors = await listDoctors()
  const data = { doctors }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'doctors.json'
  a.click()
  URL.revokeObjectURL(url)
}
