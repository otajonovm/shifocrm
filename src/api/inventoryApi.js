/**
 * Inventory & Expenses API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const ITEMS_TABLE = 'inventory_items'
const MOVEMENTS_TABLE = 'inventory_movements'
const EXPENSES_TABLE = 'expenses'
const CONSUMPTIONS_TABLE = 'inventory_consumptions'

export const listInventoryItems = async (query = 'order=created_at.desc') => {
  const cid = await getCurrentClinicId()
  return await supabaseGetWithClinicFallback(ITEMS_TABLE, query, cid)
}

export const createInventoryItem = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(ITEMS_TABLE, data)
  return result[0]
}

export const updateInventoryItem = async (id, payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid item id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  const result = await supabasePatchWhere(ITEMS_TABLE, q, payload)
  return result && result[0] ? result[0] : null
}

export const deleteInventoryItem = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid item id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(ITEMS_TABLE, q)
  return true
}

export const listInventoryMovements = async (query = 'order=created_at.desc') => {
  const cid = await getCurrentClinicId()
  return await supabaseGetWithClinicFallback(MOVEMENTS_TABLE, query, cid)
}

export const createInventoryMovement = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(MOVEMENTS_TABLE, data)
  return result[0]
}

export const deleteInventoryMovement = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid movement id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(MOVEMENTS_TABLE, q)
  return true
}

export const listExpenses = async (query = 'order=paid_at.desc') => {
  const cid = await getCurrentClinicId()
  return await supabaseGetWithClinicFallback(EXPENSES_TABLE, query, cid)
}

export const createExpense = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(EXPENSES_TABLE, data)
  return result[0]
}

export const deleteExpense = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid expense id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(EXPENSES_TABLE, q)
  return true
}

export const listInventoryConsumptionsByVisitId = async (visitId) => {
  const cid = await getCurrentClinicId()
  const q = `visit_id=eq.${Number(visitId)}&order=created_at.desc`
  return await supabaseGetWithClinicFallback(CONSUMPTIONS_TABLE, q, cid)
}

export const createInventoryConsumption = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(CONSUMPTIONS_TABLE, data)
  return result[0]
}

export const deleteInventoryConsumption = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid consumption id')
  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(CONSUMPTIONS_TABLE, q)
  return true
}
