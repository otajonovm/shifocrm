import dbData from '../../db.json'

const STORAGE_KEY = 'doctors'
const DB_DOCTORS_KEY = 'doctors'

// db.json dan doktorlarni o'qish va localStorage ga sinxronlashtirish
const initDoctorsFromDb = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored && dbData[DB_DOCTORS_KEY] && dbData[DB_DOCTORS_KEY].length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData[DB_DOCTORS_KEY]))
    return dbData[DB_DOCTORS_KEY]
  }
  return null
}

const readDoctors = () => {
  // Avval db.json dan sinxronlashtirish
  initDoctorsFromDb()
  
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to parse doctors from storage', e)
    return []
  }
}

const writeDoctors = async (doctors) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors))
  
  // Development rejimida db.json ga avtomatik saqlash
  if (import.meta.env.DEV) {
    try {
      const response = await fetch('/api/save-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctors }),
      })
      
      if (response.ok) {
        console.log('✅ Doctors saved to db.json successfully')
      } else {
        console.warn('⚠️ Failed to save to db.json, but data is saved in localStorage')
      }
    } catch (error) {
      // Agar API mavjud bo'lmasa (production), localStorage da saqlanadi
      console.log('Doctors saved to localStorage. db.json will be updated in development mode.')
    }
  }
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const listDoctors = async () => {
  const doctors = readDoctors()
  // sort by created_at desc if available
  return doctors.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

export const getDoctorById = async (id) => {
  const doctors = readDoctors()
  return doctors.find(d => d.id === id) || null
}

export const authenticateDoctor = async (email, password) => {
  const doctors = readDoctors()
  return doctors.find(d => d.email === email && d.password === password) || null
}

export const createDoctor = async ({ full_name, phone, email, password, is_active = true, specialization = null }) => {
  const doctors = readDoctors()
  if (doctors.some(d => d.email === email)) {
    throw new Error('Email already exists')
  }

  const now = new Date().toISOString()
  const newDoctor = {
    id: generateId(),
    full_name,
    phone,
    email,
    password,
    specialization,
    is_active,
    created_at: now,
    updated_at: now,
  }

  const updated = [newDoctor, ...doctors]
  await writeDoctors(updated)
  return newDoctor
}

export const updateDoctor = async (id, payload) => {
  const doctors = readDoctors()
  const index = doctors.findIndex(d => d.id === id)
  if (index === -1) throw new Error('Doctor not found')

  const updatedDoctor = {
    ...doctors[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }

  doctors[index] = updatedDoctor
  await writeDoctors(doctors)
  return updatedDoctor
}

export const deleteDoctor = async (id) => {
  const doctors = readDoctors()
  const filtered = doctors.filter(d => d.id !== id)
  await writeDoctors(filtered)
}

// db.json formatida export qilish (admin uchun)
export const exportToDbJson = () => {
  const doctors = readDoctors()
  const dbJson = {
    admin: dbData.admin,
    doctors: doctors
  }
  return JSON.stringify(dbJson, null, 2)
}

// db.json faylni yuklab olish (download)
export const downloadDbJson = () => {
  const jsonContent = exportToDbJson()
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'db.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
