/**
 * Activity Logs API - audit jurnalini o'qish uchun (read-only).
 *
 * `activity_logs` jadvalida `clinic_id` ustuni yo'q, shuning uchun klinika
 * bo'yicha filtrlash `details->>clinic_id` orqali (yoki klient tomonida)
 * amalga oshiriladi.
 */

import { supabaseGet, REST_URL, getHeaders } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'

const TABLE = 'activity_logs'

/** Berilgan log yozuvidan klinika ID sini turli formatlardan chiqaradi. */
const extractClinicId = (log) => {
  const d = log?.details || {}
  const candidates = [log?.clinic_id, d.clinic_id, d?.meta?.clinic_id, d?.new?.clinic_id, d?.old?.clinic_id]
  for (const c of candidates) {
    if (c != null) {
      const n = Number(c)
      if (Number.isFinite(n)) return n
    }
  }
  return null
}

/**
 * So'nggi audit yozuvlarini oladi (clinic_id bo'yicha filtrlangan).
 * @param {object} [opts]
 * @param {number} [opts.limit=200]
 * @param {string|null} [opts.action] - 'payment.delete' kabi aniq amal filtri
 */
export const listActivityLogs = async ({ limit = 200, action = null } = {}) => {
  try {
    const cid = await getCurrentClinicId()
    let query = `order=created_at.desc&limit=${Number(limit) || 200}`
    if (action) {
      query += `&action=eq.${encodeURIComponent(action)}`
    }
    const rows = await supabaseGet(TABLE, query)
    const list = Array.isArray(rows) ? rows : []

    if (cid == null) return list

    // Klinika bo'yicha filtr: faqat shu klinikaga tegishli yoki klinikasi
    // belgilanmagan (eski) yozuvlar.
    return list.filter((log) => {
      const logClinic = extractClinicId(log)
      return logClinic == null || logClinic === Number(cid)
    })
  } catch (error) {
    console.error('❌ Failed to fetch activity logs:', error)
    throw error
  }
}

/**
 * Belgilangan sanadan keyingi audit yozuvlari.
 */
export const listActivityLogsSince = async ({ since, limit = 5000, action = null } = {}) => {
  try {
    const cid = await getCurrentClinicId()
    const sinceIso = since instanceof Date ? since.toISOString() : String(since || '')
    let query = `order=created_at.desc&limit=${Number(limit) || 5000}`
    if (sinceIso) {
      query += `&created_at=gte.${encodeURIComponent(sinceIso)}`
    }
    if (action) {
      query += `&action=eq.${encodeURIComponent(action)}`
    }
    if (cid != null) {
      query += `&or=(clinic_id.eq.${cid},clinic_id.is.null)`
    }

    const rows = await supabaseGet(TABLE, query)
    const list = Array.isArray(rows) ? rows : []

    if (cid == null) return list

    return list.filter((log) => {
      const logClinic = extractClinicId(log)
      return logClinic == null || logClinic === Number(cid)
    })
  } catch (error) {
    console.error('❌ Failed to fetch activity logs since:', error)
    throw error
  }
}

/** RPC: get_staff_engagement_stats */
export const fetchStaffEngagementRpc = async (clinicId, sinceDays = 90) => {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
  const url = `${REST_URL}/rpc/get_staff_engagement_stats`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        p_clinic_id: Number(clinicId),
        p_since: since,
      }),
    })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
