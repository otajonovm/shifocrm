/**
 * Inventory & Expenses API - Supabase REST API orqali
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

const ITEMS_TABLE = 'inventory_items'
const MOVEMENTS_TABLE = 'inventory_movements'
const EXPENSES_TABLE = 'expenses'
const CONSUMPTIONS_TABLE = 'inventory_consumptions'

export const listInventoryItems = async (query = 'order=created_at.desc') => {
  return await supabaseGet(ITEMS_TABLE, query)
}

export const createInventoryItem = async (payload) => {
  const result = await supabasePost(ITEMS_TABLE, payload)
  return result[0]
}

export const updateInventoryItem = async (id, payload) => {
  const result = await supabasePatch(ITEMS_TABLE, Number(id), payload)
  return result[0]
}

export const deleteInventoryItem = async (id) => {
  await supabaseDelete(ITEMS_TABLE, Number(id))
  return true
}

export const listInventoryMovements = async (query = 'order=created_at.desc') => {
  return await supabaseGet(MOVEMENTS_TABLE, query)
}

export const createInventoryMovement = async (payload) => {
  const result = await supabasePost(MOVEMENTS_TABLE, payload)
  return result[0]
}

export const deleteInventoryMovement = async (id) => {
  await supabaseDelete(MOVEMENTS_TABLE, Number(id))
  return true
}

export const listExpenses = async (query = 'order=paid_at.desc') => {
  return await supabaseGet(EXPENSES_TABLE, query)
}

export const createExpense = async (payload) => {
  const result = await supabasePost(EXPENSES_TABLE, payload)
  return result[0]
}

export const deleteExpense = async (id) => {
  await supabaseDelete(EXPENSES_TABLE, Number(id))
  return true
}

export const listInventoryConsumptionsByVisitId = async (visitId) => {
  const numId = Number(visitId)
  return await supabaseGet(CONSUMPTIONS_TABLE, `visit_id=eq.${numId}&order=created_at.desc`)
}

export const createInventoryConsumption = async (payload) => {
  const result = await supabasePost(CONSUMPTIONS_TABLE, payload)
  return result[0]
}
