/**
 * clinic_id bilan so'rov 400 bersa (ustun yo'q), filtersiz qayta urinish.
 * Filtrlab olib kelishda xato ketmasligi uchun.
 */

import { supabaseGet } from '@/api/supabaseConfig'

function merge(base, cid) {
  if (!cid) return base
  const pre = `clinic_id=eq.${cid}`
  return base ? `${pre}&${base}` : pre
}

function is400OrClinicMissing(e) {
  const st = e && (typeof e.status === 'number' ? e.status : Number(e.status))
  if (st === 400) return true
  const m = (e?.message || '').toLowerCase()
  return /clinic_id|column.*does not exist/.test(m)
}

/**
 * GET with clinic filter; on 400 / clinic_id missing, retry without filter.
 * cid bo'lmasa filtersiz oladi (filtrlab olib kelish ishlashi uchun).
 * @param {string} table
 * @param {string} baseQuery
 * @param {number|null} cid
 * @returns {Promise<Array>}
 */
export async function supabaseGetWithClinicFallback(table, baseQuery, cid) {
  if (!cid) {
    const rows = await supabaseGet(table, baseQuery)
    return Array.isArray(rows) ? rows : []
  }
  try {
    const q = merge(baseQuery, cid)
    const rows = await supabaseGet(table, q)
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    if (!is400OrClinicMissing(err)) throw err
    const rows = await supabaseGet(table, baseQuery)
    return Array.isArray(rows) ? rows : []
  }
}

export { merge as mergeClinicQuery }
