/**
 * Services/Packages/Discounts API - Supabase REST API orqali
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

const SERVICES_TABLE = 'services'
const PACKAGES_TABLE = 'service_packages'
const PACKAGE_ITEMS_TABLE = 'service_package_items'
const DISCOUNT_RULES_TABLE = 'discount_rules'
const PRICE_AUDIT_TABLE = 'service_price_audit'
const REVENUE_DAILY_VIEW = 'service_revenue_daily'
const REVENUE_MONTHLY_VIEW = 'service_revenue_monthly'
const TOP_SERVICES_VIEW = 'top_services'

// Services
export const listServices = async (query = 'order=created_at.desc') => {
  return await supabaseGet(SERVICES_TABLE, query)
}

export const createService = async (payload) => {
  const result = await supabasePost(SERVICES_TABLE, payload)
  return result[0]
}

export const updateService = async (id, payload) => {
  const result = await supabasePatch(SERVICES_TABLE, Number(id), payload)
  return result[0]
}

export const deleteService = async (id) => {
  await supabaseDelete(SERVICES_TABLE, Number(id))
  return true
}

// Packages
export const listPackages = async (query = 'order=created_at.desc') => {
  return await supabaseGet(PACKAGES_TABLE, query)
}

export const createPackage = async (payload) => {
  const result = await supabasePost(PACKAGES_TABLE, payload)
  return result[0]
}

export const updatePackage = async (id, payload) => {
  const result = await supabasePatch(PACKAGES_TABLE, Number(id), payload)
  return result[0]
}

export const deletePackage = async (id) => {
  await supabaseDelete(PACKAGES_TABLE, Number(id))
  return true
}

export const listPackageItemsByPackageId = async (packageId) => {
  const numId = Number(packageId)
  return await supabaseGet(PACKAGE_ITEMS_TABLE, `package_id=eq.${numId}&order=id.asc`)
}

export const createPackageItem = async (payload) => {
  const result = await supabasePost(PACKAGE_ITEMS_TABLE, payload)
  return result[0]
}

export const deletePackageItem = async (id) => {
  await supabaseDelete(PACKAGE_ITEMS_TABLE, Number(id))
  return true
}

// Discount rules
export const listDiscountRules = async (query = 'order=created_at.desc') => {
  return await supabaseGet(DISCOUNT_RULES_TABLE, query)
}

export const createDiscountRule = async (payload) => {
  const result = await supabasePost(DISCOUNT_RULES_TABLE, payload)
  return result[0]
}

export const updateDiscountRule = async (id, payload) => {
  const result = await supabasePatch(DISCOUNT_RULES_TABLE, Number(id), payload)
  return result[0]
}

export const deleteDiscountRule = async (id) => {
  await supabaseDelete(DISCOUNT_RULES_TABLE, Number(id))
  return true
}

// Audit
export const listServicePriceAudit = async (query = 'order=changed_at.desc') => {
  return await supabaseGet(PRICE_AUDIT_TABLE, query)
}

// Stats
export const getServiceRevenueDaily = async (query = 'order=day.desc') => {
  return await supabaseGet(REVENUE_DAILY_VIEW, query)
}

export const getServiceRevenueMonthly = async (query = 'order=month.desc') => {
  return await supabaseGet(REVENUE_MONTHLY_VIEW, query)
}

export const getTopServices = async (query = 'order=total_revenue.desc') => {
  return await supabaseGet(TOP_SERVICES_VIEW, query)
}
