/**
 * Patients API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'
import { logActivity } from '@/lib/activityLog'

const TABLE = 'patients'

const getSessionPatientScopeContext = () => {
  const userRole = localStorage.getItem('userRole') || null
  const rawUser = localStorage.getItem('user')

  let user = null
  try {
    user = rawUser ? JSON.parse(rawUser) : null
  } catch {
    user = null
  }

  const doctorId = user?.id != null && Number.isFinite(Number(user.id))
    ? Number(user.id)
    : null

  const patientsScope = user?.patients_scope === 'all' ? 'all' : 'own'

  return { userRole, doctorId, patientsScope }
}

const buildScopeQuery = () => {
  const { userRole, doctorId, patientsScope } = getSessionPatientScopeContext()

  if (userRole !== 'doctor') return null
  if (patientsScope === 'all') return null

  if (!Number.isFinite(doctorId)) {
    return 'doctor_id=eq.-1'
  }

  return `doctor_id=eq.${doctorId}`
}

const normalizeNullableDateField = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const normalizePatientPayload = (payload) => {
  const normalized = { ...payload }
  const dateFields = ['birth_date', 'last_visit', 'next_appointment']

  dateFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(normalized, field)) {
      normalized[field] = normalizeNullableDateField(normalized[field])
    }
  })

  if (Object.prototype.hasOwnProperty.call(normalized, 'doctor_id')) {
    const doctorId = normalized.doctor_id
    if (doctorId === '' || doctorId === null || doctorId === undefined) {
      normalized.doctor_id = null
    } else {
      normalized.doctor_id = Number(doctorId)
    }
  }

  return normalized
}

export const listPatients = async (options = {}) => {
  try {
    const cid = await getCurrentClinicId()
    const scopeQuery = buildScopeQuery()
    const limit = Math.min(Math.max(Number(options.limit) || 500, 1), 1000)
    const offset = Math.max(Number(options.offset) || 0, 0)
    const select = options.select || 'id,full_name,phone,status,doctor_id,birth_date,created_at,last_visit,clinic_id'
    const parts = [
      `select=${select}`,
      'order=created_at.desc',
      `limit=${limit}`,
      `offset=${offset}`,
    ]
    if (scopeQuery) parts.unshift(scopeQuery)
    if (options.phone) {
      const digits = String(options.phone).replace(/\D/g, '')
      if (digits) parts.push(`phone=ilike.*${digits}*`)
    }
    return await supabaseGetWithClinicFallback(TABLE, parts.join('&'), cid)
  } catch (error) {
    console.error('❌ Failed to fetch patients:', error)
    throw error
  }
}

const sanitizeIlike = (value) => String(value || '')
  .replace(/[%*,()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

/**
 * Bemorlar katalogi: sana oralig'i Range + ilike qidiruv + jami son.
 */
export const listPatientsPage = async ({
  search = '',
  doctorId = null,
  status = null,
  page = 1,
  pageSize = 20,
  includeUnassigned = false,
} = {}) => {
  const cid = await getCurrentClinicId()
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 50)
  const safePage = Math.max(Number(page) || 1, 1)
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1
  const scopeQuery = buildScopeQuery()
  const select = 'id,full_name,phone,status,doctor_id,doctor_name,birth_date,created_at,last_visit,clinic_id'
  const parts = [`select=${select}`, 'order=created_at.desc']
  if (scopeQuery) parts.unshift(scopeQuery)

  const extraAnd = []
  const q = sanitizeIlike(search)
  if (q) {
    const pattern = encodeURIComponent(`*${q}*`)
    const orParts = [`full_name.ilike.${pattern}`, `phone.ilike.${pattern}`]
    const digits = q.replace(/\D/g, '')
    if (digits.length >= 3) orParts.push(`phone.ilike.${encodeURIComponent(`*${digits}*`)}`)
    extraAnd.push(`or(${orParts.join(',')})`)
  }

  const doctorNum = Number(doctorId)
  if (Number.isFinite(doctorNum) && doctorNum > 0) {
    extraAnd.push(includeUnassigned
      ? `or(doctor_id.eq.${doctorNum},doctor_id.is.null)`
      : `doctor_id.eq.${doctorNum}`)
  }

  if (status) {
    extraAnd.push(`status.eq.${String(status)}`)
  }

  if (extraAnd.length === 1) {
    const only = extraAnd[0]
    if (only.startsWith('or(')) parts.push(`or=${only.slice(2)}`)
    else parts.push(only.replace('.eq.', '=eq.'))
  } else if (extraAnd.length > 1) {
    parts.push(`and=(${extraAnd.join(',')})`)
  }

  const query = parts.join('&')
  const options = {
    withMeta: true,
    headers: {
      Prefer: 'count=exact,return=representation',
      Range: `${from}-${to}`,
      'Range-Unit': 'items',
    },
  }

  try {
    const result = await supabaseGetWithClinicFallback(TABLE, query, cid, options)
    return {
      data: Array.isArray(result?.data) ? result.data : [],
      total: Number(result?.total) || 0,
      page: safePage,
      pageSize: safePageSize,
    }
  } catch (error) {
    console.error('❌ Failed to fetch patients page:', error)
    throw error
  }
}

