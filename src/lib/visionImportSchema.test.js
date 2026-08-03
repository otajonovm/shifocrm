import { describe, it, expect } from 'vitest'
import { normalizeVisionImportRow } from './visionImportSchema'

describe('visionImportSchema', () => {
  it('does not assume blank paid_amount equals price', () => {
    const row = normalizeVisionImportRow({
      full_name: 'Test',
      visit_history: [{ visit_date: '2026-01-01', service_name: 'Plomba', price: 150000 }],
    })
    expect(row.visit_history[0].price).toBe(150000)
    expect(row.visit_history[0].paid_amount).toBeNull()
  })
})
