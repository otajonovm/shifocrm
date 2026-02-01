/**
 * Doctors API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import {
  getDefaultClinicId,
  assertDoctorLimitNotReached,
  MAX_DOCTORS_ERROR
} from '@/services/adminService'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'doctors'

export const listDoctors = async () => {
  try {
    const cid = await getCurrentClinicId()
    return await supabaseGetWithClinicFallback(TABLE, 'order=created_at.desc', cid)
  } catch (error) {
    console.error('❌ Failed to fetch doctors:', error)
    throw error
  }
}

export const getDoctorById = async (id) => {
  try {
    const numId = Number(id)
    if (!Number.isFinite(numId)) return null
    const cid = await getCurrentClinicId()
    const rows = await supabaseGetWithClinicFallback(TABLE, `id=eq.${numId}`, cid)
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch doctor:', error)
    throw error
  }
}

// Doktor autentifikatsiyasi (telefon raqami va parol bo'yicha)
export const authenticateDoctor = async (phone, password) => {
  try {
    // Supabase da telefon raqami va password bo'yicha qidirish
    const doctors = await supabaseGet(TABLE, `phone=eq.${encodeURIComponent(phone)}&password=eq.${encodeURIComponent(password)}`)
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

// Yangi doktor yaratish (max_doctors limit tekshiriladi)
export const createDoctor = async ({
  full_name,
  phone,
  email,
  password,
  is_active = true,
  specialization = null,
  clinic_id: rawClinicId = null
}) => {
  try {
    const clinicId = rawClinicId != null
      ? Number(rawClinicId)
      : (await getCurrentClinicId()) ?? (await getDefaultClinicId())
    if (!Number.isFinite(clinicId)) {
      throw new Error('Clinic not found. Create a clinic first (Super Admin).')
    }
    await assertDoctorLimitNotReached(clinicId)

    // Telefon raqami bo'yicha tekshirish (login uchun telefon ishlatiladi)
    const existing = await supabaseGet(TABLE, `phone=eq.${encodeURIComponent(phone)}&clinic_id=eq.${clinicId}`)
    if (existing && existing.length > 0) {
      throw new Error('Telefon raqami allaqachon mavjud')
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
      clinic_id: clinicId,
      created_at: now,
      updated_at: now
    }

    const result = await supabasePost(TABLE, newDoctor)
    console.log('✅ Doctor created:', result[0])
    return result[0]
  } catch (error) {
    if (error.code === 'MAX_DOCTORS_REACHED' || error.message === MAX_DOCTORS_ERROR) {
      throw error
    }
    console.error('❌ Failed to create doctor:', error)
    throw error
  }
}

// Doktor ma'lumotlarini yangilash
export const updateDoctor = async (id, payload) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
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

    const numId = Number(id)
    if (!Number.isFinite(numId)) throw new Error('Invalid doctor id')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    console.log('✅ Doctor updated:', result[0])
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update doctor:', error)
    throw error
  }
}

// Doktorni o'chirish
export const deleteDoctor = async (id) => {
  try {
    const doctorId = Number(id)
    if (!Number.isFinite(doctorId)) throw new Error('Invalid doctor id')
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const q = mergeClinicQuery(`id=eq.${doctorId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Doctor deleted:', id)
    return { id }
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase()
    // If there are patients linked to this doctor, unassign them first then retry delete
    if (/foreign key constraint|patients_doctor_id_fkey/.test(msg)) {
      try {
        const cid = await getCurrentClinicId()
        const base = `doctor_id=eq.${Number(id)}`
        const q = mergeClinicQuery(base, cid)
        await supabasePatchWhere('patients', q, {
          doctor_id: null,
          doctor_name: null,
          updated_at: new Date().toISOString()
        })
        const delQ = mergeClinicQuery(`id=eq.${Number(id)}`, cid)
        await supabaseDeleteWhere(TABLE, delQ)
        console.log('✅ Doctor deleted (after unassigning patients):', id)
        return { id }
      } catch (e2) {
        console.error('❌ Failed to delete doctor (after unassign):', e2)
        throw e2
      }
    }

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
