/**
 * Payments API - Supabase REST API orqali.
 * Tenant isolation; clinic_id yo'q bo'lsa filtersiz fallback.
 */

import { supabaseGet, supabasePost, supabasePatchWhere, supabaseDeleteWhere } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'
import { mergeClinicQuery } from '@/lib/supabaseClinicFallback'

const TABLE = 'payments'

export const listPayments = async (query = 'order=paid_at.desc') => {
  try {
    const cid = await getCurrentClinicId()
    return await supabaseGetWithClinicFallback(TABLE, query, cid)
  } catch (error) {
    console.error('❌ Failed to fetch payments:', error)
    throw error
  }
}

export const getPaymentsByPatientId = async (patientId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `patient_id=eq.${Number(patientId)}&order=paid_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch payments by patient:', error)
    throw error
  }
}

export const getPaymentsByVisitId = async (visitId) => {
  try {
    const cid = await getCurrentClinicId()
    const q = `visit_id=eq.${Number(visitId)}&order=paid_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
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
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const safePaidAt = paid_at || new Date().toISOString()
    const payload = {
      visit_id: visit_id != null ? Number(visit_id) : null,
      patient_id: patient_id != null ? Number(patient_id) : null,
      doctor_id: doctor_id != null ? Number(doctor_id) : null,
      amount: Number(amount),
      payment_type,
      method: method || null,
      note: note || null,
      paid_at: safePaidAt,
      clinic_id: cid
    }

    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create payment:', error)
    throw error
  }
}

// Qo'shimcha to'lovlar uchun (yakka doktorlar uchun)
export const createAdditionalPayment = async ({
  amount,
  category, // 'rent', 'inventory', 'other'
  method = null,
  note = null,
  paid_at = null
}) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    const safePaidAt = paid_at || new Date().toISOString()
    // category ni note maydoniga saqlaymiz: [CATEGORY:rent] Izoh matni
    const categoryPrefix = `[CATEGORY:${category || 'other'}]`
    const formattedNote = note ? `${categoryPrefix} ${note}` : categoryPrefix
    
    // Qo'shimcha to'lovlar uchun visit_id va patient_id null bo'lishi mumkin
    // Database migration qilingandan keyin (visit_id va patient_id nullable bo'lgandan keyin)
    // payment_type ni 'adjustment' qilib ishlatamiz, chunki 'expense' check constraint'da yo'q
    const payload = {
      visit_id: null, // Migration qilingandan keyin null bo'lishi mumkin
      patient_id: null, // Migration qilingandan keyin null bo'lishi mumkin
      doctor_id: null,
      amount: Number(amount),
      payment_type: 'adjustment', // Qo'shimcha xarajatlar uchun (expense o'rniga)
      method: method || null,
      note: formattedNote,
      paid_at: safePaidAt,
      clinic_id: cid
    }

    const result = await supabasePost(TABLE, payload)
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create additional payment:', error)
    throw error
  }
}

// category ni note dan parse qilish
export const parseCategoryFromNote = (note) => {
  if (!note) return null
  const match = note.match(/\[CATEGORY:(\w+)\]/)
  return match ? match[1] : null
}

// note dan category ni olib tashlash
export const removeCategoryFromNote = (note) => {
  if (!note) return ''
  return note.replace(/\[CATEGORY:\w+\]\s*/, '').trim()
}

export const deletePayment = async (paymentId) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
    const numId = Number(paymentId)
    if (!Number.isFinite(numId)) throw new Error('Invalid payment ID')
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    await supabaseDeleteWhere(TABLE, q)
    return true
  } catch (error) {
    console.error('❌ Failed to delete payment:', error)
    throw error
  }
}

export const updatePayment = async (paymentId, payload) => {
  try {
    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')
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
    const q = mergeClinicQuery(`id=eq.${numId}`, cid)
    const result = await supabasePatchWhere(TABLE, q, updateData)
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('❌ Failed to update payment:', error)
    throw error
  }
}

function aggregatePaymentsByDay (payments) {
  const byDay = new Map()
  for (const p of payments || []) {
    const day = (p.paid_at || '').slice(0, 10)
    if (!day) continue
    if (!byDay.has(day)) byDay.set(day, { day, total_payments: 0, total_refunds: 0, total_adjustments: 0, net_income: 0 })
    const row = byDay.get(day)
    const amt = Number(p.amount) || 0
    if (p.payment_type === 'payment') row.total_payments += amt
    else if (p.payment_type === 'refund') row.total_refunds += amt
    else if (p.payment_type === 'adjustment') row.total_adjustments += amt
    row.net_income += p.payment_type === 'refund' ? -amt : amt
  }
  return Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? -1 : 1))
}

function aggregatePaymentsByMonth (payments) {
  const byMonth = new Map()
  for (const p of payments || []) {
    const d = (p.paid_at || '').slice(0, 10)
    if (!d) continue
    const month = d.slice(0, 7) + '-01'
    if (!byMonth.has(month)) byMonth.set(month, { month, total_payments: 0, total_refunds: 0, total_adjustments: 0, net_income: 0 })
    const row = byMonth.get(month)
    const amt = Number(p.amount) || 0
    if (p.payment_type === 'payment') row.total_payments += amt
    else if (p.payment_type === 'refund') row.total_refunds += amt
    else if (p.payment_type === 'adjustment') row.total_adjustments += amt
    row.net_income += p.payment_type === 'refund' ? -amt : amt
  }
  return Array.from(byMonth.values()).sort((a, b) => (a.month > b.month ? -1 : 1))
}

export const getIncomeByDate = async (date) => {
  try {
    const rows = await getPaymentsByDateRange(date, date)
    const arr = aggregatePaymentsByDay(rows)
    return arr.length ? arr[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch income by date:', error)
    throw error
  }
}

export const getMonthlyIncome = async () => {
  try {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 12)
    const rows = await getPaymentsByDateRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
    return aggregatePaymentsByMonth(rows).slice(0, 12)
  } catch (error) {
    console.error('❌ Failed to fetch monthly income:', error)
    throw error
  }
}

export const getIncomeDailyRange = async (startDate, endDate) => {
  try {
    const rows = await getPaymentsByDateRange(startDate, endDate)
    return aggregatePaymentsByDay(rows)
  } catch (error) {
    console.error('❌ Failed to fetch daily income range:', error)
    throw error
  }
}

export const getPaymentsByDateRange = async (startDate, endDate) => {
  try {
    const cid = await getCurrentClinicId()
    const start = String(startDate).includes('T') ? startDate : `${startDate}T00:00:00`
    const end = String(endDate).includes('T') ? endDate : `${endDate}T23:59:59.999`
    const q = `paid_at=gte.${start}&paid_at=lte.${end}&order=paid_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch payments by date range:', error)
    throw error
  }
}

export const getPaymentsByDoctorAndDateRange = async (doctorId, startDate, endDate) => {
  try {
    const cid = await getCurrentClinicId()
    const start = String(startDate).includes('T') ? startDate : `${startDate}T00:00:00`
    const end = String(endDate).includes('T') ? endDate : `${endDate}T23:59:59.999`
    const q = `doctor_id=eq.${Number(doctorId)}&paid_at=gte.${start}&paid_at=lte.${end}&order=paid_at.desc`
    return await supabaseGetWithClinicFallback(TABLE, q, cid)
  } catch (error) {
    console.error('❌ Failed to fetch payments by doctor and date range:', error)
    throw error
  }
}
