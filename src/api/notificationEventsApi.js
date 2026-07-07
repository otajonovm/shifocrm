/**
 * Notification events — ROI attribution (Telegram eslatmalar).
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'notification_events'
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export const listNotificationEvents = async ({ since, limit = 500 } = {}) => {
  const cid = await getCurrentClinicId()
  if (!cid) return []

  let query = `clinic_id=eq.${cid}&order=sent_at.desc&limit=${Number(limit) || 500}`
  if (since) {
    query += `&sent_at=gte.${encodeURIComponent(new Date(since).toISOString())}`
  }

  try {
    const rows = await supabaseGet(TABLE, query)
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    if (error?.status === 404 || error?.code === '42P01') return []
    console.warn('notification_events fetch:', error?.message)
    return []
  }
}

/**
 * Qabul/to'lov yaratilganda eng yaqin yuborilgan eslatmaga daromad bog'laydi.
 */
export const tryAttributeVisitRevenue = async ({
  visitId,
  patientId,
  amount,
  clinicId = null,
}) => {
  const cid = clinicId != null ? Number(clinicId) : await getCurrentClinicId()
  const pid = patientId != null ? Number(patientId) : null
  const vid = visitId != null ? Number(visitId) : null
  const amt = Number(amount) || 0

  if (!cid || !pid || !vid || amt <= 0) return null

  const since = new Date(Date.now() - ATTRIBUTION_WINDOW_MS).toISOString()
  const query = mergeClinicQuery(
    `patient_id=eq.${pid}&attributed_visit_id=is.null&sent_at=gte.${encodeURIComponent(since)}&order=sent_at.desc&limit=5`,
    cid
  )

  let events = []
  try {
    events = await supabaseGet(TABLE, query)
  } catch {
    return null
  }

  const event = Array.isArray(events) ? events[0] : null
  if (!event?.id) return null

  try {
    const patchQ = mergeClinicQuery(`id=eq.${event.id}`, cid)
    const result = await supabasePatchWhere(TABLE, patchQ, {
      attributed_visit_id: vid,
      attributed_amount: amt,
    })
    return result?.[0] || null
  } catch {
    return null
  }
}

export const createNotificationEvent = async (payload) => {
  try {
    const result = await supabasePost(TABLE, {
      channel: 'telegram',
      sent_at: new Date().toISOString(),
      meta: {},
      ...payload,
    })
    return result?.[0] || null
  } catch (error) {
    console.warn('notification_events insert:', error?.message)
    return null
  }
}

export const updateNotificationEventAction = async (eventId, { patientAction, actionAt = null }) => {
  if (!eventId) return null
  try {
    const result = await supabasePatchWhere(
      TABLE,
      `id=eq.${encodeURIComponent(eventId)}`,
      {
        patient_action: patientAction,
        action_at: actionAt || new Date().toISOString(),
      }
    )
    return result?.[0] || null
  } catch {
    return null
  }
}

export const updateLeadRecallAction = async (leadId, patientAction) => {
  if (!leadId) return null
  try {
    const rows = await supabaseGet(
      TABLE,
      `source_table=eq.leads&source_id=eq.${encodeURIComponent(String(leadId))}&event_type=eq.lead_2h_recall&order=sent_at.desc&limit=1`
    )
    const event = Array.isArray(rows) ? rows[0] : null
    if (!event?.id) return null
    return updateNotificationEventAction(event.id, { patientAction })
  } catch {
    return null
  }
}
