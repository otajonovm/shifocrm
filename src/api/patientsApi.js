import dbData from '../../db.json'

const STORAGE_KEY = 'patients'

// db.json dan bemorlarni o'qish va localStorage ga sinxronlashtirish
const initPatientsFromDb = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored && dbData.patients && dbData.patients.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData.patients))
    return dbData.patients
  }
  return null
}

// localStorage dan bemorlarni o'qish
const readPatients = () => {
  initPatientsFromDb()

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

  // Development rejimida db.json ga avtomatik saqlash
  if (import.meta.env.DEV) {
    try {
      const response = await fetch('/api/save-patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients }),
      })
      if (response.ok) {
        console.log('✅ Patients saved to db.json')
      }
    } catch {
      console.log('Patients saved to localStorage only')
    }
  }
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = () => {
  const patients = readPatients()
  const existingIds = patients.map(p => Number(p.id))

  let newId
  do {
    newId = Math.floor(10000 + Math.random() * 90000) // 10000-99999
  } while (existingIds.includes(newId))

  return newId
}

// Barcha bemorlarni olish
export const listPatients = async () => {
  const patients = readPatients()
  return patients.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

// ID bo'yicha bemorni olish
export const getPatientById = async (id) => {
  const patients = readPatients()
  return patients.find(p => p.id === id || p.id === Number(id)) || null
}

// Doktor ID bo'yicha bemorlarni olish (doktor o'z bemorlarini ko'rish uchun)
export const getPatientsByDoctorId = async (doctorId) => {
  const patients = readPatients()
  return patients.filter(p => p.doctor_id === doctorId || p.doctor_id === Number(doctorId))
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
  const index = patients.findIndex(p => p.id === id || p.id === Number(id))

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
  const index = patients.findIndex(p => p.id === id || p.id === Number(id))

  if (index === -1) throw new Error('Patient not found')

  const deletedPatient = patients[index]
  const updated = patients.filter(p => p.id !== id && p.id !== Number(id))
  await writePatients(updated)
  return deletedPatient
}

// db.json ni yuklab olish
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
