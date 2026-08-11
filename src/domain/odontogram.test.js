import { describe, it, expect } from 'vitest'
import {
  PERMANENT_TEETH,
  PERMANENT_QUADRANTS,
  PRIMARY_TEETH,
  normalizeToothStatus,
  normalizeToothRecord,
  cloneTeethOnly,
  createEmptyOdontogramData,
} from './odontogram'

describe('odontogram domain', () => {
  it('has 32 permanent and 20 primary teeth', () => {
    expect(PERMANENT_TEETH).toHaveLength(32)
    expect(PRIMARY_TEETH).toHaveLength(20)
    expect(PRIMARY_TEETH).toContain(51)
    expect(PRIMARY_TEETH).toContain(85)
    const quadrantTeeth = Object.values(PERMANENT_QUADRANTS).flat()
    expect(quadrantTeeth).toHaveLength(32)
    expect(new Set(quadrantTeeth)).toEqual(new Set(PERMANENT_TEETH))
  })

  it('normalizes legacy tooth values into one storage shape', () => {
    expect(normalizeToothStatus('filled')).toBe('filling')
    expect(normalizeToothStatus('root')).toBe('root_canal')
    expect(normalizeToothRecord({ status: 'filling', notes: 'x', serviceId: 7 }))
      .toEqual({ state: 'filled', note: 'x', service_id: 7 })
  })

  it('carries the previous clinical state without completion metadata', () => {
    const cloned = cloneTeethOnly({
      teeth: {
        11: { state: 'caries', note: 'kuzatish' },
        12: { status: 'filled', notes: 'x', service_id: 8 },
      },
      _status: 'completed',
      _completed_at: '2026-01-01',
    })
    expect(cloned.teeth['11']).toEqual({ state: 'caries', note: 'kuzatish' })
    expect(cloned.teeth['12']).toEqual({ state: 'filled', note: 'x', service_id: 8 })
    expect(cloned._status).toBeUndefined()
    expect(createEmptyOdontogramData('primary').teeth['55'].state).toBe('healthy')
  })
})
