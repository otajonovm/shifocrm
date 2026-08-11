/**
 * Daftar import — mavjud bemor/tashrif/to'lov API orqali.
 * RPC (import_patient_row) loyihada yo'q yoki anon uchun yopiq bo'lishi mumkin.
 */

import { createPatient, listPatients } from '@/api/patientsApi'
import { createVisit } from '@/api/visitsApi'
import { createPayment } from '@/api/paymentsApi'
import { createOdontogramSnapshot, createEmptyOdontogram } from '@/api/odontogramApi'
import { toothNotesToOdontogramData } from '@/lib/importOdontogramMap'
import { formatPhoneForStorage, normalizePhoneDigits } from '@/lib/phoneUz'

const resolveVisitStatus = (price, paidAmount) => {
  const priceNum = price == null ? null : Number(price)
  const paidNum = paidAmount == null ? null : Number(paidAmount)
  if (priceNum == null || !Number.isFinite(priceNum) || priceNum <= 0) return 'completed_paid'
  if (paidNum == null || !Number.isFinite(paidNum)) return 'completed_debt'
  return paidNum >= priceNum ? 'completed_paid' : 'completed_debt'
}

const findExistingPatient = async (phone) => {
  const stored = formatPhoneForStorage(phone)
  const digits = normalizePhoneDigits(phone)
  if (!digits && !stored) return null

  const matches = await listPatients({
    phone: digits || stored,
    limit: 20,
    select: 'id,full_name,phone,clinic_id',
  }).catch(() => [])

  return (matches || []).find((patient) => {
    const existingDigits = normalizePhoneDigits(patient.phone)
    return existingDigits && existingDigits === digits
  }) || null
}

const buildVisitHistory = (row) => {
  const history = Array.isArray(row.visit_history) ? row.visit_history.filter(Boolean) : []
  if (history.length) return history
  if (!row.last_visit && !row.diagnosis && row.total_price == null && row.total_paid == null) {
    return []
  }
  return [{
    visit_date: row.last_visit || null,
    service_name: row.diagnosis || null,
    price: row.total_price ?? null,
    paid_amount: row.total_paid ?? null,
    notes: row.notes || null,
    diagnosis: row.diagnosis || null,
  }]
}

/**
 * Bitta preview qatorini to'liq import qiladi.
 * @returns {Promise<{ patientId, visitIds, paymentIds, appointmentIds }>}
 */
export const importPatientRow = async (row) => {
  if (!row?.full_name?.trim()) {
    throw new Error('Ism kiritilmagan')
  }

  const phone = formatPhoneForStorage(row.phone) || row.phone || ''
  let patient = phone ? await findExistingPatient(phone) : null

  if (!patient) {
    patient = await createPatient({
      full_name: row.full_name.trim(),
      phone,
      birth_date: row.birth_date || null,
      address: row.address || null,
      notes: [row.diagnosis, row.notes].filter(Boolean).join('\n') || null,
      status: 'waiting',
      createFirstVisit: false,
    })
  }

  const visitIds = []
  const paymentIds = []

  for (const entry of buildVisitHistory(row)) {
    const price = entry.price ?? null
    const paidAmount = entry.paid_amount ?? null
    const visit = await createVisit({
      patient_id: patient.id,
      date: entry.visit_date || null,
      status: resolveVisitStatus(price, paidAmount),
      price,
      paid_amount: paidAmount,
      service_name: entry.service_name || entry.treatments?.[0] || null,
      notes: entry.notes || entry.diagnosis || 'Daftar import',
      channel: 'import',
      duration_minutes: 60,
    })
    if (visit?.id) visitIds.push(visit.id)

    if (visit?.id && paidAmount != null && Number(paidAmount) > 0) {
      try {
        const payment = await createPayment({
          visit_id: visit.id,
          patient_id: patient.id,
          amount: Number(paidAmount),
          payment_type: 'payment',
          method: 'cash',
          note: 'Daftar import',
        })
        if (payment?.id) paymentIds.push(payment.id)
      } catch {
        // to'lov ixtiyoriy — tashrif saqlangan bo'ladi
      }
    }
  }

  if (patient.id && visitIds[0] && (row.tooth_notes || []).length > 0) {
    const odontogramData = toothNotesToOdontogramData(
      row.tooth_notes,
      createEmptyOdontogram(),
    )
    await createOdontogramSnapshot({
      patient_id: patient.id,
      visit_id: visitIds[0],
      doctor_id: null,
      data: odontogramData,
    }).catch(() => {})
  }

  return {
    patientId: patient.id,
    visitIds,
    paymentIds,
    appointmentIds: [],
    idempotent: false,
  }
}

export const importPatientRows = async (rows) => {
  const results = []
  const errors = []
  for (let i = 0; i < rows.length; i += 1) {
    try {
      results.push(await importPatientRow(rows[i]))
    } catch (error) {
      errors.push({ index: i, error: error.message || String(error) })
    }
  }
  return { results, errors }
}
