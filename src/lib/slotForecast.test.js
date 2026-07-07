import { describe, it, expect } from 'vitest'
import {
  buildNoShowRiskBySlot,
  suggestBestSlots,
  suggestRiskySlots,
  buildSlotForecastSummary,
} from './slotForecast'

const sampleVisits = [
  { date: '2026-01-06', start_time: '09:00', status: 'completed' },
  { date: '2026-01-06', start_time: '09:00', status: 'no_show' },
  { date: '2026-01-06', start_time: '09:00', status: 'no_show' },
  { date: '2026-01-13', start_time: '14:00', status: 'completed' },
  { date: '2026-01-13', start_time: '14:00', status: 'completed' },
  { date: '2026-01-13', start_time: '14:00', status: 'completed' },
]

describe('slotForecast', () => {
  it('buildNoShowRiskBySlot calculates rates per slot', () => {
    const slots = buildNoShowRiskBySlot(sampleVisits)
    const morning = slots.find((s) => s.hour === 9)
    expect(morning.total).toBe(3)
    expect(morning.noShow).toBe(2)
    expect(morning.rate).toBeCloseTo(66.7, 0)
  })

  it('suggestRiskySlots returns highest no-show slots', () => {
    const risky = suggestRiskySlots(sampleVisits, { minSamples: 2 })
    expect(risky[0].hour).toBe(9)
  })

  it('suggestBestSlots returns lowest no-show slots', () => {
    const best = suggestBestSlots(sampleVisits, { minSamples: 2 })
    expect(best[0].hour).toBe(14)
    expect(best[0].rate).toBe(0)
  })

  it('buildSlotForecastSummary aggregates report', () => {
    const summary = buildSlotForecastSummary(sampleVisits)
    expect(summary.totalVisits).toBeGreaterThan(0)
    expect(summary.noShowCount).toBe(2)
    expect(summary.bestSlots.length).toBeGreaterThan(0)
    expect(summary.riskySlots.length).toBeGreaterThan(0)
  })
})
