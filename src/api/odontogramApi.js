/**
 * Odontogram API - Supabase REST API orqali
 * Jadval: odontograms
 *
 * Data format:
 * {
 *   teeth: {
 *     "11": { state: "healthy|caries|filled|missing|crown|root_canal", note: "" },
 *     "12": { state: "healthy", note: "" },
 *     ...
 *   }
 * }
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere, supabaseRpc } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback, mergeClinicQuery } from '@/lib/supabaseClinicFallback'
import {
  cloneTeethOnly,
  createEmptyOdontogramData,
  normalizeToothRecord,
} from '@/domain/odontogram'

const TABLE = 'odontograms'

// Tish raqamlari (FDI notation - kattalar uchun 32 ta tish)
export const TOOTH_NUMBERS = {
  upper_right: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upper_left: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lower_left: ['31', '32', '33', '34', '35', '36', '37', '38'],
  lower_right: ['48', '47', '46', '45', '44', '43', '42', '41']
}

// Tish holatlari
export const TOOTH_STATES = {
  healthy: { label: 'Sog\'lom', color: 'bg-green-500', icon: '✓' },
  caries: { label: 'Kariyes', color: 'bg-red-500', icon: '●' },
  filled: { label: 'Plomba', color: 'bg-blue-500', icon: '■' },
  missing: { label: 'Yo\'q', color: 'bg-gray-400', icon: '✕' },
  crown: { label: 'Koronka', color: 'bg-yellow-500', icon: '◆' },
  root_canal: { label: 'Kanal', color: 'bg-purple-500', icon: '◉' }
}

// 5 xonali unique ID (to'liq jadvalni yuklamasdan)
const generateId = async () => {
  try {
    const cid = await getCurrentClinicId()
    for (let i = 0; i < 10; i++) {
      const candidateId = Math.floor(10000 + Math.random() * 90000)
      const q = `id=eq.${candidateId}&select=id&limit=1`
      const rows = cid
        ? await supabaseGetWithClinicFallback(TABLE, q, cid)
        : await supabaseGet(TABLE, q)
      if (!rows?.length) return candidateId
    }
    return Math.floor(10000 + Date.now() % 90000)
  } catch {
    return Math.floor(10000 + Date.now() % 90000)
  }
}

/**
 * Bo'sh odontogramma yaratish (barcha tishlar healthy)
 * @returns {Object}
 */
export const createEmptyOdontogram = () => {
  return createEmptyOdontogramData('permanent')
}

export const normalizeOdontogramDataForApi = (data) => {
  if (!data || typeof data !== 'object') return data
  const out = { ...data }
  if (out.teeth && typeof out.teeth === 'object' && !Array.isArray(out.teeth)) {
    const teethNormalized = {}
    Object.keys(out.teeth).forEach((k) => {
      const key = String(k)
      const tooth = out.teeth[k] || {}
      teethNormalized[key] = normalizeToothRecord(tooth)
    })
    out.teeth = teethNormalized
  }
  return out
}

/**
 * Visit ID bo'yicha odontogramma olish
 * @param {number|string} visitId
 * @returns {Promise<Object|null>}
 */
export const getOdontogramByVisitId = async (visitId) => {
  try {
    const numId = Number(visitId)
    const cid = await getCurrentClinicId()
    const odontograms = await supabaseGetWithClinicFallback(TABLE, `visit_id=eq.${numId}&limit=1`, cid)
    return odontograms[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch odontogram:', error)
    throw error
  }
}

/**
 * Bemor ID bo'yicha barcha odontogrammalarni olish
 * @param {number|string} patientId
 * @returns {Promise<Array>}
 */
export const getOdontogramsByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    const cid = await getCurrentClinicId()
    const odontograms = await supabaseGetWithClinicFallback(TABLE, `patient_id=eq.${numId}&order=created_at.desc`, cid)
    return odontograms || []
  } catch (error) {
    console.error('❌ Failed to fetch odontograms:', error)
    throw error
  }
}

export const getLatestOdontogramByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const rows = await supabaseGetWithClinicFallback(
      TABLE,
      `patient_id=eq.${numId}&select=id,data,created_at&order=created_at.desc&limit=1`,
      cid,
    )
    return rows?.[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch latest odontogram:', error)
    return null
  }
}

