import { supabaseRpc } from '@/api/supabaseConfig'

const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function postVisitPayment({
  visitId,
  amount,
  type = 'payment',
  method = null,
  cashShiftId = null,
  note = null,
  idempotencyKey = null,
}) {
  const result = await supabaseRpc('post_visit_payment', {
    p_visit_id: Number(visitId),
    p_amount: Number(amount),
    p_type: type,
    p_method: method || null,
    p_idempotency_key: idempotencyKey || createIdempotencyKey(),
    p_cash_shift_id: cashShiftId != null ? Number(cashShiftId) : null,
    p_note: note || null,
  })
  return Array.isArray(result) ? result[0] : result
}
