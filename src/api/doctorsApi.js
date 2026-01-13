const STORAGE_KEY = 'doctors'

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

const writeDoctors = (doctors) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors))
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
  writeDoctors(updated)
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
  writeDoctors(doctors)
  return updatedDoctor
}

export const deleteDoctor = async (id) => {
  const doctors = readDoctors()
  const filtered = doctors.filter(d => d.id !== id)
  writeDoctors(filtered)
}
