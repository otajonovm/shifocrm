/**
 * Daftar import — bemor, tashrif, to'lov, kalendar bog'lash.
 */

import { createPatient } from '@/api/patientsApi'
import { createVisit, syncAppointmentFromVisit } from '@/api/visitsApi'
import { createPayment } from '@/api/paymentsApi'
import { createOdontogramSnapshot, createEmptyOdontogram } from '@/api/odontogramApi'
import { toothNotesToOdontogramData } from '@/lib/importOdontogramMap'
import { formatPhoneForStorage } from '@/lib/phoneUz'

const resolveVisitStatus = (price, paidAmount) => {
  if (price == null || price <= 0) return 'completed_paid'
  const paid = paidAmount ?? 0
  if (paid >= price) return 'completed_paid'
  if (paid > 0) return 'completed_debt'
  return 'completed_debt'
}

const buildVisitNotes = (visit, diagnosis) => {
  const parts = [
    visit.diagnosis || diagnosis,
    visit.treatments?.length ? `Muolajalar: ${visit.treatments.join(', ')}` : null,
    visit.notes,
    'Daftar import',
  ].filter(Boolean)
  return parts.join('\n') || 'Daftar import'
}

const toPaidAtIso = (visitDate) => {
  if (!visitDate) return new Date().toISOString()
  const d = String(visitDate).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return `${d}T12:00:00.000Z`
  }
  return new Date().toISOString()
}

/**
 * Bitta preview qatorini to'liq import qiladi.
 * @returns {Promise<{ patientId, visitIds, paymentIds, appointmentIds }>}
 */
export const importPatientRow = async (row) => {
  if (!row?.full_name?.trim()) {
    throw new Error('Ism kiritilmagan')
  }

  const patient = await createPatient({
    full_name: row.full_name.trim(),
    phone: formatPhoneForStorage(row.phone) || row.phone || '',
    birth_date: row.birth_date || null,
    address: row.address || null,
    notes: [row.diagnosis, row.notes].filter(Boolean).join('\n') || null,
    createFirstVisit: false,
    status: 'waiting',
  })

  const visitIds = []
  const paymentIds = []
  const appointmentIds = []
  const visits = row.visit_history?.length
    ? row.visit_history
    : (row.last_visit ? [{
      visit_date: row.last_visit,
      service_name: null,
      price: null,
      paid_amount: null,
    }] : [])

  for (let i = 0; i < visits.length; i += 1) {
    const v = visits[i]
    const price = v.price
    const paidAmount = v.paid_amount ?? (price != null ? price : null)
    const status = resolveVisitStatus(price, paidAmount)

    const visit = await createVisit({
      patient_id: patient.id,
      date: v.visit_date || row.last_visit || undefined,
      start_time: v.start_time || null,
      status,
      price,
      paid_amount: paidAmount,
      service_name: v.service_name || v.treatments?.[0] || null,
      notes: buildVisitNotes(v, row.diagnosis),
      channel: 'import',
      duration_minutes: 60,
    })

    visitIds.push(visit.id)

    if (paidAmount != null && paidAmount > 0) {
      const payment = await createPayment({
        visit_id: visit.id,
        patient_id: patient.id,
        amount: paidAmount,
        payment_type: 'payment',
        method: 'cash',
        note: `Daftar import — ${v.service_name || 'muolaja'}`,
        paid_at: toPaidAtIso(v.visit_date),
      })
      if (payment?.id) paymentIds.push(payment.id)
    }

    if (v.visit_date && v.start_time) {
      try {
        const appt = await syncAppointmentFromVisit(visit)
        if (appt?.id) appointmentIds.push(appt.id)
      } catch {
        // kalendar ixtiyoriy
      }
    }

    if (i === 0 && (row.tooth_notes || []).length > 0) {
      const odontogramData = toothNotesToOdontogramData(
        row.tooth_notes,
        createEmptyOdontogram()
      )
      await createOdontogramSnapshot({
        patient_id: patient.id,
        visit_id: visit.id,
        doctor_id: null,
        data: odontogramData,
      })
    }
  }

  if (!visits.length && (row.tooth_notes || []).length > 0) {
    const visit = await createVisit({
      patient_id: patient.id,
      status: 'pending',
      notes: 'Daftar import — odontogramma',
      channel: 'import',
    })
    visitIds.push(visit.id)
    const odontogramData = toothNotesToOdontogramData(
      row.tooth_notes,
      createEmptyOdontogram()
    )
    await createOdontogramSnapshot({
      patient_id: patient.id,
      visit_id: visit.id,
      doctor_id: null,
      data: odontogramData,
    })
  }

  return {
    patientId: patient.id,
    visitIds,
    paymentIds,
    appointmentIds,
  }
}
