import { supabasePost } from '@/api/supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getVisitById, updateVisit } from '@/api/visitsApi'
import { visitDueFrom, withCashbackUsedNote } from '@/lib/paymentTotals'

const isMissingColumn = (error) => {
  const message = String(error?.message || error?.hint || '').toLowerCase()
  const code = String(error?.code || '')
  return code === 'PGRST204'
    || code === 'PGRST205'
    || message.includes('could not find the')
    || message.includes('schema cache')
    || message.includes('column')
}

const omitNullish = (obj) => {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') out[key] = value
  }
  return out
}

const insertPaymentRow = async (payload) => {
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('To‘lov summasi 0 dan katta bo‘lishi kerak')
  }

  const core = omitNullish({
    visit_id: Number(payload.visit_id),
    patient_id: payload.patient_id != null ? Number(payload.patient_id) : undefined,
    doctor_id: payload.doctor_id != null ? Number(payload.doctor_id) : undefined,
    clinic_id: payload.clinic_id != null ? Number(payload.clinic_id) : undefined,
    amount,
    payment_type: payload.payment_type || 'payment',
    method: payload.method || 'cash',
    note: payload.note || undefined,
    cashback_used: payload.cashback_used > 0 ? payload.cashback_used : undefined,
    paid_at: payload.paid_at || new Date().toISOString(),
  })

  const tryInsert = async (body) => {
    const result = await supabasePost('payments', body)
    return Array.isArray(result) ? result[0] : result
  }

  try {
    return await tryInsert(core)
  } catch (error) {
    if (!isMissingColumn(error) && error?.status !== 400) throw error
    const withoutCashbackCol = { ...core }
    delete withoutCashbackCol.cashback_used
    try {
      return await tryInsert(withoutCashbackCol)
    } catch (retryError) {
      if (!isMissingColumn(retryError) && retryError?.status !== 400) throw retryError
      const minimal = omitNullish({
        visit_id: core.visit_id,
        patient_id: core.patient_id,
        clinic_id: core.clinic_id,
        amount: core.amount,
        payment_type: core.payment_type,
        method: core.method,
        note: core.note,
        paid_at: core.paid_at,
      })
      return await tryInsert(minimal)
    }
  }
}

export const syncVisitAfterPayment = async (visitId) => {
  try {
    const visit = await getVisitById(visitId)
    if (!visit) return
    const { getPaymentsByVisitId } = await import('@/api/paymentsApi')
    const { getVisitServicesByVisitId } = await import('@/api/visitServicesApi')
    const [entries, services] = await Promise.all([
      getPaymentsByVisitId(visitId),
      getVisitServicesByVisitId(visitId).catch(() => []),
    ])
    const ledger = visitDueFrom({
      services,
      visitPrice: visit.price,
      payments: entries,
    })
    const update = {
      price: ledger.price > 0 ? ledger.price : (visit.price ?? null),
      paid_amount: ledger.paid > 0 ? ledger.paid : 0,
      debt_amount: ledger.remaining > 0 ? ledger.remaining : null,
    }
    if (visit.status === 'completed_debt' || visit.status === 'completed_paid') {
      update.status = ledger.remaining > 0 ? 'completed_debt' : 'completed_paid'
    }
    await updateVisit(visitId, update)
    try {
      const { recalculateVisitSettlement } = await import('@/services/soloBillingService')
      await recalculateVisitSettlement(visitId)
    } catch (settlementError) {
      console.warn('Solo billing settlement:', settlementError)
    }
  } catch (error) {
    console.warn('Visit to‘lov holatini yangilash:', error)
  }
}

export async function postVisitPayment({
  visitId,
  amount,
  type = 'payment',
  method = null,
  note = null,
  patientId = null,
  doctorId = null,
  paidAt = null,
  cashbackUsed = 0,
}) {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan. Kirish qaytadan tekshirilsin.')

  let patient_id = patientId != null ? Number(patientId) : null
  let doctor_id = doctorId != null ? Number(doctorId) : null
  if (patient_id == null) {
    const visit = await getVisitById(visitId)
    patient_id = visit?.patient_id ? Number(visit.patient_id) : null
    doctor_id = doctor_id ?? (visit?.doctor_id ? Number(visit.doctor_id) : null)
  }

  const used = Math.max(0, Number(cashbackUsed) || 0)
  const created = await insertPaymentRow({
    visit_id: Number(visitId),
    patient_id,
    doctor_id,
    clinic_id: cid,
    amount: Number(amount),
    payment_type: type,
    method: method || 'cash',
    note: type === 'payment' ? withCashbackUsedNote(note, used) : (note || null),
    cashback_used: type === 'payment' ? used : 0,
    paid_at: paidAt || new Date().toISOString(),
  })
  await syncVisitAfterPayment(visitId)
  return created
}
