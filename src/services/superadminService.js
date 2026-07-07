import { supabaseGet } from '@/api/supabaseConfig'
import { isFeatureRowActive, PREMIUM_FEATURE_KEYS } from '@/lib/subscriptionFeatures'

const AUDIT_LOGS_TABLE = 'audit_logs'
const CLINIC_FEATURES_TABLE = 'clinic_features'

const formatDateParam = (value, endOfDay = false) => {
  if (!value) return null
  if (String(value).includes('T')) return value
  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`
}

const isSoloClinicSlug = (slug) => String(slug || '').startsWith('solo-')

const getFeatureStatus = (row) => {
  if (!row?.is_active) return 'inactive'
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return 'expired'
  if (row.expires_at) {
    const daysLeft = (new Date(row.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysLeft <= 14) return 'expiring_soon'
  }
  return 'active'
}

export async function getTotalEngagement() {
  const [profiles, auditLogs] = await Promise.all([
    supabaseGet('profiles', 'select=user_id,account_type,member_role,clinic_id'),
    supabaseGet(AUDIT_LOGS_TABLE, 'select=user_id,action,created_at&order=created_at.desc'),
  ])

  const uniqueUsers = new Set()
  const loginMap = new Map()

  for (const profile of profiles || []) {
    if (profile?.user_id) uniqueUsers.add(String(profile.user_id))
  }

  for (const row of auditLogs || []) {
    const userId = row?.user_id ? String(row.user_id) : 'anonymous'
    if (!loginMap.has(userId)) {
      loginMap.set(userId, {
        userId,
        loginCount: 0,
        logoutCount: 0,
        lastSeenAt: null,
      })
    }
    const item = loginMap.get(userId)
    if (row.action === 'login') item.loginCount += 1
    if (row.action === 'logout') item.logoutCount += 1
    if (!item.lastSeenAt || new Date(row.created_at) > new Date(item.lastSeenAt)) {
      item.lastSeenAt = row.created_at
    }
  }

  const totalLogins = Array.from(loginMap.values()).reduce((sum, row) => sum + row.loginCount, 0)

  return {
    totalRegistered: uniqueUsers.size,
    totalLogins,
    userSessions: Array.from(loginMap.values())
      .sort((a, b) => b.loginCount - a.loginCount)
      .slice(0, 10),
  }
}

export async function getSubscriptionOverview() {
  const [clinics, features] = await Promise.all([
    supabaseGet('clinics', 'select=id,name,slug,is_active,created_at&order=name.asc'),
    supabaseGet(CLINIC_FEATURES_TABLE, 'select=id,clinic_id,feature_key,is_active,expires_at,created_at,updated_at&order=updated_at.desc'),
  ])

  const featuresByClinic = new Map()

  for (const row of features || []) {
    const clinicId = Number(row.clinic_id)
    if (!featuresByClinic.has(clinicId)) featuresByClinic.set(clinicId, [])
    featuresByClinic.get(clinicId).push({
      id: row.id,
      featureKey: row.feature_key,
      isActive: Boolean(row.is_active),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: getFeatureStatus(row),
      isCurrentlyActive: isFeatureRowActive(row),
    })
  }

  const rows = (clinics || []).map((clinic) => {
    const clinicId = Number(clinic.id)
    const clinicFeatures = featuresByClinic.get(clinicId) || []
    const activeModules = clinicFeatures.filter((feature) => feature.isCurrentlyActive)
    const expiringModules = clinicFeatures.filter((feature) => feature.status === 'expiring_soon')
    const nextExpiry = activeModules
      .map((feature) => feature.expiresAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null
    const lastChangeAt = clinicFeatures
      .map((feature) => feature.updatedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null

    return {
      clinicId,
      clinicName: clinic.name,
      entityType: isSoloClinicSlug(clinic.slug) ? 'solo_doctor' : 'clinic',
      clinicActive: clinic.is_active !== false,
      activeModuleCount: activeModules.length,
      expiringModuleCount: expiringModules.length,
      activeModuleKeys: activeModules.map((feature) => feature.featureKey),
      modules: clinicFeatures,
      nextExpiry,
      lastChangeAt,
      subscriptionStatus: activeModules.length > 0
        ? (expiringModules.length > 0 ? 'expiring_soon' : 'active')
        : 'inactive',
    }
  })

  const moduleStats = PREMIUM_FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = (features || []).filter((row) => row.feature_key === key && isFeatureRowActive(row)).length
    return acc
  }, {})

  return {
    totalActiveSubscriptions: rows.reduce((sum, row) => sum + row.activeModuleCount, 0),
    clinicsWithSubscription: rows.filter((row) => row.activeModuleCount > 0).length,
    expiringSoonCount: rows.filter((row) => row.subscriptionStatus === 'expiring_soon').length,
    moduleStats,
    rows,
  }
}

export async function getRecentSubscriptionChanges(limit = 12) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 12))
  const [features, clinics] = await Promise.all([
    supabaseGet(
      CLINIC_FEATURES_TABLE,
      `select=id,clinic_id,feature_key,is_active,expires_at,updated_at&is_active=eq.true&order=updated_at.desc&limit=${safeLimit}`,
    ),
    supabaseGet('clinics', 'select=id,name,slug'),
  ])

  const clinicMap = new Map((clinics || []).map((clinic) => [Number(clinic.id), clinic]))

  return (features || []).map((row) => {
    const clinic = clinicMap.get(Number(row.clinic_id))
    return {
      id: row.id,
      clinicId: row.clinic_id,
      clinicName: clinic?.name || `#${row.clinic_id}`,
      entityType: isSoloClinicSlug(clinic?.slug) ? 'solo_doctor' : 'clinic',
      featureKey: row.feature_key,
      expiresAt: row.expires_at,
      updatedAt: row.updated_at,
      status: getFeatureStatus(row),
    }
  })
}

