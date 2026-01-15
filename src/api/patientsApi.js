/**
 * Patients API - Supabase REST API orqali
 * Jadval: patients
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

const TABLE = 'patients'

// Barcha bemorlarni olish
export const listPatients = async () => {
  try {
    const patients = await supabaseGet(TABLE, 'order=created_at.desc')
    console.log('✅ Patients loaded from Supabase:', patients.length)
    return patients
  } catch (error) {
    console.error('❌ Failed to fetch patients:', error)
    throw error
  }
}

// ID bo'yicha bemorni olish
export const getPatientById = async (id) => {
  try {
    const patients = await supabaseGet(TABLE, `id=eq.${id}`)
    return patients[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch patient:', error)
    throw error
  }
}

// Doktor ID bo'yicha bemorlarni olish
export const getPatientsByDoctorId = async (doctorId) => {
  try {
    const patients = await supabaseGet(TABLE, `doctor_id=eq.${doctorId}&order=created_at.desc`)
    return patients
  } catch (error) {
    console.error('❌ Failed to fetch patients by doctor:', error)
    throw error
  }
}

// 5 xonali unique ID generatsiya qilish (10000-99999)
const generateId = async () => {
  try {
    const patients = await listPatients()
    const existingIds = patients.map(p => Number(p.id))

    let newId
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
    } while (existingIds.includes(newId))

    return newId
  } catch {
    // Fallback: timestamp based ID
    return Math.floor(10000 + Math.random() * 90000)
  }
}

// Yangi bemor yaratish
export const createPatient = async ({
  full_name,
  phone,
  birth_date = null,
  gender = null,
  address = null,
  doctor_id = null,
  doctor_name = null,
  status = 'active',
  notes = null
}) => {
  try {
    const now = new Date().toISOString()
    const id = await generateId()

    const newPatient = {
      id,
      full_name,
      phone,
      birth_date: birth_date || null,
      gender: gender || null,
      address: address || null,
      doctor_id: doctor_id ? Number(doctor_id) : null,
      doctor_name: doctor_name || null,
      status,
      notes: notes || null,
      last_visit: null,
      next_appointment: null,
      created_at: now,
      updated_at: now
    }

    const result = await supabasePost(TABLE, newPatient)
    console.log('✅ Patient created:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create patient:', error)
    throw error
  }
}

// Bemor ma'lumotlarini yangilash
export const updatePatient = async (id, payload) => {
  try {
    const updateData = {
      ...payload,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const result = await supabasePatch(TABLE, id, updateData)
    console.log('✅ Patient updated:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update patient:', error)
    throw error
  }
}

// Bemorni o'chirish
export const deletePatient = async (id) => {
  try {
    await supabaseDelete(TABLE, id)
    console.log('✅ Patient deleted:', id)
    return { id }
  } catch (error) {
    console.error('❌ Failed to delete patient:', error)
    throw error
  }
}

// Initialization (Supabase uchun kerak emas, lekin backward compatibility uchun)
export const initPatients = async () => {
  // No-op for Supabase
  return true
}

// Refresh (backward compatibility)
export const refreshFromServer = async () => {
  return await listPatients()
}

// Export to JSON file
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
