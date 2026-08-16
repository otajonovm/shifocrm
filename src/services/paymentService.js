import { supabasePost, supabaseRpc } from '@/api/supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getVisitById, updateVisit } from '@/api/visitsApi'

const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isMissingRpc = (error) => {
  const message = String(error?.message || '')
  return error?.status === 404
    || message.includes('Could not find the function')
    || message.includes('schema cache')
}

const isMissingColumn = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST204'
    || message.includes('could not find the')
    || message.includes('schema cache')
}

const insertPaymentRow = async (payload) => {
  try {
    const result = await supabasePost('payments', payload)
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    if (!isMissingColumn(error)) throw error
    const fallback = {
      visit_id: payload.visit_id,
      patient_id: payload.patient_id,
      doctor_id: payload.doctor_id,
      clinic_id: payload.clinic_id,
      amount: payload.amount,
      payment_type: payload.payment_type,
      method: payload.method,
      note: payload.note,
      paid_at: payload.paid_at,
    }
    const result = await supabasePost('payments', fallback)
    return Array.isArray(result) ? result[0] : result
  }
}

const syncVisitAfterPayment = async (visitId) => {
  try {
    const visit = await getVisitById(visitId)
    if (!visit) return
    const { getPaymentsByVisitId } = await import('@/api/paymentsApi')
    const entries = await getPaymentsByVisitId(visitId)
    let netPaid = 0
    let discountTotal = 0
    for (const entry of entries || []) {
      const amount = Number(entry.amount) || 0
      if (entry.payment_type === 'discount' || String(entry.note || '').includes('[DISCOUNT]')) {
        discountTotal += Math.abs(amount)
        continue
      }
      if (entry.payment_type === 'refund') {
        netPaid -= amount
        continue
      }
      netPaid += amount
    }
    const price = Number(visit.price) || 0
    const remaining = Math.max(0, price - discountTotal - netPaid)
    const update = {
      paid_amount: netPaid,
      debt_amount: remaining > 0 ? remaining : null,
    }
    if (visit.status === 'completed_debt' || visit.status === 'completed_paid') {
      update.status = remaining > 0 ? 'completed_debt' : 'completed_paid'
    }
    await updateVisit(visitId, update)
  } catch (error) {
    console.warn('Visit to‘lov holatini yangilash:', error)
  }
}

export async function postVisitPayment({
  visitId,
  amount,
  type = 'payment',
  method = null,
  cashShiftId = null,
  note = null,
  idempotencyKey = null,
  patientId = null,
  doctorId = null,
  paidAt = null,
}) {
  const payload = {
    p_visit_id: Number(visitId),
    p_amount: Number(amount),
    p_type: type,
    p_method: method || null,
    p_idempotency_key: idempotencyKey || createIdempotencyKey(),
    p_cash_shift_id: cashShiftId != null ? Number(cashShiftId) : null,
    p_note: note || null,
  }

  const afterPaymentSettlement = async () => {
    try {
      const { recalculateVisitSettlement } = await import('@/services/soloBillingService')
      await recalculateVisitSettlement(visitId)
    } catch (error) {
      console.warn('Solo billing settlement:', error)
    }
  }

  try {
    const result = await supabaseRpc('post_visit_payment', payload)
    const created = Array.isArray(result) ? result[0] : result
    if (type === 'payment' || type === 'refund' || type === 'discount') {
      await afterPaymentSettlement()
    }
    return created
  } catch (error) {
    if (!isMissingRpc(error)) throw error

    const cid = await getCurrentClinicId()
    if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

    let patient_id = patientId != null ? Number(patientId) : null
    let doctor_id = doctorId != null ? Number(doctorId) : null
    if (patient_id == null) {
      const visit = await getVisitById(visitId)
      patient_id = visit?.patient_id ? Number(visit.patient_id) : null
      doctor_id = doctor_id ?? (visit?.doctor_id ? Number(visit.doctor_id) : null)
    }

    const created = await insertPaymentRow({
      visit_id: Number(visitId),
      patient_id,
      doctor_id,
      clinic_id: cid,
      amount: Number(amount),
      payment_type: type,
      method: method || null,
      note: note || null,
      paid_at: paidAt || new Date().toISOString(),
      idempotency_key: payload.p_idempotency_key,
      cash_shift_id: payload.p_cash_shift_id,
    })
    await syncVisitAfterPayment(visitId)
    await afterPaymentSettlement()
    return created
  }
}