export async function getSubscriptionActivationTrends({ startDate = null, endDate = null } = {}) {
  const filters = ['select=clinic_id,feature_key,is_active,updated_at']
  const start = formatDateParam(startDate, false)
  const end = formatDateParam(endDate, true)
  if (start) filters.push(`updated_at=gte.${start}`)
  if (end) filters.push(`updated_at=lte.${end}`)
  filters.push('is_active=eq.true')
  filters.push('order=updated_at.asc')

  const rows = await supabaseGet(CLINIC_FEATURES_TABLE, filters.join('&'))
  const byDay = new Map()

  for (const row of rows || []) {
    const day = String(row.updated_at || '').slice(0, 10)
    if (!day) continue
    if (!byDay.has(day)) byDay.set(day, { day, total: 0 })
    byDay.get(day).total += 1
  }

  return {
    totalActivations: (rows || []).length,
    rows: Array.from(byDay.values()),
  }
}

export async function getSystemHealth() {
  const clinics = await supabaseGet('clinics', 'select=id,slug,is_active')

  return (clinics || []).reduce((acc, clinic) => {
    const isSolo = isSoloClinicSlug(clinic.slug)
    if (isSolo) acc.soloDoctors += 1
    else acc.clinics += 1
    if (clinic.is_active !== false) acc.activeEntities += 1
    return acc
  }, { soloDoctors: 0, clinics: 0, activeEntities: 0 })
}

export async function getSuperadminDashboardData(range = {}) {
  const [engagement, subscriptions, subscriptionTrends, systemHealth, recentSubscriptions] = await Promise.all([
    getTotalEngagement(),
    getSubscriptionOverview(),
    getSubscriptionActivationTrends(range),
    getSystemHealth(),
    getRecentSubscriptionChanges(12),
  ])

  return {
    engagement,
    subscriptions,
    subscriptionTrends,
    systemHealth,
    recentSubscriptions,
  }
}
