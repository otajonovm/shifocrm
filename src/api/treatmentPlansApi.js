/**
 * Treatment Plans API - Supabase REST API orqali
 * Jadval: treatment_plans
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

const TABLE = 'treatment_plans'
const STAGES_TABLE = 'treatment_plan_stages'
const ITEMS_TABLE = 'treatment_plan_items'

export const getPlansByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    return await supabaseGet(TABLE, `patient_id=eq.${numId}&order=planned_date.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plans by patient:', error)
    throw error
  }
}

export const getPlansByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const numId = Number(doctorId)
    return await supabaseGet(
      TABLE,
      `doctor_id=eq.${numId}&planned_date=gte.${startDate}&planned_date=lte.${endDate}&order=planned_date.asc`
    )
  } catch (error) {
    console.error('❌ Failed to fetch treatment plans by doctor:', error)
    throw error
  }
}

export const createPlan = async ({
  patient_id,
  doctor_id = null,
  visit_id = null,
  title,
  planned_date,
  status = 'offered',
  priority = 'medium',
  tooth_id = null,
  estimated_cost = null,
  notes = null,
  remind_at = null,
  remind_status = null,
}) => {
  try {
    const payload = {
      patient_id: Number(patient_id),
      doctor_id: doctor_id !== null && doctor_id !== undefined ? Number(doctor_id) : null,
      visit_id: visit_id !== null && visit_id !== undefined ? Number(visit_id) : null,
      title,
      planned_date,
      status,
      priority,
      tooth_id: tooth_id !== null && tooth_id !== undefined ? Number(tooth_id) : null,
      estimated_cost: estimated_cost !== null && estimated_cost !== undefined ? Number(estimated_cost) : null,
      notes: notes || null,
      remind_at: remind_at || null,
      remind_status: remind_at ? (remind_status || 'pending') : null,
    }
    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create treatment plan:', error)
    throw error
  }
}

export const updatePlan = async (planId, payload) => {
  try {
    const numId = Number(planId)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid plan ID')
    }
    const result = await supabasePatch(TABLE, numId, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update treatment plan:', error)
    throw error
  }
}

export const updatePlanStatus = async (planId, status) => {
  return updatePlan(planId, { status })
}

export const listStagesByPlanId = async (planId) => {
  try {
    const numId = Number(planId)
    return await supabaseGet(STAGES_TABLE, `plan_id=eq.${numId}&order=sort_order.asc`)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plan stages:', error)
    throw error
  }
}

export const createStage = async ({
  plan_id,
  stage_name,
  planned_date = null,
  sort_order = 1,
  notes = null
}) => {
  try {
    const payload = {
      plan_id: Number(plan_id),
      stage_name,
      planned_date,
      sort_order: Number(sort_order) || 1,
      notes: notes || null
    }
    const result = await supabasePost(STAGES_TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create treatment plan stage:', error)
    throw error
  }
}

export const updateStage = async (stageId, payload) => {
  try {
    const numId = Number(stageId)
    if (!Number.isFinite(numId)) throw new Error('Invalid stage ID')
    const result = await supabasePatch(STAGES_TABLE, numId, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update treatment plan stage:', error)
    throw error
  }
}

export const deleteStage = async (stageId) => {
  try {
    const numId = Number(stageId)
    if (!Number.isFinite(numId)) throw new Error('Invalid stage ID')
    await supabaseDelete(STAGES_TABLE, numId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete treatment plan stage:', error)
    throw error
  }
}

export const listItemsByStageId = async (stageId) => {
  try {
    const numId = Number(stageId)
    return await supabaseGet(ITEMS_TABLE, `stage_id=eq.${numId}&order=id.asc`)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plan items:', error)
    throw error
  }
}

export const createItem = async ({
  stage_id,
  service_id = null,
  service_name,
  tooth_id = null,
  estimated_cost = null,
  notes = null
}) => {
  try {
    const payload = {
      stage_id: Number(stage_id),
      service_id: service_id !== null && service_id !== undefined ? Number(service_id) : null,
      service_name,
      tooth_id: tooth_id !== null && tooth_id !== undefined ? Number(tooth_id) : null,
      estimated_cost: estimated_cost !== null && estimated_cost !== undefined ? Number(estimated_cost) : null,
      notes: notes || null
    }
    const result = await supabasePost(ITEMS_TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create treatment plan item:', error)
    throw error
  }
}

export const updateItem = async (itemId, payload) => {
  try {
    const numId = Number(itemId)
    if (!Number.isFinite(numId)) throw new Error('Invalid item ID')
    const result = await supabasePatch(ITEMS_TABLE, numId, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update treatment plan item:', error)
    throw error
  }
}

export const deleteItem = async (itemId) => {
  try {
    const numId = Number(itemId)
    if (!Number.isFinite(numId)) throw new Error('Invalid item ID')
    await supabaseDelete(ITEMS_TABLE, numId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete treatment plan item:', error)
    throw error
  }
}
