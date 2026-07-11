import { describe, it, expect } from 'vitest'
import { normalizeVisionImportRow, normalizeVisionImportRows } from './visionImportSchema'

describe('visionImportSchema', () => {
  it('normalizes visit_history with prices', () => {
    const row = normalizeVisionImportRow({
      full_name: 'Ali Valiyev',
      phone: '998901234567',
      diagnosis: 'Karies',
      visit_history: [
        {
          visit_date: '2026-01-10',
          start_time: '10:00',
          service_name: 'Plomba',
          price: 150000,
          paid_amount: 150000,
        },
      ],
    })

    expect(row.full_name).toBe('Ali Valiyev')
    expect(row.visit_history).toHaveLength(1)
    expect(row.total_paid).toBe(150000)
    expect(row.visit_history[0].start_time).toBe('10:00')
  })

  it('builds visit from last_visit when history empty', () => {
    const rows = normalizeVisionImportRows([{
      full_name: 'Test',
      last_visit: '2026-02-01',
      price: 200000,
    }])

    expect(rows[0].visit_history.length).toBeGreaterThan(0)
  })
})
