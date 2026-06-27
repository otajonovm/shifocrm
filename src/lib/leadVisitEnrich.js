/**
 * patient_id bo'lmagan onlayn visitlarga lead ism/telefon qo'shish
 */

import { supabaseGet } from '@/api/supabaseConfig'

export async function enrichVisitsWithLeadInfo(visits = []) {
  if (!Array.isArray(visits) || visits.length === 0) return visits

  const leadIds = [
    ...new Set(
      visits
        .filter((v) => v?.lead_id && !v?.patient_id)
        .map((v) => Number(v.lead_id))
        .filter(Number.isFinite),
    ),
  ]

  if (!leadIds.length) return visits

  let leads = []
  try {
    leads = await supabaseGet('leads', `id=in.(${leadIds.join(',')})`)
  } catch {
    return visits
  }

  const byId = new Map((leads || []).map((l) => [Number(l.id), l]))

  return visits.map((visit) => {
    if (visit.patient_id || !visit.lead_id) return visit
    const lead = byId.get(Number(visit.lead_id))
    if (!lead) return visit
    return {
      ...visit,
      patient_name: lead.patient_name || visit.patient_name,
      phone: lead.phone || visit.phone,
      lead_status: lead.status,
    }
  })
}
