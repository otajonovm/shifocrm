// Online JSON Server API (my-json-server.typicode.com - READ ONLY!)
// Format: https://my-json-server.typicode.com/{github-username}/{repo-name}/{resource}
const API_BASE = 'https://my-json-server.typicode.com/otajonovm/shifocrm'
const STORAGE_KEY = 'shifocrm_doctors'
const DATA_LOADED_KEY = 'shifocrm_doctors_loaded'

const fetchDoctorsFromServer = async () => {
  try {
    const response = await fetch(`${API_BASE}/doctors`)
    if (!response.ok) throw new Error(`Server error: ${response.status}`)
    const doctors = await response.json()
    if (Array.isArray(doctors) && doctors.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors))
      localStorage.setItem(DATA_LOADED_KEY, 'true')
      console.log('✅ Doctors loaded from online server:', doctors.length)
      return doctors
    }
    return []
  } catch (error) {
    console.error('❌ Failed to fetch doctors from server:', error)
    return null
  }
}

// localStorage dan doktorlarni o'qish
const readDoctors = () => {
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

// localStorage ga doktorlarni yozish
const writeDoctors = async (doctors) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors))
  console.log('✅ Doctors saved to localStorage')
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = () => {
  const doctors = readDoctors()
  const existingIds = doctors.map(d => Number(d.id))

  let newId
  do {
    newId = Math.floor(10000 + Math.random() * 90000)
  } while (existingIds.includes(newId))

  return newId
}

// Initialization - serverdan yuklash yoki localStorage dan olish
export const initDoctors = async () => {
  const loaded = localStorage.getItem(DATA_LOADED_KEY)
  if (!loaded) {
    await fetchDoctorsFromServer()
  }
}

// Barcha doktorlarni olish
export const listDoctors = async () => {
  // Agar localStorage bo'sh bo'lsa, serverdan yuklash
  let doctors = readDoctors()
  if (doctors.length === 0) {
    const serverDoctors = await fetchDoctorsFromServer()
    if (serverDoctors) {
      doctors = serverDoctors
    }
  }
  return doctors.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

// ID bo'yicha doktorni olish
export const getDoctorById = async (id) => {
  const doctors = readDoctors()
  return doctors.find(d => d.id === id || d.id === Number(id)) || null
}

// Doktor autentifikatsiyasi
export const authenticateDoctor = async (email, password) => {
  let doctors = readDoctors()
  if (doctors.length === 0) {
    await fetchDoctorsFromServer()
    doctors = readDoctors()
  }
  return doctors.find(d => d.email === email && d.password === password) || null
}

// Yangi doktor yaratish
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

// Doktor ma'lumotlarini yangilash
export const updateDoctor = async (id, payload) => {
  const doctors = readDoctors()
  const numId = Number(id)
  const index = doctors.findIndex(d => d.id === id || d.id === numId)

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

// Doktorni o'chirish
export const deleteDoctor = async (id) => {
  const doctors = readDoctors()
  const numId = Number(id)
  const filtered = doctors.filter(d => d.id !== id && d.id !== numId)
  await writeDoctors(filtered)
}

// Ma'lumotlarni serverdan qayta yuklash (refresh)
export const refreshFromServer = async () => {
  localStorage.removeItem(DATA_LOADED_KEY)
  return await fetchDoctorsFromServer()
}

// Export to JSON file
export const downloadDbJson = () => {
  const doctors = readDoctors()
  const data = { doctors }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'doctors.json'
  a.click()
  URL.revokeObjectURL(url)
}
