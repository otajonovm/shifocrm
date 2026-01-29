/**
 * Visit Services API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabaseGet, supabasePost } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'

const TABLE = 'visit_services'

export const getVisitServicesByPatientId = async (patientId) => {
  const cid = await getCurrentClinicId()
  const q = `patient_id=eq.${Number(patientId)}&order=created_at.desc`
  return await supabaseGetWithClinicFallback(TABLE, q, cid)
}

export const getVisitServicesByVisitId = async (visitId) => {
  const cid = await getCurrentClinicId()
  const q = `visit_id=eq.${Number(visitId)}&order=created_at.desc`
  return await supabaseGetWithClinicFallback(TABLE, q, cid)
}

/** visit_id=in.(...) — view/report aggregate uchun; clinic_id ishlatilmaydi */
export const getVisitServicesByVisitIds = async (visitIds) => {
  if (!visitIds || !visitIds.length) return []
  const uniq = [...new Set(visitIds.map((id) => Number(id)).filter(Number.isFinite))]
  if (!uniq.length) return []
  const inList = uniq.join(',')
  const q = `visit_id=in.(${inList})&order=created_at.desc`
  const cid = await getCurrentClinicId()
  return await supabaseGetWithClinicFallback(TABLE, q, cid)
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
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const payload = {
    visit_id: Number(visit_id),
    patient_id: Number(patient_id),
    doctor_id: doctor_id != null ? Number(doctor_id) : null,
    tooth_id: tooth_id != null ? Number(tooth_id) : null,
    service_name,
    price: Number(price) || 0,
    performed_by: performed_by || null,
    clinic_id: cid
  }
  const result = await supabasePost(TABLE, payload)
  return result[0]
}
