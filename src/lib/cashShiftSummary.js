/**
 * Kassa smenasi uchun to'lovlarni usul bo'yicha umumlashtirish
 */

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
    paymentsCount: 0,
  }

  for (const entry of payments) {
    if (!entry || !entry.paid_at) continue
    const paidMs = new Date(entry.paid_at).getTime()
    if (Number.isNaN(paidMs) || paidMs < fromMs || paidMs > toMs) continue

    const amount = Number(entry.amount) || 0
    const type = String(entry.payment_type || 'payment')

    if (type === 'refund') {
      totals.refunds += Math.abs(amount)
      continue
    }

    if (type !== 'payment') continue

    totals.paymentsCount += 1
    const bucket = normalizeMethod(entry.method)
    totals[bucket] += amount
  }

  return totals
}

export const calcExpectedShiftBalance = (openingBalance, totals) => {
  const opening = Number(openingBalance) || 0
  const income =
    totals.cash + totals.card + totals.transfer + totals.other
  return opening + income - totals.refunds
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
