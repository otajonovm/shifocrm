import { supabaseRpc } from '@/api/supabaseConfig'

/**
 * Atomically consume clinic inventory materials for a visit (all-or-none).
 */
export async function consumeVisitMaterials({ visitId, lines, sourceKey }) {
  if (!visitId) throw new Error('visitId required')
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('Material lines required')
  }
  if (!sourceKey) throw new Error('sourceKey required')

  const payload = lines.map((line) => ({
    item_id: Number(line.item_id ?? line.itemId),
    quantity: Number(line.quantity),
    patient_id: line.patient_id ?? line.patientId ?? null,
    doctor_id: line.doctor_id ?? line.doctorId ?? null,
  }))

  if (payload.some((l) => !Number.isFinite(l.item_id) || !Number.isFinite(l.quantity) || l.quantity <= 0)) {
    throw new Error('Invalid material line')
  }

  return supabaseRpc('consume_visit_materials', {
    p_visit_id: Number(visitId),
    p_lines: payload,
    p_source_key: String(sourceKey),
  })
}

export async function reverseVisitConsumption(logId) {
  return supabaseRpc('reverse_visit_consumption', {
    p_log_id: Number(logId),
  })
}

export async function consumeLegacyInventoryItem(payload) {
  return supabaseRpc('consume_legacy_inventory_item', {
    p_visit_id: Number(payload.visit_id),
    p_patient_id: Number(payload.patient_id),
    p_doctor_id: payload.doctor_id != null ? Number(payload.doctor_id) : null,
    p_item_id: Number(payload.item_id),
    p_quantity: Number(payload.quantity),
    p_note: payload.note || null,
    p_source_key: payload.source_key || null,
  })
}
