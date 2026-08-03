/**
 * Treatment Plans API - Supabase REST API orqali
 * Jadval: treatment_plans
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback, mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'treatment_plans'
const STAGES_TABLE = 'treatment_plan_stages'
const ITEMS_TABLE = 'treatment_plan_items'

const requireClinicId = async () => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
  return cid
}

const getPlanInClinic = async (planId, cid) => {
  const q = mergeClinicQuery(`id=eq.${Number(planId)}&limit=1`, cid)
  const rows = await supabaseGet(TABLE, q)
  return rows?.[0] || null
}

const assertPlanInClinic = async (planId, cid = null) => {
  const clinicId = cid ?? await requireClinicId()
  const plan = await getPlanInClinic(planId, clinicId)
  if (!plan) throw new Error('Treatment plan not found')
  return plan
}

const getStageById = async (stageId) => {
  const rows = await supabaseGet(STAGES_TABLE, `id=eq.${Number(stageId)}&limit=1`)
  return rows?.[0] || null
}

const assertStageInClinic = async (stageId, cid = null) => {
  const stage = await getStageById(stageId)
  if (!stage?.plan_id) throw new Error('Treatment plan stage not found')
  await assertPlanInClinic(stage.plan_id, cid)
  return stage
}

const getItemById = async (itemId) => {
  const rows = await supabaseGet(ITEMS_TABLE, `id=eq.${Number(itemId)}&limit=1`)
  return rows?.[0] || null
}

const assertItemInClinic = async (itemId, cid = null) => {
  const item = await getItemById(itemId)
  if (!item?.stage_id) throw new Error('Treatment plan item not found')
  const stage = await assertStageInClinic(item.stage_id, cid)
  return { item, stage }
}

export const getPlansByPatientId = async (patientId) => {
  try {
    const cid = await getCurrentClinicId()
    const numId = Number(patientId)
    const q = `patient_id=eq.${numId}&order=planned_date.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch treatment plans by patient:', error)
    throw error
  }
}

export const getPlansByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const cid = await getCurrentClinicId()
    const numId = Number(doctorId)
    const q = `doctor_id=eq.${numId}&planned_date=gte.${startDate}&planned_date=lte.${endDate}&order=planned_date.asc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
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
    const cid = await requireClinicId()
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
      clinic_id: cid,
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
    const cid = await requireClinicId()
    const numId = Number(planId)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid plan ID')
    }
    await assertPlanInClinic(numId, cid)
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update treatment plan:', error)
    throw error
  }
}

export const updatePlanStatus = async (planId, status) => {
  return updatePlan(planId, { status })
}

export const deletePlan = async (planId) => {
  try {
    const cid = await requireClinicId()
    const numId = Number(planId)
    if (!Number.isFinite(numId)) throw new Error('Invalid plan ID')
    await assertPlanInClinic(numId, cid)
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    return true
  } catch (error) {
    console.error('❌ Failed to delete treatment plan:', error)
    throw error
  }
}

export const listStagesByPlanId = async (planId) => {
  try {
    const cid = await getCurrentClinicId()
    await assertPlanInClinic(planId, cid)
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
    const cid = await requireClinicId()
    await assertPlanInClinic(plan_id, cid)
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
    await assertStageInClinic(numId)
    const result = await supabasePatchWhere(STAGES_TABLE, `id=eq.${numId}`, payload)
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
    await assertStageInClinic(numId)
    await supabaseDeleteWhere(STAGES_TABLE, `id=eq.${numId}`)
    return true
  } catch (error) {
    console.error('❌ Failed to delete treatment plan stage:', error)
    throw error
  }
}

export const listItemsByStageId = async (stageId) => {
  try {
    await assertStageInClinic(stageId)
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
    await assertStageInClinic(stage_id)
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
    await assertItemInClinic(numId)
    const result = await supabasePatchWhere(ITEMS_TABLE, `id=eq.${numId}`, payload)
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
    await assertItemInClinic(numId)
    await supabaseDeleteWhere(ITEMS_TABLE, `id=eq.${numId}`)
    return true
  } catch (error) {
    console.error('❌ Failed to delete treatment plan item:', error)
    throw error
  }
}
