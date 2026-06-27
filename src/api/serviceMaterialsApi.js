/**
 * Xizmat materiallar retsepti API
 */

import { supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback, mergeClinicQuery } from '@/lib/supabaseClinicFallback'
import { parseServicePrice, getServiceMarginStatus } from '@/lib/serviceHealth'

const TABLE = 'service_materials'

async function resolveClinicId() {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  return Number(cid)
}

export async function getServiceMaterials(serviceId) {
  const cid = await resolveClinicId()
  const sid = Number(serviceId)
  if (!Number.isFinite(sid)) return []
  const rows = await supabaseGetWithClinicFallback(
    TABLE,
    `service_id=eq.${sid}&order=id.asc`,
    cid,
  )
  return Array.isArray(rows) ? rows : []
}

export async function getServiceMaterialsCost(serviceId, inventoryItems = []) {
  const materials = await getServiceMaterials(serviceId)
  let total = 0
  for (const row of materials) {
    const item = inventoryItems.find((i) => Number(i.id) === Number(row.inventory_item_id))
    const unitCost = parseServicePrice(item?.cost_price)
    const qty = parseServicePrice(row.quantity) || 1
    total += unitCost * qty
  }
  return total
}

export function computeServiceMargin(basePrice, materialCost) {
  const price = parseServicePrice(basePrice)
  const cost = parseServicePrice(materialCost)
  return {
    basePrice: price,
    materialCost: cost,
    margin: price - cost,
    marginPercent: price > 0 ? ((price - cost) / price) * 100 : 0,
    status: getServiceMarginStatus(price, cost),
  }
}

/**
 * Retseptni to'liq almashtirish.
 * @param {number} serviceId
 * @param {Array<{ inventory_item_id: number, quantity: number, unit?: string, notes?: string }>} items
 */
export async function setServiceMaterials(serviceId, items = []) {
  const cid = await resolveClinicId()
  const sid = Number(serviceId)
  if (!Number.isFinite(sid)) throw new Error('Xizmat ID noto‘g‘ri')

  const existing = await getServiceMaterials(sid)
  for (const row of existing) {
    const q = mergeClinicQuery(`id=eq.${Number(row.id)}`, cid)
    await supabaseDeleteWhere(TABLE, q)
  }

  const created = []
  for (const item of items) {
    const itemId = Number(item.inventory_item_id)
    const qty = Number(item.quantity)
    if (!Number.isFinite(itemId) || !Number.isFinite(qty) || qty <= 0) continue
    const payload = {
      clinic_id: cid,
      service_id: sid,
      inventory_item_id: itemId,
      quantity: qty,
      unit: item.unit ? String(item.unit).trim() : null,
      notes: item.notes ? String(item.notes).trim() : null,
    }
    const result = await supabasePost(TABLE, payload)
    if (result?.[0]) created.push(result[0])
  }
  return created
}

/** Barcha xizmatlar uchun material tannarx xaritasi */
export async function getAllServiceMaterialCosts(inventoryItems = []) {
  const cid = await resolveClinicId()
  const rows = await supabaseGetWithClinicFallback(TABLE, 'order=service_id.asc', cid)
  const costByService = new Map()
  for (const row of rows || []) {
    const sid = Number(row.service_id)
    const item = inventoryItems.find((i) => Number(i.id) === Number(row.inventory_item_id))
    const unitCost = parseServicePrice(item?.cost_price)
    const qty = parseServicePrice(row.quantity) || 1
    costByService.set(sid, (costByService.get(sid) || 0) + unitCost * qty)
  }
  return costByService
}

/**
 * Tashrifda xizmat qo'llanganda retsept bo'yicha material sarfi.
 */
export async function consumeServiceMaterialsForVisit({
  serviceId,
  visitId,
  patientId,
  doctorId,
  authStore,
  inventoryItems = [],
}) {
  const materials = await getServiceMaterials(serviceId)
  if (!materials.length) return []

  const { createVisitConsumption } = await import('@/lib/inventoryBridge')
  const results = []
  for (const row of materials) {
    const item = inventoryItems.find((i) => Number(i.id) === Number(row.inventory_item_id))
    if (!item) continue
    const stock = Number(item.current_stock) || 0
    const qty = Number(row.quantity) || 0
    if (qty <= 0 || stock < qty) {
      console.warn(`Skipping material ${row.inventory_item_id}: insufficient stock`)
      continue
    }
    const log = await createVisitConsumption(authStore, {
      visit_id: visitId,
      patient_id: patientId,
      doctor_id: doctorId,
      item_id: row.inventory_item_id,
      quantity: qty,
      note: `Xizmat retsepti (avtomatik)`,
    })
    results.push(log)
  }
  return results
}
