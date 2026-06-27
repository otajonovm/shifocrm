/**
 * Aqlli Ombor Nazorati — Phase 1 API
 * Jadvalar: clinic_inventory, inventory_logs
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const INVENTORY_TABLE = 'clinic_inventory'
const LOGS_TABLE = 'inventory_logs'

async function resolveClinicId(clinicId) {
  const explicit = clinicId != null && Number.isFinite(Number(clinicId)) ? Number(clinicId) : null
  if (explicit) return explicit
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  return Number(cid)
}

/**
 * Klinikaga tegishli mahsulotlar ro'yxati.
 * @param {number|string|null} [clinicId]
 * @returns {Promise<object[]>}
 */
export async function getInventory(clinicId = null) {
  try {
    const cid = await resolveClinicId(clinicId)
    const rows = await supabaseGetWithClinicFallback(
      INVENTORY_TABLE,
      'order=name.asc',
      cid,
    )
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    console.error('❌ getInventory failed:', error)
    throw error
  }
}

/**
 * @param {number|string} itemId
 * @param {number} clinicId
 */
async function getInventoryItemById(itemId, clinicId) {
  const numId = Number(itemId)
  if (!Number.isFinite(numId)) return null
  const rows = await supabaseGetWithClinicFallback(
    INVENTORY_TABLE,
    `id=eq.${numId}`,
    clinicId,
  )
  return rows?.[0] || null
}

/**
 * Yangi mahsulot turi qo'shish.
 * @param {object} itemData
 * @returns {Promise<object>}
 */
export async function addInventoryItem(itemData) {
  try {
    const cid = await resolveClinicId(itemData?.clinic_id)
    const name = String(itemData?.name || '').trim()
    if (!name) throw new Error('Mahsulot nomi majburiy')

    const payload = {
      clinic_id: cid,
      name,
      category: itemData?.category ? String(itemData.category).trim() : null,
      unit: itemData?.unit ? String(itemData.unit).trim() : 'dona',
      current_stock: Math.max(0, Number(itemData?.current_stock) || 0),
      min_limit: Math.max(0, Number(itemData?.min_limit) || 0),
      cost_price: Math.max(0, Number(itemData?.cost_price) || 0),
      sku: itemData?.sku ? String(itemData.sku).trim() : null,
      notes: itemData?.notes ? String(itemData.notes).trim() : null,
    }

    const result = await supabasePost(INVENTORY_TABLE, payload)
    const created = result?.[0] || result
    if (!created?.id) throw new Error('Mahsulot yaratilmadi')
    return created
  } catch (error) {
    console.error('❌ addInventoryItem failed:', error)
    throw error
  }
}

/**
 * Kirim/chiqim yozuvi + current_stock yangilash.
 * @param {number|string} itemId
 * @param {'in'|'out'} type
 * @param {number} quantity
 * @param {string} [reason]
 * @param {{ clinicId?: number, createdBy?: string }} [options]
 * @returns {Promise<{ log: object, item: object }>}
 */
export async function logTransaction(itemId, type, quantity, reason = '', options = {}) {
  try {
    const cid = await resolveClinicId(options.clinicId)
    const numItemId = Number(itemId)
    const qty = Number(quantity)
    const txType = String(type || '').toLowerCase()

    if (!Number.isFinite(numItemId)) throw new Error('Mahsulot ID noto‘g‘ri')
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Miqdor 0 dan katta bo‘lishi kerak')
    if (txType !== 'in' && txType !== 'out') throw new Error('Harakat turi: in yoki out')

    const item = await getInventoryItemById(numItemId, cid)
    if (!item) throw new Error('Mahsulot topilmadi')

    const stockBefore = Number(item.current_stock) || 0
    const stockAfter = txType === 'in' ? stockBefore + qty : stockBefore - qty

    if (stockAfter < 0) {
      throw new Error(`Omborda yetarli qoldiq yo‘q. Mavjud: ${stockBefore}`)
    }

    const logPayload = {
      clinic_id: cid,
      item_id: numItemId,
      type: txType,
      quantity: qty,
      reason: reason ? String(reason).trim() : null,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_by: options.createdBy ? String(options.createdBy) : null,
      visit_id: options.visitId != null ? Number(options.visitId) : null,
      patient_id: options.patientId != null ? Number(options.patientId) : null,
      doctor_id: options.doctorId != null ? Number(options.doctorId) : null,
    }

    const logResult = await supabasePost(LOGS_TABLE, logPayload)
    const log = logResult?.[0] || logResult
    if (!log?.id) throw new Error('Ombor jurnali yozuvi yaratilmadi')

    const patchQuery = mergeClinicQuery(`id=eq.${numItemId}`, cid)
    const updatedRows = await supabasePatchWhere(INVENTORY_TABLE, patchQuery, {
      current_stock: stockAfter,
      updated_at: new Date().toISOString(),
    })
    const updatedItem = updatedRows?.[0] || { ...item, current_stock: stockAfter }

    return { log, item: updatedItem }
  } catch (error) {
    console.error('❌ logTransaction failed:', error)
    throw error
  }
}

