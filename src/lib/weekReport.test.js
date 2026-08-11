import { describe, expect, it } from 'vitest'
import { buildDailyBreakdown, localDateStr, sumPayments, uniquePatients } from './weekReport'

describe('weekReport', () => {
  it('sums payments and skips discounts', () => {
    expect(
      sumPayments([
        { amount: 100, payment_type: 'payment' },
        { amount: 20, payment_type: 'refund' },
        { amount: 5, payment_type: 'discount' },
      ]),
    ).toBe(80)
  })

  it('counts unique patients', () => {
    expect(uniquePatients([{ patient_id: 1 }, { patient_id: 1 }, { patient_id: 2 }])).toBe(2)
  })

  it('builds 7 local days with visit and payment totals', () => {
    const now = new Date(2026, 7, 11)
    const today = localDateStr(now)
    const rows = buildDailyBreakdown(
      [{ date: today, patient_id: 9, status: 'completed_paid' }],
      [{ paid_at: `${today}T10:00:00`, amount: 150000, payment_type: 'payment' }],
      7,
      now,
    )
    expect(rows).toHaveLength(7)
    expect(rows[6].date).toBe(today)
    expect(rows[6].patients).toBe(1)
    expect(rows[6].revenue).toBe(150000)
    expect(rows[0].patients).toBe(0)
  })
})
