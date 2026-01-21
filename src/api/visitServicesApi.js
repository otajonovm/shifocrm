/**
 * Visit Services API - Supabase REST API orqali
 * Jadval: visit_services
 */

import { supabaseGet, supabasePost } from './supabaseConfig'

const TABLE = 'visit_services'

export const getVisitServicesByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    return await supabaseGet(TABLE, `patient_id=eq.${numId}&order=created_at.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch visit services by patient:', error)
    throw error
  }
}

export const getVisitServicesByVisitId = async (visitId) => {
  try {
    const numId = Number(visitId)
    return await supabaseGet(TABLE, `visit_id=eq.${numId}&order=created_at.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch visit services by visit:', error)
    throw error
  }
}

export const createVisitService = async ({
  visit_id,
  patient_id,
  doctor_id = null,
  tooth_id = null,
  service_name,
  price = 0,
  performed_by = null
}) => {
  try {
    const payload = {
      visit_id: Number(visit_id),
      patient_id: Number(patient_id),
      doctor_id: doctor_id !== null && doctor_id !== undefined ? Number(doctor_id) : null,
      tooth_id: tooth_id !== null && tooth_id !== undefined ? Number(tooth_id) : null,
      service_name,
      price: Number(price) || 0,
      performed_by: performed_by || null
    }
    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create visit service:', error)
    throw error
  }
}