/**
 * So'nggi ombor harakatlari (ixtiyoriy).
 * @param {number|string|null} [clinicId]
 * @param {number} [limit]
 */
export async function getInventoryLogs(clinicId = null, limit = 50) {
  try {
    const cid = await resolveClinicId(clinicId)
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
    const rows = await supabaseGetWithClinicFallback(
      LOGS_TABLE,
      `order=created_at.desc&limit=${safeLimit}`,
      cid,
    )
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    console.error('❌ getInventoryLogs failed:', error)
    throw error
  }
}

/**
 * Bemor tashrifida material sarfi (chiqim + visit bog'lanishi).
 */
export async function logVisitConsumption({
  visitId,
  patientId,
  doctorId,
  itemId,
  quantity,
  note,
  createdBy,
  clinicId = null,
}) {
  const noteText = note ? String(note).trim() : ''
  const reason = noteText || `Tashrif #${visitId} material sarfi`
  const { log, item } = await logTransaction(itemId, 'out', quantity, reason, {
    clinicId,
    createdBy,
    visitId,
    patientId,
    doctorId,
  })
  return { log, item }
}

/**
 * Tashrif bo'yicha material sarfi yozuvlari.
 */
export async function getVisitConsumptions(visitId, clinicId = null) {
  try {
    const cid = await resolveClinicId(clinicId)
    const vid = Number(visitId)
    if (!Number.isFinite(vid)) return []
    const rows = await supabaseGetWithClinicFallback(
      LOGS_TABLE,
      `visit_id=eq.${vid}&type=eq.out&order=created_at.desc`,
      cid,
    )
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    console.error('❌ getVisitConsumptions failed:', error)
    throw error
  }
}

/**
 * Material sarfini bekor qilish — qoldiq qaytariladi, yozuv o'chiriladi.
 */
export async function deleteVisitConsumption(logId, clinicId = null) {
  try {
    const cid = await resolveClinicId(clinicId)
    const numId = Number(logId)
    if (!Number.isFinite(numId)) throw new Error('Yozuv ID noto‘g‘ri')

    const rows = await supabaseGetWithClinicFallback(LOGS_TABLE, `id=eq.${numId}`, cid)
    const log = rows?.[0]
    if (!log) throw new Error('Sarf yozuvi topilmadi')
    if (log.type !== 'out') throw new Error('Faqat chiqim yozuvini o‘chirish mumkin')

    const item = await getInventoryItemById(log.item_id, cid)
    if (!item) throw new Error('Mahsulot topilmadi')

    const stockBefore = Number(item.current_stock) || 0
    const qty = Number(log.quantity) || 0
    const stockAfter = stockBefore + qty

    await supabasePatchWhere(
      INVENTORY_TABLE,
      mergeClinicQuery(`id=eq.${log.item_id}`, cid),
      { current_stock: stockAfter, updated_at: new Date().toISOString() },
    )
    await supabaseDeleteWhere(LOGS_TABLE, mergeClinicQuery(`id=eq.${numId}`, cid))
    return true
  } catch (error) {
    console.error('❌ deleteVisitConsumption failed:', error)
    throw error
  }
}
