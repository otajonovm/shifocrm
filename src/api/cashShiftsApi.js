/**
 * Kassa smenalari API
 */

import { supabasePost, supabasePatch } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'

const TABLE = 'cash_shifts'

export const getOpenCashShift = async () => {
  const cid = await getCurrentClinicId()
  if (!cid) return null
  const rows = await supabaseGetWithClinicFallback(
    TABLE,
    'status=eq.open&order=opened_at.desc&limit=1',
    cid
  )
  return rows && rows[0] ? rows[0] : null
}

export const listCashShifts = async (limit = 20) => {
  const cid = await getCurrentClinicId()
  if (!cid) return []
  return await supabaseGetWithClinicFallback(
    TABLE,
    `order=opened_at.desc&limit=${Number(limit) || 20}`,
    cid
  )
}

export const openCashShift = async ({ openingBalance = 0, openedBy = '' } = {}) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan.')

  const existing = await getOpenCashShift()
  if (existing) {
    throw new Error('Ochiq smena allaqachon mavjud. Avval uni yoping.')
  }

  const payload = {
    clinic_id: cid,
    opening_balance: Number(openingBalance) || 0,
    opened_by: openedBy || null,
    status: 'open',
    opened_at: new Date().toISOString(),
  }

  const result = await supabasePost(TABLE, payload)
  return result[0]
}

export const closeCashShift = async (shiftId, summary = {}) => {
  const numId = Number(shiftId)
  if (!Number.isFinite(numId)) throw new Error('Smena ID noto\'g\'ri.')

  const payload = {
    status: 'closed',
    closed_at: new Date().toISOString(),
    closing_balance: summary.closingBalance != null ? Number(summary.closingBalance) : null,
    expected_balance: summary.expectedBalance != null ? Number(summary.expectedBalance) : null,
    cash_total: Number(summary.cashTotal) || 0,
    card_total: Number(summary.cardTotal) || 0,
    transfer_total: Number(summary.transferTotal) || 0,
    other_total: Number(summary.otherTotal) || 0,
    refund_total: Number(summary.refundTotal) || 0,
    notes: summary.notes || null,
    updated_at: new Date().toISOString(),
  }

  const result = await supabasePatch(TABLE, numId, payload)
  return result[0]
}
