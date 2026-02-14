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

/** Bitta materialni id bo'yicha olish (ombor qoldig'ini yangilash uchun) */
export const getInventoryItemById = async (id) => {
  const cid = await getCurrentClinicId()
  const numId = Number(id)
  if (!Number.isFinite(numId)) return null
  const rows = await supabaseGetWithClinicFallback(ITEMS_TABLE, `id=eq.${numId}`, cid)
  return rows && rows[0] ? rows[0] : null
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

/** Bitta sarf yozuvini id bo'yicha olish (o'chirganda qoldiqni qaytarish uchun) */
export const getInventoryConsumptionById = async (id) => {
  const cid = await getCurrentClinicId()
  const numId = Number(id)
  if (!Number.isFinite(numId)) return null
  const rows = await supabaseGetWithClinicFallback(CONSUMPTIONS_TABLE, `id=eq.${numId}`, cid)
  return rows && rows[0] ? rows[0] : null
}

/**
 * Material sarfi yozish — yozuv yaratiladi va ombor qoldig'idan minus qilinadi.
 * Admin/doktor/yakka doktor bemor tashrifida material kiritganda shu funksiya ishlatiladi.
 * Agar Supabase da trigger_inventory_consumption triggeri yoqilgan bo'lsa, ikki marta minus bo'lmasligi uchun
 * SQL da: DROP TRIGGER IF EXISTS trigger_inventory_consumption ON inventory_consumptions;
 */
export const createInventoryConsumption = async (payload) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

  const itemId = Number(payload.item_id)
  const quantity = Number(payload.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Miqdor 0 dan katta bo\'lishi kerak.')
  }

  const item = await getInventoryItemById(itemId)
  if (!item) throw new Error('Material topilmadi.')
  const currentStock = Number(item.current_stock) ?? 0
  if (currentStock < quantity) {
    throw new Error(`Omborda yetarli qoldiq yo'q. Mavjud: ${currentStock}, so'ralgan: ${quantity}.`)
  }

  const data = { ...payload, clinic_id: cid }
  const result = await supabasePost(CONSUMPTIONS_TABLE, data)
  const created = result && result[0] ? result[0] : null
  if (!created) throw new Error('Material sarfi yozuvi yaratilmadi.')

  const newStock = currentStock - quantity
  await updateInventoryItem(itemId, { current_stock: newStock })

  return created
}

/**
 * Material sarfini o'chirish — yozuv o'chiriladi va omborga qoldiq qaytariladi.
 */
export const deleteInventoryConsumption = async (id) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  const numId = Number(id)
  if (!Number.isFinite(numId)) throw new Error('Invalid consumption id')

  const consumption = await getInventoryConsumptionById(numId)
  if (!consumption) throw new Error('Sarf yozuvi topilmadi.')

  const itemId = Number(consumption.item_id)
  const quantity = Number(consumption.quantity) || 0
  const item = await getInventoryItemById(itemId)
  if (item && Number.isFinite(quantity)) {
    const currentStock = Number(item.current_stock) ?? 0
    await updateInventoryItem(itemId, { current_stock: currentStock + quantity })
  }

  const q = mergeClinicQuery(`id=eq.${numId}`, cid)
  await supabaseDeleteWhere(CONSUMPTIONS_TABLE, q)
  return true
}
