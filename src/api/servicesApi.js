/**
 * Services/Packages/Discounts API - Supabase REST API orqali.
 * Tenant isolation: barcha so'rovlar joriy klinika bo'yicha filtrlangan.
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getVisitsByDateRange } from '@/api/visitsApi'
import { getVisitServicesByVisitIds } from '@/api/visitServicesApi'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const SERVICES_TABLE = 'services'
const PACKAGES_TABLE = 'service_packages'
const PACKAGE_ITEMS_TABLE = 'service_package_items'
const DISCOUNT_RULES_TABLE = 'discount_rules'
const PRICE_AUDIT_TABLE = 'service_price_audit'

export const listServices = async (query = 'order=created_at.desc') => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const rows = await supabaseGetWithClinicFallback(SERVICES_TABLE, query, cid)
  return rows || []
}

export const createService = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(SERVICES_TABLE, data)
  return result[0]
}

export const updateService = async (id, payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid service id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  const result = await supabasePatchWhere(SERVICES_TABLE, q, payload)
  return result && result[0] ? result[0] : null
}

export const deleteService = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid service id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(SERVICES_TABLE, q)
  return true
}

export const listPackages = async (query = 'order=created_at.desc') => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const rows = await supabaseGetWithClinicFallback(PACKAGES_TABLE, query, cid)
  return rows || []
}

export const createPackage = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(PACKAGES_TABLE, data)
  return result[0]
}

export const updatePackage = async (id, payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid package id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  const result = await supabasePatchWhere(PACKAGES_TABLE, q, payload)
  return result && result[0] ? result[0] : null
}

export const deletePackage = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid package id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(PACKAGES_TABLE, q)
  return true
}

export const listPackageItemsByPackageId = async (packageId) => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const q = `package_id=eq.${Number(packageId)}&order=id.asc`
  const rows = await supabaseGetWithClinicFallback(PACKAGE_ITEMS_TABLE, q, cid)
  return rows || []
}

export const createPackageItem = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(PACKAGE_ITEMS_TABLE, data)
  return result[0]
}

export const deletePackageItem = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid package item id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(PACKAGE_ITEMS_TABLE, q)
  return true
}

export const listDiscountRules = async (query = 'order=created_at.desc') => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const rows = await supabaseGetWithClinicFallback(DISCOUNT_RULES_TABLE, query, cid)
  return rows || []
}

export const createDiscountRule = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(DISCOUNT_RULES_TABLE, data)
  return result[0]
}

export const updateDiscountRule = async (id, payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid discount rule id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  const result = await supabasePatchWhere(DISCOUNT_RULES_TABLE, q, payload)
  return result && result[0] ? result[0] : null
}

export const deleteDiscountRule = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid discount rule id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(DISCOUNT_RULES_TABLE, q)
  return true
}

export const listServicePriceAudit = async (query = 'order=changed_at.desc&limit=50') => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  // service_price_audit da clinic_id / changed_at bo'lmasa 400 keladi.
  // Avval eng xavfsiz so'rov (faqat id), keyin changed_at / created_at, oxirida to'liq query.
  const safe = 'order=id.desc&limit=50'
  const withCreated = (query || '').replace(/order=changed_at\.(asc|desc)/, 'order=created_at.$1') || safe
  const candidates = [safe, withCreated, query].filter(Boolean)

  for (const q of candidates) {
    try {
      const rows = await supabaseGetWithClinicFallback(PRICE_AUDIT_TABLE, q, cid)
      if (Array.isArray(rows)) return rows
    } catch (e) {
      const st = e && (typeof e.status === 'number' ? e.status : Number(e.status))
      if (st !== 400) throw e
    }
  }
  return []
}

function parseServicePrice(v) {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

async function fetchVisitServicesForDateRange(startDate, endDate) {
  const visits = await getVisitsByDateRange(startDate, endDate)
  const ids = (visits || []).map((v) => v.id).filter(Boolean)
  if (!ids.length) return []
  return getVisitServicesByVisitIds(ids)
}

/** visit_services bo'yicha xizmat statistikasi */
function aggregateByServiceName(rows = []) {
  const byService = new Map()
  for (const r of rows) {
    const name = String(r.service_name || '').trim() || 'Noma\'lum'
    const key = name.toLowerCase()
    if (!byService.has(key)) {
      byService.set(key, {
        service_id: key,
        service_name: name,
        total_count: 0,
        total_revenue: 0,
      })
    }
    const item = byService.get(key)
    item.total_count += 1
    item.total_revenue += parseServicePrice(r.price)
  }
  return Array.from(byService.values()).sort((a, b) => b.total_revenue - a.total_revenue)
}

export const getServiceRevenueDaily = async () => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  const rows = await fetchVisitServicesForDateRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  )
  const byDay = new Map()
  for (const r of rows) {
    const day = (r.created_at || '').slice(0, 10)
    if (!day) continue
    const key = `${day}\t${r.service_name || ''}`
    if (!byDay.has(key)) byDay.set(key, { day, service_name: r.service_name || '', total_revenue: 0 })
    byDay.get(key).total_revenue += parseServicePrice(r.price)
  }
  return Array.from(byDay.values()).sort((a, b) => (a.day > b.day ? -1 : 1))
}

/** Oy bo'yicha umumiy tushum (UI uchun agregatsiya) */
export const getServiceRevenueMonthly = async (months = 6) => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const end = new Date()
  const start = new Date(end)
  start.setMonth(start.getMonth() - Math.max(Number(months) || 6, 1))
  const rows = await fetchVisitServicesForDateRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  )
  const byMonth = new Map()
  for (const r of rows) {
    const d = (r.created_at || '').slice(0, 10)
    if (!d) continue
    const month = d.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, { month, total_revenue: 0 })
    byMonth.get(month).total_revenue += parseServicePrice(r.price)
  }
  return Array.from(byMonth.values())
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, months)
}

export const getTopServices = async (limit = 10) => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)
  const rows = await fetchVisitServicesForDateRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  )
  return aggregateByServiceName(rows).slice(0, Math.max(Number(limit) || 10, 1))
}
