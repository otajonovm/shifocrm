import { describe, it, expect } from 'vitest'
import { buildDoctorRevenueRows } from './doctorRevenueKpi'

describe('doctorRevenueKpi', () => {
  it('counts distinct visits and nets refunds', () => {
    const rows = buildDoctorRevenueRows({
      doctors: [{ id: 1, full_name: 'Dr A', salary_percentage: 40 }],
      payments: [
        { doctor_id: 1, visit_id: 10, amount: 100, payment_type: 'payment' },
        { doctor_id: 1, visit_id: 10, amount: 50, payment_type: 'payment' },
        { doctor_id: 1, visit_id: 11, amount: 20, payment_type: 'refund' },
        { doctor_id: 1, visit_id: 11, amount: 30, payment_type: 'discount' },
      ],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].visitsCount).toBe(1)
    expect(rows[0].gross).toBe(130)
    expect(rows[0].doctorShare).toBe(52)
  })
})
