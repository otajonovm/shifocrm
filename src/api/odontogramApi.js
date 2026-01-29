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

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback, mergeClinicQuery } from '@/lib/supabaseClinicFallback'

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

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = async () => {
  try {
    const odontograms = await supabaseGet(TABLE, 'select=id&order=id.desc&limit=1000')
    const existingIds = odontograms.map(o => Number(o.id))

    let newId
    let attempts = 0
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
      attempts++
      if (attempts > 100) {
        newId = Math.floor(10000 + Date.now() % 90000)
        break
      }
    } while (existingIds.includes(newId))

    return newId
  } catch {
    return Math.floor(10000 + Date.now() % 90000)
  }
}

/**
 * Bo'sh odontogramma yaratish (barcha tishlar healthy)
 * @returns {Object}
 */
export const createEmptyOdontogram = () => {
  const teeth = {}
  const allTeeth = [
    ...TOOTH_NUMBERS.upper_right,
    ...TOOTH_NUMBERS.upper_left,
    ...TOOTH_NUMBERS.lower_left,
    ...TOOTH_NUMBERS.lower_right
  ]

  allTeeth.forEach(num => {
    teeth[num] = { state: 'healthy', note: '' }
  })

  return { teeth }
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
    const odontogramData = data || createEmptyOdontogram()

    const newOdontogram = {
      id,
      patient_id: Number(patient_id),
      visit_id: Number(visit_id),
      doctor_id: doctor_id ? Number(doctor_id) : null,
      data: odontogramData,
      clinic_id: cid
    }

    const result = await supabasePost(TABLE, newOdontogram)
    console.log('✅ Odontogram created:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create odontogram:', error)
    throw error
  }
}

/**
 * Odontogramma yangilash
 * @param {number|string} id
 * @param {Object} data - { teeth: { ... } }
 * @returns {Promise<Object>}
 */
export const updateOdontogramSnapshot = async (id, data) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid odontogram id')
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    
    // Data JSONB formatida yuborish
    const updateData = {
      data: data
    }

    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    console.log('✅ Odontogram updated:', result[0])
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

    // Agar mavjud bo'lmasa, yangi yaratish
    // Oxirgi odontogrammadan nusxa olish (agar mavjud bo'lsa)
    const patientSnapshots = await getOdontogramsByPatientId(patient_id)
    let initialData = null

    if (patientSnapshots.length > 0) {
      // Oxirgi snapshot'dan data ni nusxalash
      initialData = JSON.parse(JSON.stringify(patientSnapshots[0].data))
    }

    return await createOdontogramSnapshot({ patient_id, visit_id, doctor_id, data: initialData })
  } catch (error) {
    console.error('❌ Failed to get or create odontogram:', error)
    throw error
  }
}
