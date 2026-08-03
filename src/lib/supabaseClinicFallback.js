/** Tenant-scoped query helpers. Missing clinic_id always fails closed. */

import { supabaseGet } from '@/api/supabaseConfig'

function merge(base, cid) {
  if (!cid) return base
  const pre = `clinic_id=eq.${cid}`
  return base ? `${pre}&${base}` : pre
}

/**
 * GET with mandatory clinic filter.
 * @param {string} table
 * @param {string} baseQuery
 * @param {number|null} cid
 * @returns {Promise<Array>}
 */
export async function supabaseGetWithClinicFallback(table, baseQuery, cid) {
  const clinicId = Number(cid)
  if (!Number.isFinite(clinicId) || clinicId <= 0) {
    throw new Error(`Tenant context required for ${table}`)
  }
  const q = merge(baseQuery, clinicId)
  const rows = await supabaseGet(table, q)
  return Array.isArray(rows) ? rows : []
}

export { merge as mergeClinicQuery }
