/**
 * Ombor API — ko'p xonali klinika (clinic_inventory) yoki yakka stom (inventory_items).
 */

import { canAccessWarehouse } from '@/lib/roles'
import * as warehouseApi from '@/api/warehouseApi'
import * as inventoryApi from '@/api/inventoryApi'

export function usesSmartWarehouse(authStore) {
  return canAccessWarehouse(authStore)
}

export function normalizeInventoryItem(item) {
  if (!item) return item
  return {
    ...item,
    min_stock: item.min_stock ?? item.min_limit ?? 0,
    min_limit: item.min_limit ?? item.min_stock ?? 0,
  }
}

function mapConsumptionRow(row) {
  if (!row) return row
  return {
    ...row,
    note: row.note ?? row.reason ?? null,
  }
}

export async function listClinicInventoryItems(authStore) {
  if (usesSmartWarehouse(authStore)) {
    const rows = await warehouseApi.getInventory()
    return rows.map(normalizeInventoryItem)
  }
  const rows = await inventoryApi.listInventoryItems('order=created_at.desc')
  return rows.map(normalizeInventoryItem)
}

export async function listVisitConsumptions(authStore, visitId) {
  if (usesSmartWarehouse(authStore)) {
    const rows = await warehouseApi.getVisitConsumptions(visitId)
    return rows.map(mapConsumptionRow)
  }
  const rows = await inventoryApi.listInventoryConsumptionsByVisitId(visitId)
  return rows.map(mapConsumptionRow)
}

export async function createVisitConsumption(authStore, payload) {
  if (usesSmartWarehouse(authStore)) {
    const { log, item } = await warehouseApi.logVisitConsumption({
      visitId: payload.visit_id,
      patientId: payload.patient_id,
      doctorId: payload.doctor_id,
      itemId: payload.item_id,
      quantity: payload.quantity,
      note: payload.note,
      createdBy: authStore.userEmail || authStore.user?.login || null,
    })
    return mapConsumptionRow(log)
  }
  return inventoryApi.createInventoryConsumption(payload)
}

export async function deleteVisitConsumption(authStore, id) {
  if (usesSmartWarehouse(authStore)) {
    return warehouseApi.deleteVisitConsumption(id)
  }
  return inventoryApi.deleteInventoryConsumption(id)
}

export async function getCriticalStockItems(authStore) {
  if (usesSmartWarehouse(authStore)) {
    const rows = await warehouseApi.getInventory()
    return rows.filter((item) => {
      const stock = Number(item.current_stock) || 0
      const min = Number(item.min_limit) || 0
      return min > 0 && stock <= min
    })
  }
  const rows = await inventoryApi.listInventoryItems()
  return rows.filter((item) => {
    const stock = Number(item.current_stock) || 0
    const min = Number(item.min_stock) || 0
    return min > 0 && stock <= min
  })
}
