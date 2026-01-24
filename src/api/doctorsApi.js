/**
 * Doctors API - Supabase REST API orqali
 * Jadval: doctors (yoki crm - Supabase jadval nomiga qarab o'zgartiring)
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

const TABLE = 'doctors'  // Yoki 'crm' - jadval nomiga qarab o'zgartiring

// Barcha doktorlarni olish
export const listDoctors = async () => {
  try {
    const doctors = await supabaseGet(TABLE, 'order=created_at.desc')
    console.log('✅ Doctors loaded from Supabase:', doctors.length)
    return doctors
  } catch (error) {
    console.error('❌ Failed to fetch doctors:', error)
    throw error
  }
}

// ID bo'yicha doktorni olish
export const getDoctorById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) {
      return null
    }
    const doctors = await supabaseGet(TABLE, `id=eq.${numId}`)
    return doctors[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch doctor:', error)
    throw error
  }
}

// Doktor autentifikatsiyasi
export const authenticateDoctor = async (email, password) => {
  try {
    // Supabase da email va password bo'yicha qidirish
    const doctors = await supabaseGet(TABLE, `email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`)
    return doctors[0] || null
  } catch (error) {
    console.error('❌ Failed to authenticate doctor:', error)
    return null
  }
}

const generateId = async () => {
  try {
    const doctors = await listDoctors()
    const existingIds = doctors.map(d => Number(d.id))

    let newId
    do {
      newId = Math.floor(10000 + Math.random() * 90000)
    } while (existingIds.includes(newId))

    return newId
  } catch {
    // Fallback: random ID
    return Math.floor(10000 + Math.random() * 90000)
  }
}

// Yangi doktor yaratish
export const createDoctor = async ({
  full_name,
  phone,
  email,
  password,
  is_active = true,
  specialization = null
}) => {
  try {
    // Email mavjudligini tekshirish
    const existing = await supabaseGet(TABLE, `email=eq.${encodeURIComponent(email)}`)
    if (existing.length > 0) {
      throw new Error('Email already exists')
    }

    const now = new Date().toISOString()
    const id = await generateId()

    const newDoctor = {
      id,
      full_name,
      phone,
      email,
      password,
      specialization,
      is_active,
      created_at: now,
      updated_at: now
    }

    const result = await supabasePost(TABLE, newDoctor)
    console.log('✅ Doctor created:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create doctor:', error)
    throw error
  }
}

// Doktor ma'lumotlarini yangilash
export const updateDoctor = async (id, payload) => {
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
    console.log('✅ Doctor updated:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update doctor:', error)
    throw error
  }
}

// Doktorni o'chirish
export const deleteDoctor = async (id) => {
  try {
    await supabaseDelete(TABLE, id)
    console.log('✅ Doctor deleted:', id)
    return { id }
  } catch (error) {
    console.error('❌ Failed to delete doctor:', error)
    throw error
  }
}

// Initialization (backward compatibility)
export const initDoctors = async () => {
  return true
}

// Refresh (backward compatibility)
export const refreshFromServer = async () => {
  return await listDoctors()
}

// Export to JSON file
export const downloadDbJson = async () => {
  const doctors = await listDoctors()
  const data = { doctors }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'doctors.json'
  a.click()
  URL.revokeObjectURL(url)
}
