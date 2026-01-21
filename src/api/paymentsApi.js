/**
 * Payments API - Supabase REST API orqali
 * Jadval: payments
 * Viewlar: income_daily, income_monthly
 */

import { supabaseGet, supabasePost, supabaseDelete } from './supabaseConfig'

const TABLE = 'payments'
const INCOME_DAILY_VIEW = 'income_daily'
const INCOME_MONTHLY_VIEW = 'income_monthly'

export const listPayments = async (query = 'order=paid_at.desc') => {
  try {
    return await supabaseGet(TABLE, query)
  } catch (error) {
    console.error('❌ Failed to fetch payments:', error)
    throw error
  }
}

export const getPaymentsByPatientId = async (patientId) => {
  try {
    const numId = Number(patientId)
    return await supabaseGet(TABLE, `patient_id=eq.${numId}&order=paid_at.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch payments by patient:', error)
    throw error
  }
}

export const getPaymentsByVisitId = async (visitId) => {
  try {
    const numId = Number(visitId)
    return await supabaseGet(TABLE, `visit_id=eq.${numId}&order=paid_at.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch payments by visit:', error)
    throw error
  }
}

export const createPayment = async ({
  visit_id,
  patient_id,
  doctor_id = null,
  amount,
  payment_type = 'payment',
  method = null,
  note = null,
  paid_at = null
}) => {
  try {
    const payload = {
      visit_id: Number(visit_id),
      patient_id: Number(patient_id),
      doctor_id: doctor_id !== null && doctor_id !== undefined ? Number(doctor_id) : null,
      amount: Number(amount),
      payment_type,
      method: method || null,
      note: note || null,
      paid_at: paid_at || null
    }

    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create payment:', error)
    throw error
  }
}

export const deletePayment = async (paymentId) => {
  try {
    const numId = Number(paymentId)
    await supabaseDelete(TABLE, numId)
    return true
  } catch (error) {
    console.error('❌ Failed to delete payment:', error)
    throw error
  }
}

export const getIncomeByDate = async (date) => {
  try {
    const result = await supabaseGet(INCOME_DAILY_VIEW, `day=eq.${date}`)
    return result[0] || null
  } catch (error) {
    console.error('❌ Failed to fetch income by date:', error)
    throw error
  }
}

export const getMonthlyIncome = async (query = 'order=month.desc') => {
  try {
    return await supabaseGet(INCOME_MONTHLY_VIEW, query)
  } catch (error) {
    console.error('❌ Failed to fetch monthly income:', error)
    throw error
  }
}
