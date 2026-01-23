/**
 * Payments API - Supabase REST API orqali
 * Jadval: payments
 * Viewlar: income_daily, income_monthly
 */

import { supabaseGet, supabasePost, supabasePatch, supabaseDelete } from './supabaseConfig'

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
    const safePaidAt = paid_at || new Date().toISOString()
    const payload = {
      visit_id: Number(visit_id),
      patient_id: Number(patient_id),
      doctor_id: doctor_id !== null && doctor_id !== undefined ? Number(doctor_id) : null,
      amount: Number(amount),
      payment_type,
      method: method || null,
      note: note || null,
      paid_at: safePaidAt
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

export const updatePayment = async (paymentId, payload) => {
  try {
    const numId = Number(paymentId)
    if (!Number.isFinite(numId)) {
      throw new Error('Invalid payment ID')
    }
    const updateData = { ...payload }
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })
    const result = await supabasePatch(TABLE, numId, updateData)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update payment:', error)
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

export const getIncomeDailyRange = async (startDate, endDate) => {
  try {
    return await supabaseGet(
      INCOME_DAILY_VIEW,
      `day=gte.${startDate}&day=lte.${endDate}&order=day.asc`
    )
  } catch (error) {
    console.error('❌ Failed to fetch daily income range:', error)
    throw error
  }
}

export const getPaymentsByDateRange = async (startDate, endDate) => {
  try {
    const start = String(startDate).includes('T')
      ? startDate
      : `${startDate}T00:00:00`
    const end = String(endDate).includes('T')
      ? endDate
      : `${endDate}T23:59:59.999`
    return await supabaseGet(TABLE, `paid_at=gte.${start}&paid_at=lte.${end}&order=paid_at.desc`)
  } catch (error) {
    console.error('❌ Failed to fetch payments by date range:', error)
    throw error
  }
}

export const getPaymentsByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const numId = Number(doctorId)
    const start = String(startDate).includes('T')
      ? startDate
      : `${startDate}T00:00:00`
    const end = String(endDate).includes('T')
      ? endDate
      : `${endDate}T23:59:59.999`
    return await supabaseGet(
      TABLE,
      `doctor_id=eq.${numId}&paid_at=gte.${start}&paid_at=lte.${end}&order=paid_at.desc`
    )
  } catch (error) {
    console.error('❌ Failed to fetch payments by doctor and date range:', error)
    throw error
  }
}
