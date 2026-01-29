/**
 * Treatment Plans API - Supabase REST API orqali
 * Jadval: treatment_plans
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback, mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'treatment_plans'

export const getPlansByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    const cid = await getCurrentClinicId()
    const q = `patient_id=eq.${numId}&order=planned_date.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plans by patient:', error)
    throw error
  }
}

export const getPlansByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const numId = Number(doctorId)
    const cid = await getCurrentClinicId()
    const q = `doctor_id=eq.${numId}&planned_date=gte.${startDate}&planned_date=lte.${endDate}&order=planned_date.asc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plans by doctor:', error)
    throw error
  }
}

export const createPlan = async ({
  patient_id,
  doctor_id = null,
  visit_id = null,
  title,
  planned_date,
  status = 'planned',
  priority = 'medium',
  tooth_id = null,
  estimated_cost = null,
  notes = null,
  remind_at = null
}) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const payload = {
      patient_id: Number(patient_id),
      doctor_id: doctor_id !== null && doctor_id !== undefined ? Number(doctor_id) : null,
      visit_id: visit_id !== null && visit_id !== undefined ? Number(visit_id) : null,
      title,
      planned_date,
      status,
      priority,
      tooth_id: tooth_id !== null && tooth_id !== undefined ? Number(tooth_id) : null,
      estimated_cost: estimated_cost !== null && estimated_cost !== undefined ? Number(estimated_cost) : null,
      notes: notes || null,
      remind_at: remind_at || null,
      clinic_id: cid
    }
    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create treatment plan:', error)
    throw error
  }
}

export const updatePlan = async (planId, payload) => {
  try {
    const numId = Number(planId)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid plan ID')
    }
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, payload)
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update treatment plan:', error)
    throw error
  }
}

export const updatePlanStatus = async (planId, status) => {
  return updatePlan(planId, { status })
}
