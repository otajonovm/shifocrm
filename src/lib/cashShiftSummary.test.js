import { describe, it, expect } from 'vitest'
import { summarizePaymentsByMethod, calcExpectedShiftBalance } from './cashShiftSummary'

describe('cashShiftSummary', () => {
  it('keeps expected cash balance cash-only', () => {
    const totals = summarizePaymentsByMethod([
      { paid_at: '2026-07-01T10:00:00Z', amount: 100, payment_type: 'payment', method: 'cash' },
      { paid_at: '2026-07-01T11:00:00Z', amount: 200, payment_type: 'payment', method: 'card' },
      { paid_at: '2026-07-01T12:00:00Z', amount: 50, payment_type: 'refund', method: 'cash' },
      { paid_at: '2026-07-01T12:30:00Z', amount: 20, payment_type: 'discount', method: 'cash' },
    ])
    expect(totals.cash).toBe(100)
    expect(totals.card).toBe(200)
    expect(totals.cashRefunds).toBe(50)
    expect(calcExpectedShiftBalance(1000, totals)).toBe(1050)
  })
})
