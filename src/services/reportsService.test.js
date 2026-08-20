import { describe, expect, it } from 'vitest'
import {
  buildReportSummary,
  buildRevenueData,
  defaultReportRange,
  reportCacheKey,
} from './reportsService'

describe('reportsService cache helpers', () => {
  it('builds a 30-day default range', () => {
    const now = new Date(2026, 7, 20)
    const range = defaultReportRange(now)
    expect(range.endDate).toBe(now.toISOString().slice(0, 10))
    const start = new Date(now)
    start.setDate(now.getDate() - 30)
    expect(range.startDate).toBe(start.toISOString().slice(0, 10))
  })

  it('scopes cache keys by clinic and dates', () => {
    expect(reportCacheKey(12, '2026-08-01', '2026-08-20')).toBe('12:2026-08-01:2026-08-20')
  })
})

describe('reportsService aggregations', () => {
  it('summarizes payments without pulling expenses unless requested', () => {
    const summary = buildReportSummary({
      payments: [
        { amount: 100000, payment_type: 'payment' },
        { amount: 20000, payment_type: 'refund' },
      ],
      expenses: [{ amount: 15000 }],
      subtractExpenses: true,
    })
    expect(summary.totalPayments).toBe(100000)
    expect(summary.totalRefunds).toBe(20000)
    expect(summary.totalExpenses).toBe(15000)
    expect(summary.netIncome).toBe(65000)
  })

  it('groups revenue by day from already-fetched payments', () => {
    const rows = buildRevenueData([
      { paid_at: '2026-08-01T10:00:00', amount: 50000, payment_type: 'payment' },
      { paid_at: '2026-08-01T12:00:00', amount: 25000, payment_type: 'payment' },
      { paid_at: '2026-08-02T09:00:00', amount: 10000, payment_type: 'payment' },
    ], 'day')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ day: '2026-08-01', net_income: 75000 })
    expect(rows[1]).toMatchObject({ day: '2026-08-02', net_income: 10000 })
  })
})
