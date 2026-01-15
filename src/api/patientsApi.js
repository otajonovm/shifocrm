// Online JSON Server API
const API_URL = 'https://my-json-server.typicode.com/otajonovm/db.json'
const STORAGE_KEY = 'patients'
const DATA_LOADED_KEY = 'patients_loaded'

// Onlayn serverdan bemorlarni yuklash va localStorage ga saqlash
const fetchPatientsFromServer = async () => {
  try {
    const response = await fetch(`${API_URL}/db`)
    if (!response.ok) throw new Error('Server error')
    const data = await response.json()
    if (data.patients && data.patients.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.patients))
      localStorage.setItem(DATA_LOADED_KEY, 'true')
      console.log('✅ Patients loaded from online server')
      return data.patients
    }
    return []
  } catch (error) {
    console.error('Failed to fetch patients from server:', error)
    return null
  }
}

// localStorage dan bemorlarni o'qish
const readPatients = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to parse patients from storage', e)
    return []
  }
}

// localStorage ga bemorlarni yozish
const writePatients = async (patients) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
  console.log('✅ Patients saved to localStorage')
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = () => {
  const patients = readPatients()
  const existingIds = patients.map(p => Number(p.id))

  let newId
  do {
    newId = Math.floor(10000 + Math.random() * 90000)
  } while (existingIds.includes(newId))

  return newId
}

// Initialization - serverdan yuklash yoki localStorage dan olish
export const initPatients = async () => {
  const loaded = localStorage.getItem(DATA_LOADED_KEY)
  if (!loaded) {
    await fetchPatientsFromServer()
  }
}

// Barcha bemorlarni olish
export const listPatients = async () => {
  let patients = readPatients()
  if (patients.length === 0) {
    const serverPatients = await fetchPatientsFromServer()
    if (serverPatients) {
      patients = serverPatients
    }
  }
  return patients.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

// ID bo'yicha bemorni olish
export const getPatientById = async (id) => {
  const patients = readPatients()
  return patients.find(p => p.id === id || p.id === Number(id)) || null
}

// Doktor ID bo'yicha bemorlarni olish
export const getPatientsByDoctorId = async (doctorId) => {
  let patients = readPatients()
  if (patients.length === 0) {
    await fetchPatientsFromServer()
    patients = readPatients()
  }
  const numDoctorId = Number(doctorId)
  return patients.filter(p => p.doctor_id === doctorId || p.doctor_id === numDoctorId)
}

// Yangi bemor yaratish
export const createPatient = async ({
  full_name,
  phone,
  birth_date = '',
  gender = '',
  address = '',
  doctor_id = null,
  doctor_name = '',
  status = 'active',
  notes = ''
}) => {
  const patients = readPatients()

  const now = new Date().toISOString()
  const newPatient = {
    id: generateId(),
    full_name,
    phone,
    birth_date,
    gender,
    address,
    doctor_id,
    doctor_name,
    status,
    notes,
    last_visit: null,
    next_appointment: null,
    created_at: now,
    updated_at: now,
  }

  const updated = [newPatient, ...patients]
  await writePatients(updated)
  return newPatient
}

// Bemor ma'lumotlarini yangilash
export const updatePatient = async (id, payload) => {
  const patients = readPatients()
  const numId = Number(id)
  const index = patients.findIndex(p => p.id === id || p.id === numId)

  if (index === -1) throw new Error('Patient not found')

  const updatedPatient = {
    ...patients[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }

  patients[index] = updatedPatient
  await writePatients(patients)
  return updatedPatient
}

// Bemorni o'chirish
export const deletePatient = async (id) => {
  const patients = readPatients()
  const numId = Number(id)
  const index = patients.findIndex(p => p.id === id || p.id === numId)

  if (index === -1) throw new Error('Patient not found')

  const deletedPatient = patients[index]
  const updated = patients.filter(p => p.id !== id && p.id !== numId)
  await writePatients(updated)
  return deletedPatient
}

// Ma'lumotlarni serverdan qayta yuklash (refresh)
export const refreshFromServer = async () => {
  localStorage.removeItem(DATA_LOADED_KEY)
  return await fetchPatientsFromServer()
}

// Export to JSON file
export const downloadDbJson = () => {
  const patients = readPatients()
  const data = { patients }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.json'
  a.click()
  URL.revokeObjectURL(url)
}
