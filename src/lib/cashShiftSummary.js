import { isDiscountEntry, parseCashbackUsed } from '@/lib/paymentTotals'

const normalizeMethod = (method) => {
  const m = String(method || '').toLowerCase().trim()
  if (m === 'cash' || m === 'naqd') return 'cash'
  if (m === 'card' || m === 'karta') return 'card'
  if (m === 'transfer' || m === 'o\'tkazma' || m === 'otkazma') return 'transfer'
  return 'other'
}

export const summarizePaymentsByMethod = (payments = [], { fromIso, toIso } = {}) => {
  const fromMs = fromIso ? new Date(fromIso).getTime() : 0
  const toMs = toIso ? new Date(toIso).getTime() : Number.POSITIVE_INFINITY

  const totals = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
    refunds: 0,
    cashRefunds: 0,
    paymentsCount: 0,
  }

  for (const entry of payments) {
    if (!entry || !entry.paid_at) continue
    const paidMs = new Date(entry.paid_at).getTime()
    if (Number.isNaN(paidMs) || paidMs < fromMs || paidMs > toMs) continue

    const amount = Number(entry.amount) || 0
    const type = String(entry.payment_type || 'payment')

    if (isDiscountEntry(entry) || type === 'discount') continue
    if (type === 'refund') {
      totals.refunds += Math.abs(amount)
      const bucket = normalizeMethod(entry.method)
      if (bucket === 'cash') {
        totals.cashRefunds = (totals.cashRefunds || 0) + Math.abs(amount)
      }
      continue
    }

    if (type === 'discount') continue
    if (type !== 'payment') continue

    totals.paymentsCount += 1
    const bucket = normalizeMethod(entry.method)
    const cashAmount = Math.max(0, amount - parseCashbackUsed(entry))
    totals[bucket] += cashAmount
  }

  return totals
}

/** Fizik kassa kutilgan qoldiq — faqat naqd (card/transfer kassada yo‘q). */
export const calcExpectedShiftBalance = (openingBalance, totals) => {
  const opening = Number(openingBalance) || 0
  const cashIn = Number(totals.cash) || 0
  // Refunds: faqat naqd refundlar kassa qoldig‘idan chiqadi; aniq usul yo‘q bo‘lsa taxminiy cash.
  const refunds = Number(totals.refunds) || 0
  const cashRefunds = Number(totals.cashRefunds)
  const refundCash = Number.isFinite(cashRefunds) ? cashRefunds : refunds
  return opening + cashIn - refundCash
}

export const buildShiftCloseReport = ({
  shift,
  payments,
  closingBalance,
  notes = '',
}) => {
  const openedAt = shift.opened_at
  const closedAt = new Date().toISOString()
  const totals = summarizePaymentsByMethod(payments, {
    fromIso: openedAt,
    toIso: closedAt,
  })
  const expected = calcExpectedShiftBalance(shift.opening_balance, totals)
  const closing = closingBalance != null ? Number(closingBalance) : expected
  const difference = closing - expected

  return {
    openedAt,
    closedAt,
    openingBalance: Number(shift.opening_balance) || 0,
    totals,
    expectedBalance: expected,
    closingBalance: closing,
    difference,
    notes,
  }
}
