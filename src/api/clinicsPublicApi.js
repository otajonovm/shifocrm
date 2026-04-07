import { supabaseGet } from '@/api/supabaseConfig'

const CLINICS_TABLE = 'clinics'
const DOCTORS_TABLE = 'doctors'

export async function getClinicByPublicSlug(slug) {
  const safeSlug = String(slug || '').trim().toLowerCase()
  if (!safeSlug) return null
  const rows = await supabaseGet(
    CLINICS_TABLE,
    `slug=eq.${encodeURIComponent(safeSlug)}&is_active=eq.true&limit=1`
  )
  return Array.isArray(rows) && rows[0] ? rows[0] : null
}

export async function getPublicDoctorsByClinic(clinicId) {
  const id = Number(clinicId)
  if (!Number.isFinite(id)) return []
  const rows = await supabaseGet(
    DOCTORS_TABLE,
    `clinic_id=eq.${id}&is_active=eq.true&is_public=eq.true&order=full_name.asc`
  )
  return Array.isArray(rows) ? rows : []
}
