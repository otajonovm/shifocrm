/**
 * Appointments API
 * Bemor qabullarini boshqarish
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'appointments'

/**
 * Barcha qabullarni olish (klinika bo'yicha)
 */
export const listAppointments = async (query = 'order=scheduled_at.desc') => {
  try {
    const cid = await getCurrentClinicId()
    return await supabaseGetWithClinicFallback(TABLE, query, cid)
  } catch (error) {
    console.error('❌ Failed to fetch appointments:', error)
    throw error
  }
}

/**
 * Bemor uchun qabullarni olish
 */
export const getAppointmentsByPatientId = async (patientId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `patient_id=eq.${Number(patientId)}&order=scheduled_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch appointments by patient:', error)
    throw error
  }
}

/**
 * Shifokor uchun qabullarni olish
 */
export const getAppointmentsByDoctorId = async (doctorId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${Number(doctorId)}&order=scheduled_at.asc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch appointments by doctor:', error)
    throw error
  }
}

/**
 * Qabul ID bo'yicha olish
 */
export const getAppointmentById = async (id) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `id=eq.${Number(id)}`
    const result = await supabaseGetWithClinicFallback(TABLE, q, cid)
    return result?.[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch appointment:', error)
    throw error
  }
}

/**
 * Yangi qabul yaratish
 */
export const createAppointment = async (data) => {
  try {
    const cid = data?.clinic_id != null && Number.isFinite(Number(data.clinic_id))
      ? Number(data.clinic_id)
      : await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan')

    const payload = {
      clinic_id: cid,
      patient_id: data.patient_id != null && Number.isFinite(Number(data.patient_id))
        ? Number(data.patient_id)
        : null,
      doctor_id: data.doctor_id ? Number(data.doctor_id) : null,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes || 30,
      status: data.status || 'scheduled',
      notes: data.notes || null,
      visit_id: data.visit_id ? Number(data.visit_id) : null,
      reminder_24h_sent: false,
      reminder_1h_sent: false
    }

    const result = await supabasePost(TABLE, payload)
    console.log('✅ Appointment created:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to create appointment:', error)
    throw error
  }
}


export const updateAppointment = async (id, data) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan')

    const numId = Number(id)
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)

    const payload = {}
    if (data.patient_id !== undefined) payload.patient_id = Number(data.patient_id)
    if (data.doctor_id !== undefined) payload.doctor_id = data.doctor_id ? Number(data.doctor_id) : null
    if (data.scheduled_at !== undefined) payload.scheduled_at = data.scheduled_at
    if (data.duration_minutes !== undefined) payload.duration_minutes = Number(data.duration_minutes)
    if (data.status !== undefined) payload.status = data.status
    if (data.notes !== undefined) payload.notes = data.notes
    if (data.reminder_24h_sent !== undefined) payload.reminder_24h_sent = Boolean(data.reminder_24h_sent)
    if (data.reminder_1h_sent !== undefined) payload.reminder_1h_sent = Boolean(data.reminder_1h_sent)
    if (data.visit_id !== undefined) payload.visit_id = data.visit_id ? Number(data.visit_id) : null

    const result = await supabasePatchWhere(TABLE, q, payload)
    console.log('✅ Appointment updated:', id)
    return result?.[0] || null
  } catch (error) {
    console.error('❌ Failed to update appointment:', error)
    throw error
  }
}


export const deleteAppointment = async (id) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan')

    const numId = Number(id)
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)

    await supabaseDeleteWhere(TABLE, q)
    console.log('✅ Appointment deleted:', id)
    return true
  } catch (error) {
    console.error('❌ Failed to delete appointment:', error)
    throw error
  }
}


export const updateAppointmentStatus = async (id, status) => {
  return updateAppointment(id, { status })
}


export const mark24HourReminderSent = async (id) => {
  return updateAppointment(id, { reminder_24h_sent: true })
}


export const mark1HourReminderSent = async (id) => {
  return updateAppointment(id, { reminder_1h_sent: true })
}


export const getTodayAppointments = async (doctorId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const cid = await getCurrentClinicId()
    const q = `and(doctor_id.eq.${Number(doctorId)},scheduled_at.gte.${today.toISOString()},scheduled_at.lt.${tomorrow.toISOString()})&order=scheduled_at.asc`

    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch today appointments:', error)
    throw error
  }
}

/**
 * Kelgusi qabullarni olish (bemor uchun)
 */
export const getUpcomingAppointments = async (patientId, days = 30) => {
  try {
    const now = new Date()
    const future = new Date(now)
    future.setDate(future.getDate() + days)

    const cid = await getCurrentClinicId()
    const q = `and(patient_id.eq.${Number(patientId)},scheduled_at.gte.${now.toISOString()},scheduled_at.lte.${future.toISOString()},status.in.('scheduled','confirmed'))&order=scheduled_at.asc`

    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch upcoming appointments:', error)
    throw error
  }
}

/**
 * Sana oralig'idagi qabullar
 */
export const getAppointmentsByDateRange = async (startDate, endDate, doctorId = null) => {
  try {
    const cid = await getCurrentClinicId()
    const startIso = `${String(startDate).slice(0, 10)}T00:00:00`
    const endIso = `${String(endDate).slice(0, 10)}T23:59:59`
    let q = `and(scheduled_at.gte.${startIso},scheduled_at.lte.${endIso})&order=scheduled_at.asc`
    if (doctorId) {
      q = `and(doctor_id.eq.${Number(doctorId)},scheduled_at.gte.${startIso},scheduled_at.lte.${endIso})&order=scheduled_at.asc`
    }
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch appointments by date range:', error)
    throw error
  }
}
