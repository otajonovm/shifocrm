/**
 * Daftar import — transactional RPC (idempotent per job/row).
 * OCR paid_amount blank → null (not assumed equal to price).
 */

import { supabaseRpc } from '@/api/supabaseConfig'
import { createOdontogramSnapshot, createEmptyOdontogram } from '@/api/odontogramApi'
import { toothNotesToOdontogramData } from '@/lib/importOdontogramMap'
import { formatPhoneForStorage } from '@/lib/phoneUz'

/**
 * Bitta preview qatorini to'liq import qiladi.
 * @returns {Promise<{ patientId, visitIds, paymentIds, appointmentIds }>}
 */
export const importPatientRow = async (row, { jobId = null, rowIndex = 0 } = {}) => {
  if (!row?.full_name?.trim()) {
    throw new Error('Ism kiritilmagan')
  }

  const payload = {
    full_name: row.full_name.trim(),
    phone: formatPhoneForStorage(row.phone) || row.phone || '',
    birth_date: row.birth_date || null,
    address: row.address || null,
    notes: [row.diagnosis, row.notes].filter(Boolean).join('\n') || null,
    visit_history: (row.visit_history || []).map((v) => ({
      visit_date: v.visit_date || null,
      service_name: v.service_name || v.treatments?.[0] || null,
      price: v.price ?? null,
      // blank OCR paid stays null — never coerce to price
      paid_amount: v.paid_amount ?? null,
      notes: v.notes || null,
      diagnosis: v.diagnosis || null,
    })),
  }

  const effectiveJobId = jobId || (globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`)
  const result = await supabaseRpc('import_patient_row', {
    p_job_id: effectiveJobId,
    p_row_index: Number(rowIndex) || 0,
    p_payload: payload,
  })

  const patientId = result?.patient_id
  const visitIds = Array.isArray(result?.visit_ids) ? result.visit_ids : []

  if (patientId && visitIds[0] && (row.tooth_notes || []).length > 0) {
    const odontogramData = toothNotesToOdontogramData(
      row.tooth_notes,
      createEmptyOdontogram(),
    )
    await createOdontogramSnapshot({
      patient_id: patientId,
      visit_id: visitIds[0],
      doctor_id: null,
      data: odontogramData,
    })
  }

  return {
    patientId,
    visitIds,
    paymentIds: [],
    appointmentIds: [],
    idempotent: Boolean(result?.idempotent),
  }
}

export const importPatientRows = async (rows, { jobId = null } = {}) => {
  const results = []
  const errors = []
  const id = jobId || (globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`)
  for (let i = 0; i < rows.length; i += 1) {
    try {
      results.push(await importPatientRow(rows[i], { jobId: id, rowIndex: i }))
    } catch (error) {
      errors.push({ index: i, error: error.message || String(error) })
    }
  }
  return { results, errors }
}