/**
 * Odontogramma ID bo'yicha olish
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export const getOdontogramById = async (id) => {
  try {
    const numId = Number(id)
    const cid = await getCurrentClinicId()
    const q = cid ? mergeClinicQuery(`id=eq.${numId}&limit=1`, cid) : `id=eq.${numId}&limit=1`
    const odontograms = await supabaseGet(TABLE, q)
    return odontograms[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch odontogram:', error)
    throw error
  }
}

/**
 * Yangi odontogramma snapshot yaratish
 * @param {Object} params - { patient_id, visit_id, doctor_id, data }
 * @returns {Promise<Object>}
 */
export const createOdontogramSnapshot = async ({ patient_id, visit_id, doctor_id, data = null }) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const id = await generateId()
    const rawData = data || createEmptyOdontogram()
    const odontogramData = normalizeOdontogramDataForApi(rawData)

    const newOdontogram = {
      id,
      patient_id: Number(patient_id),
      visit_id: Number(visit_id),
      doctor_id: doctor_id ? Number(doctor_id) : null,
      data: odontogramData,
      clinic_id: cid
    }

    const result = await supabasePost(TABLE, newOdontogram)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create odontogram:', error)
    throw error
  }
}

/**
 * Odontogramma yangilash (ranglar va holatlar Supabase'da barqaror saqlanadi)
 * @param {number|string} id
 * @param {Object} data - { teeth: { "11": { state, service_id?, note? }, ... } }
 * @returns {Promise<Object>}
 */
export const updateOdontogramSnapshot = async (id, data, options = {}) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid odontogram id')
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const normalized = normalizeOdontogramDataForApi(data)

    // RPC mavjud bo'lsa versioned update; aks holda oddiy PATCH (legacy)
    if (options.expectedVersion != null) {
      try {
        const rpcData = normalizeOdontogramDataForApi(normalized)
        return await supabaseRpc('replace_odontogram_versioned', {
          p_id: numId,
          p_expected_version: Number(options.expectedVersion),
          p_data: rpcData,
          p_dentition_type: options.dentitionType ?? normalized.dentition_type ?? null,
        })
      } catch (rpcErr) {
        const msg = String(rpcErr?.message || '')
        if (msg.includes('Could not find the function') || rpcErr?.status === 404) {
          console.warn("⚠️ replace_odontogram_versioned RPC yo'q — oddiy PATCH ishlatilmoqda")
          // Fallback below
        } else {
          throw rpcErr
        }
      }
    }

    // Legacy PATCH fallback
    const updateData = { data: normalized }
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update odontogram:', error)
    throw error
  }
}

/**
 * Odontogramma o'chirish
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const deleteOdontogramSnapshot = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid odontogram id')
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Odontogram deleted:', numId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete odontogram:', error)
    throw error
  }
}

/**
 * Visit uchun odontogramma olish yoki yangi yaratish
 * @param {Object} params - { patient_id, visit_id, doctor_id }
 * @returns {Promise<Object>}
 */
export const getOrCreateOdontogram = async ({ patient_id, visit_id, doctor_id }) => {
  try {
    // Avval mavjud odontogrammani qidirish
    const existing = await getOdontogramByVisitId(visit_id)
    if (existing) {
      return existing
    }

    const latest = await getLatestOdontogramByPatientId(patient_id)
    const initialData = latest?.data ? cloneTeethOnly(latest.data) : null

    try {
      return await createOdontogramSnapshot({ patient_id, visit_id, doctor_id, data: initialData })
    } catch (createError) {
      const message = String(createError?.message || '').toLowerCase()
      const isVisitConflict = createError?.code === '23505' || message.includes('duplicate') || message.includes('unique')
      if (isVisitConflict) {
        const concurrentSnapshot = await getOdontogramByVisitId(visit_id)
        if (concurrentSnapshot) return concurrentSnapshot
      }
      throw createError
    }
  } catch (error) {
    console.error('❌ Failed to get or create odontogram:', error)
    throw error
  }
}
