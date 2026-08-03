import { describe, it, expect } from 'vitest'
import {
  PERMANENT_TEETH,
  PRIMARY_TEETH,
  normalizeToothStatus,
  cloneTeethOnly,
  createEmptyOdontogramData,
} from './odontogram'

describe('odontogram domain', () => {
  it('has 32 permanent and 20 primary teeth', () => {
    expect(PERMANENT_TEETH).toHaveLength(32)
    expect(PRIMARY_TEETH).toHaveLength(20)
    expect(PRIMARY_TEETH).toContain(51)
    expect(PRIMARY_TEETH).toContain(85)
  })

  it('normalizes filled → filling and clones teeth only', () => {
    expect(normalizeToothStatus('filled')).toBe('filling')
    const cloned = cloneTeethOnly({
      teeth: { 11: { status: 'filled', notes: 'x' } },
      _status: 'completed',
      _completed_at: '2026-01-01',
    })
    expect(cloned.teeth['11'].status).toBe('filling')
    expect(cloned._status).toBeUndefined()
    expect(createEmptyOdontogramData('primary').teeth['55'].status).toBe('healthy')
  })
})
