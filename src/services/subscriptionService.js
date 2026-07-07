/**
 * Klinika obuna modullari (clinic_features) — Service Layer.
 * @module services/subscriptionService
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from '@/api/supabaseConfig'
import { PREMIUM_FEATURE_KEYS, isFeatureRowActive } from '@/lib/subscriptionFeatures'

const TABLE = 'clinic_features'

/**
 * @param {number|string} clinicId
 * @returns {Promise<Array>}
 */
export async function listClinicFeatures(clinicId) {
  const cid = Number(clinicId)
  if (!Number.isFinite(cid)) return []
  const rows = await supabaseGet(TABLE, `clinic_id=eq.${cid}&order=feature_key.asc`)
  return Array.isArray(rows) ? rows : []
}

/**
 * Yangi klinika uchun 4 ta premium qator (default o'chiq).
 * @param {number|string} clinicId
 */
export async function seedDefaultFeatures(clinicId) {
  const cid = Number(clinicId)
  if (!Number.isFinite(cid)) return []

  const existing = await listClinicFeatures(cid)
  const existingKeys = new Set(existing.map((r) => r.feature_key))
  const created = []

  for (const featureKey of PREMIUM_FEATURE_KEYS) {
    if (existingKeys.has(featureKey)) continue
    try {
      const result = await supabasePost(TABLE, {
        clinic_id: cid,
        feature_key: featureKey,
        is_active: false,
        expires_at: null,
      })
      if (result?.[0]) created.push(result[0])
    } catch {
      // parallel seed yoki allaqachon mavjud
    }
  }

  return created.length ? created : existing
}

/**
 * @param {number|string} clinicId
 * @param {string} featureKey
 * @param {{ is_active?: boolean, expires_at?: string|null }} patch
 */
export async function upsertClinicFeature(clinicId, featureKey, { is_active, expires_at } = {}) {
  const cid = Number(clinicId)
  if (!Number.isFinite(cid)) throw new Error('Klinika ID noto\'g\'ri')

  const existing = await supabaseGet(
    TABLE,
    `clinic_id=eq.${cid}&feature_key=eq.${encodeURIComponent(featureKey)}&limit=1`
  )

  const payload = {}
  if (typeof is_active === 'boolean') payload.is_active = is_active
  if (expires_at !== undefined) payload.expires_at = expires_at || null

  if (Array.isArray(existing) && existing[0]?.id) {
    await supabasePatchWhere(TABLE, `id=eq.${existing[0].id}`, payload)
    return { ...existing[0], ...payload }
  }

  const result = await supabasePost(TABLE, {
    clinic_id: cid,
    feature_key: featureKey,
    is_active: is_active ?? false,
    expires_at: expires_at ?? null,
  })
  return result?.[0] || null
}

/**
 * Bir nechta modulni bir vaqtda yangilash (super admin).
 * @param {number|string} clinicId
 * @param {Array<{ feature_key: string, is_active: boolean, expires_at?: string|null }>} features
 */
export async function saveClinicFeatures(clinicId, features = []) {
  const results = []
  for (const row of features) {
    if (!row?.feature_key) continue
    const saved = await upsertClinicFeature(clinicId, row.feature_key, {
      is_active: Boolean(row.is_active),
      expires_at: row.expires_at ?? null,
    })
    results.push(saved)
  }
  return results
}

/**
 * Klinikada modul faolmi (API qatlami uchun).
 * @param {number|string} clinicId
 * @param {string} featureKey
 */
export async function clinicHasActiveFeature(clinicId, featureKey) {
  const cid = Number(clinicId)
  if (!Number.isFinite(cid)) return false
  const rows = await listClinicFeatures(cid)
  const row = rows.find((r) => r.feature_key === featureKey)
  return isFeatureRowActive(row)
}

const SUBSCRIPTIONS_TABLE = 'subscriptions'

/**
 * Klinika obuna yozuvi.
 * @param {number|string} clinicId
 */
export async function getClinicSubscription(clinicId) {
  const cid = Number(clinicId)
  if (!Number.isFinite(cid)) return null
  const rows = await supabaseGet(
    SUBSCRIPTIONS_TABLE,
    `clinic_id=eq.${cid}&order=updated_at.desc&limit=1`
  )
  return Array.isArray(rows) ? rows[0] || null : null
}

/**
 * @param {number|string} clinicId
 */
export async function isClinicSubscriptionActive(clinicId) {
  const row = await getClinicSubscription(clinicId)
  if (!row || row.status !== true) return false
  if (!row.expiry_date) return true
  return new Date(row.expiry_date).getTime() > Date.now()
}
