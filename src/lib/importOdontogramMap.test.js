import { describe, it, expect } from 'vitest'
import {
  mapConditionToState,
  normalizeToothId,
  toothNotesToOdontogramData,
} from './importOdontogramMap'

describe('importOdontogramMap', () => {
  it('normalizeToothId accepts valid FDI numbers', () => {
    expect(normalizeToothId('14')).toBe('14')
    expect(normalizeToothId('tish 36')).toBe('36')
    expect(normalizeToothId('99')).toBeNull()
  })

  it('mapConditionToState maps aliases', () => {
    expect(mapConditionToState('plomba')).toBe('filled')
    expect(mapConditionToState('missing')).toBe('missing')
    expect(mapConditionToState('karies')).toBe('caries')
  })

  it('toothNotesToOdontogramData maps notes to teeth states', () => {
    const data = toothNotesToOdontogramData([
      { tooth_id: '16', condition: 'caries', planned_service: 'plomba' },
      { tooth_id: '26', condition: 'missing' },
    ])

    expect(data.teeth['16'].state).toBe('caries')
    expect(data.teeth['16'].note).toContain('plomba')
    expect(data.teeth['26'].state).toBe('missing')
  })
})
