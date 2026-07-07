/**
 * Modulli obuna — feature kalitlari va yordamchi funksiyalar.
 */

export const FEATURE_KEYS = Object.freeze({
  WAREHOUSE: 'warehouse',
  SMS_MARKETING: 'sms_marketing',
  KPI_FINANCE: 'kpi_finance',
  SHIFO_AI: 'shifo_ai',
})

export const PREMIUM_FEATURE_KEYS = Object.freeze([
  FEATURE_KEYS.WAREHOUSE,
  FEATURE_KEYS.SMS_MARKETING,
  FEATURE_KEYS.KPI_FINANCE,
  FEATURE_KEYS.SHIFO_AI,
])

/** Route → feature_key */
export const FEATURE_ROUTE_MAP = Object.freeze({
  [FEATURE_KEYS.WAREHOUSE]: '/inventory',
  [FEATURE_KEYS.KPI_FINANCE]: '/reports',
  [FEATURE_KEYS.SMS_MARKETING]: null,
  [FEATURE_KEYS.SHIFO_AI]: null,
})

/** Core — DB yozuvsiz, doim ochiq */
export const CORE_ROUTE_PREFIXES = Object.freeze([
  '/patients',
  '/appointments',
  '/my-appointments',
  '/services',
  '/dashboard',
  '/settings',
  '/doctor/profile',
  '/treatment-plans',
  '/my-leads',
  '/leads',
])

export const isPremiumFeatureKey = (key) =>
  PREMIUM_FEATURE_KEYS.includes(String(key || '').trim())

/**
 * @param {{ is_active?: boolean, expires_at?: string|null }|null|undefined} row
 */
export const isFeatureRowActive = (row) => {
  if (!row || row.is_active !== true) return false
  if (!row.expires_at) return true
  return new Date(row.expires_at).getTime() > Date.now()
}

export const buildFeaturesMap = (rows = []) => {
  const map = {}
  for (const key of PREMIUM_FEATURE_KEYS) {
    map[key] = { feature_key: key, is_active: false, expires_at: null }
  }
  for (const row of rows) {
    const key = row?.feature_key
    if (!key || !isPremiumFeatureKey(key)) continue
    map[key] = {
      feature_key: key,
      is_active: Boolean(row.is_active),
      expires_at: row.expires_at || null,
      id: row.id,
      clinic_id: row.clinic_id,
    }
  }
  return map
}
