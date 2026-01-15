/**
 * Odontogram API - Tish xaritasi snapshot'lari uchun CRUD
 * localStorage based demo
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

const STORAGE_KEY = 'odontogram_snapshots'

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

// localStorage dan o'qish
const readSnapshots = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to parse odontogram snapshots from storage', e)
    return []
  }
}

// localStorage ga yozish
const writeSnapshots = (snapshots) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
  console.log('✅ Odontogram snapshots saved to localStorage')
}

// 5 xonali unique ID generatsiya qilish
const generateId = () => {
  const snapshots = readSnapshots()
  const existingIds = snapshots.map(s => Number(s.id))

  let newId
  do {
    newId = Math.floor(10000 + Math.random() * 90000)
  } while (existingIds.includes(newId))

  return newId
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
  const snapshots = readSnapshots()
  const numId = Number(visitId)
  return snapshots.find(s => s.visit_id === visitId || s.visit_id === numId) || null
}

/**
 * Bemor ID bo'yicha barcha odontogrammalarni olish
 * @param {number|string} patientId
 * @returns {Promise<Array>}
 */
export const getOdontogramsByPatientId = async (patientId) => {
  const snapshots = readSnapshots()
  const numId = Number(patientId)
  return snapshots
    .filter(s => s.patient_id === patientId || s.patient_id === numId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * Yangi odontogramma snapshot yaratish
 * @param {Object} data - { patient_id, visit_id, doctor_id, data }
 * @returns {Promise<Object>}
 */
export const createOdontogramSnapshot = async ({ patient_id, visit_id, doctor_id, data = null }) => {
  const snapshots = readSnapshots()
  const now = new Date().toISOString()

  const newSnapshot = {
    id: generateId(),
    patient_id: Number(patient_id),
    visit_id: Number(visit_id),
    doctor_id: doctor_id ? Number(doctor_id) : null,
    data: data || createEmptyOdontogram(),
    created_at: now,
    updated_at: now
  }

  snapshots.unshift(newSnapshot)
  writeSnapshots(snapshots)
  return newSnapshot
}

/**
 * Odontogramma yangilash
 * @param {number|string} id
 * @param {Object} data - { teeth: { ... } }
 * @returns {Promise<Object>}
 */
export const updateOdontogramSnapshot = async (id, data) => {
  const snapshots = readSnapshots()
  const numId = Number(id)
  const index = snapshots.findIndex(s => s.id === id || s.id === numId)

  if (index === -1) throw new Error('Odontogram snapshot not found')

  const updatedSnapshot = {
    ...snapshots[index],
    data,
    updated_at: new Date().toISOString()
  }

  snapshots[index] = updatedSnapshot
  writeSnapshots(snapshots)
  return updatedSnapshot
}

/**
 * Odontogramma o'chirish
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const deleteOdontogramSnapshot = async (id) => {
  const snapshots = readSnapshots()
  const numId = Number(id)
  const filtered = snapshots.filter(s => s.id !== id && s.id !== numId)
  writeSnapshots(filtered)
  return true
}

/**
 * Visit uchun odontogramma olish yoki yangi yaratish
 * @param {Object} params - { patient_id, visit_id, doctor_id }
 * @returns {Promise<Object>}
 */
export const getOrCreateOdontogram = async ({ patient_id, visit_id, doctor_id }) => {
  const existing = await getOdontogramByVisitId(visit_id)
  if (existing) return existing

  // Oxirgi odontogrammadan nusxa olish (agar mavjud bo'lsa)
  const patientSnapshots = await getOdontogramsByPatientId(patient_id)
  let initialData = null

  if (patientSnapshots.length > 0) {
    // Oxirgi snapshot'dan data ni nusxalash
    initialData = JSON.parse(JSON.stringify(patientSnapshots[0].data))
  }

  return createOdontogramSnapshot({ patient_id, visit_id, doctor_id, data: initialData })
}
