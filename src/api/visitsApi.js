/**
 * Visits API - Tashriflar uchun CRUD
 * localStorage based (barcha o'zgarishlar faqat brauzerda saqlanadi)
 */

const STORAGE_KEY = 'shifocrm_visits'

// localStorage dan o'qish
const readVisits = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to parse visits from storage', e)
    return []
  }
}

// localStorage ga yozish
const writeVisits = (visits) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  console.log('✅ Visits saved to localStorage')
}

// 5 xonali unique ID generatsiya qilish
const generateId = () => {
  const visits = readVisits()
  const existingIds = visits.map(v => Number(v.id))

  let newId
  do {
    newId = Math.floor(10000 + Math.random() * 90000)
  } while (existingIds.includes(newId))

  return newId
}

/**
 * Bemor ID bo'yicha barcha tashriflarni olish
 * @param {number|string} patientId
 * @returns {Promise<Array>}
 */
export const getVisitsByPatientId = async (patientId) => {
  const visits = readVisits()
  const numId = Number(patientId)
  return visits
    .filter(v => v.patient_id === patientId || v.patient_id === numId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * Visit ID bo'yicha olish
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export const getVisitById = async (id) => {
  const visits = readVisits()
  const numId = Number(id)
  return visits.find(v => v.id === id || v.id === numId) || null
}

/**
 * Bemorning active (in_progress) tashrifini olish
 * @param {number|string} patientId
 * @returns {Promise<Object|null>}
 */
export const getActiveVisit = async (patientId) => {
  const visits = readVisits()
  const numId = Number(patientId)
  return visits.find(
    v => (v.patient_id === patientId || v.patient_id === numId) && v.status === 'in_progress'
  ) || null
}

/**
 * Yangi tashrif yaratish
 * @param {Object} data - { patient_id, doctor_id, doctor_name, notes }
 * @returns {Promise<Object>}
 */
export const createVisit = async ({ patient_id, doctor_id, doctor_name = '', notes = '' }) => {
  const visits = readVisits()
  const now = new Date().toISOString()

  const newVisit = {
    id: generateId(),
    patient_id: Number(patient_id),
    doctor_id: doctor_id ? Number(doctor_id) : null,
    doctor_name,
    date: now.split('T')[0],
    status: 'in_progress',
    notes,
    created_at: now,
    updated_at: now
  }

  visits.unshift(newVisit)
  writeVisits(visits)
  return newVisit
}

/**
 * Tashrifni yangilash
 * @param {number|string} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateVisit = async (id, payload) => {
  const visits = readVisits()
  const numId = Number(id)
  const index = visits.findIndex(v => v.id === id || v.id === numId)

  if (index === -1) throw new Error('Visit not found')

  const updatedVisit = {
    ...visits[index],
    ...payload,
    updated_at: new Date().toISOString()
  }

  visits[index] = updatedVisit
  writeVisits(visits)
  return updatedVisit
}

/**
 * Tashrifni yakunlash (completed)
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const completeVisit = async (id) => {
  return updateVisit(id, { status: 'completed' })
}

/**
 * Tashrifni o'chirish
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const deleteVisit = async (id) => {
  const visits = readVisits()
  const numId = Number(id)
  const filtered = visits.filter(v => v.id !== id && v.id !== numId)
  writeVisits(filtered)
  return true
}
