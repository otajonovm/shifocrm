import { describe, expect, it } from 'vitest'
import { buildDailyBreakdown, buildDailyBreakdownRange, localDateStr, sumPayments, uniquePatients } from './weekReport'

describe('weekReport', () => {
  it('sums payments and skips discounts', () => {
    expect(
      sumPayments([
        { amount: 100, payment_type: 'payment' },
        { amount: 20, payment_type: 'refund' },
        { amount: 5, payment_type: 'discount' },
        { amount: 10, payment_type: 'refund', note: '[DISCOUNT] aksiya' },
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

  it('keshbekni tushumdan bir marta ayiradi', () => {
    expect(
      sumPayments([
        { amount: 400000, payment_type: 'payment', cashback_used: 20000 },
      ]),
    ).toBe(380000)
  })

  it('tanlangan sana oralig‘ida kunlik tushumni yig‘adi', () => {
    const rows = buildDailyBreakdownRange(
      [
        { date: '2026-08-13', patient_id: 1, status: 'completed_paid' },
        { date: '2026-08-19', patient_id: 1, status: 'completed_paid' },
        { date: '2026-08-19', patient_id: 2, status: 'completed_paid' },
      ],
      [
        { paid_at: '2026-08-15T10:00:00', amount: 400000, payment_type: 'payment' },
        { paid_at: '2026-08-19T10:00:00', amount: 400000, payment_type: 'payment', cashback_used: 20000 },
      ],
      '2026-08-13',
      '2026-08-19',
    )
    expect(rows).toHaveLength(7)
    expect(rows[0].date).toBe('2026-08-13')
    expect(rows[6].date).toBe('2026-08-19')
    expect(rows[2].revenue).toBe(400000)
    expect(rows[6].revenue).toBe(380000)
    expect(rows.reduce((sum, row) => sum + row.revenue, 0)).toBe(780000)
    expect(uniquePatients([
      { patient_id: 1 },
      { patient_id: 1 },
      { patient_id: 2 },
    ])).toBe(2)
  })
})