export const getPatientById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const scopeQuery = buildScopeQuery()
    const q = scopeQuery ? `id=eq.${numId}&${scopeQuery}` : `id=eq.${numId}`
    const rows = await supabaseGetWithClinicFallback(TABLE, q, cid)
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch patient:', error)
    return null
  }
}

export const getPatientsByDoctorId = async (doctorId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&order=created_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch patients by doctor:', error)
    throw error
  }
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = async () => {
  try {
    const cid = await getCurrentClinicId()

    // Full ro'yxatni yuklamasdan, faqat candidate ID mavjudligini tekshiramiz.
    // Bu kalendar bo'limida bemor qo'shishni tezlashtiradi.
    for (let i = 0; i < 10; i++) {
      const candidateId = Math.floor(10000 + Math.random() * 90000)
      const q = `id=eq.${candidateId}&limit=1`
      const rows = await supabaseGetWithClinicFallback(TABLE, q, cid)
      if (!rows?.length) return candidateId
    }

    return Math.floor(10000 + Math.random() * 90000)
  } catch {
    return Math.floor(10000 + Math.random() * 90000)
  }
}

export const createPatient = async ({
  full_name,
  phone,
  birth_date = null,
  gender = null,
  address = null,
  doctor_id = null,
  doctor_name = null,
  status = 'waiting',
  notes = null,
  createFirstVisit = true,
  clinic_id: clinicIdOverride = null,
}) => {
  try {
    const cid = clinicIdOverride != null && Number.isFinite(Number(clinicIdOverride))
      ? Number(clinicIdOverride)
      : await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const now = new Date().toISOString()
    const id = await generateId()

    const newPatient = normalizePatientPayload({
      id,
      full_name,
      phone,
      birth_date: birth_date || null,
      gender: gender || null,
      address: address || null,
      doctor_id,
      doctor_name: doctor_name || null,
      status,
      notes: notes || null,
      last_visit: null,
      next_appointment: null,
      clinic_id: cid,
      created_at: now,
      updated_at: now
    })

    const result = await supabasePost(TABLE, newPatient)
    const created = result && result[0]
    if (!created) throw new Error('Bemor yaratishda javob olinmadi.')
    if (createFirstVisit) {
      try {
        const { createVisit } = await import('./visitsApi')
        await createVisit({
          patient_id: created.id,
          doctor_id: doctor_id || null,
          doctor_name: doctor_name || null,
          status: 'pending',
          notes: 'Birinchi tashrif (avtomatik yaratilgan)',
          price: null,
          paid_amount: null,
          debt_amount: null
        })
      } catch (visitError) {
        console.warn('⚠️ First visit create failed:', visitError)
      }
    }
    return created
  } catch (error) {
    console.error('❌ Failed to create patient:', error)
    throw error
  }
}

// Bemor ma'lumotlarini yangilash
export const updatePatient = async (id, payload) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const updateData = normalizePatientPayload({
      ...payload,
      updated_at: new Date().toISOString()
    })

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid patient id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    const updated = result && result[0] ? result[0] : null
    if (updated) {
      logActivity({
        action: 'patient.update',
        summary: `Bemor kartasi yangilandi: ${updated.full_name || id}`,
        entity: 'patient',
        entityId: id,
      }).catch(() => {})
    }
    console.log('✅ Patient updated:', updated)
    return updated
  } catch (error) {
    console.error('❌ Failed to update patient:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      status: error?.status
    })
    throw error
  }
}

// Bemorni o'chirish
export const deletePatient = async (id) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid patient id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Patient deleted:', id)
    return { id }
  } catch (error) {
    console.error('❌ Failed to delete patient:', error)
    throw error
  }
}

export const initPatients = async () => {
  return true
}

export const refreshFromServer = async () => {
  return await listPatients()
}

  export const downloadDbJson = async () => {
  const patients = await listPatients()
  const data = { patients }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.json'
  a.click()
  URL.revokeObjectURL(url)
}
