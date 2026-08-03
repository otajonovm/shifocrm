import { supabaseGet } from '@/api/supabaseConfig'

const CLINICS_TABLE = 'clinics'
const DOCTORS_TABLE = 'doctors'

export async function getClinicByPublicSlug(slug) {
  const safeSlug = String(slug || '').trim().toLowerCase()
  if (!safeSlug) return null
  try {
    const selectVariants = [
      'id,name,slug,is_active,logo_url,description,address,location_url,work_schedule',
      'id,name,slug,is_active,logo_url,description,address,location_url',
      'id,name,slug,is_active,logo_url',
      'id,name,slug,is_active',
    ]
    for (const select of selectVariants) {
      try {
        const rows = await supabaseGet(
          CLINICS_TABLE,
          `slug=eq.${encodeURIComponent(safeSlug)}&is_active=eq.true&limit=1&select=${select}`,
        )
        return Array.isArray(rows) && rows[0] ? rows[0] : null
      } catch (error) {
        const status = Number(error?.status || 0)
        if (status === 401 || status === 403) return null
        if (status === 400) continue
        throw error
      }
    }
    return null
  } catch (error) {
    console.error('❌ getClinicByPublicSlug failed:', error)
    return null
  }
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
