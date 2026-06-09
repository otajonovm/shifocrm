/**
 * Activity Logs API - audit jurnalini o'qish uchun (read-only).
 *
 * `activity_logs` jadvalida `clinic_id` ustuni yo'q, shuning uchun klinika
 * bo'yicha filtrlash `details->>clinic_id` orqali (yoki klient tomonida)
 * amalga oshiriladi.
 */

import { supabaseGet } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'

const TABLE = 'activity_logs'

/** Berilgan log yozuvidan klinika ID sini turli formatlardan chiqaradi. */
const extractClinicId = (log) => {
  const d = log?.details || {}
  const candidates = [d.clinic_id, d?.meta?.clinic_id, d?.new?.clinic_id, d?.old?.clinic_id]
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
