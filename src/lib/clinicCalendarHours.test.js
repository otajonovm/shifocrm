import { describe, it, expect } from 'vitest'
import {
  resolveCalendarHourRange,
  validateCalendarHours,
} from './clinicCalendarHours'

describe('clinicCalendarHours', () => {
  it('resolveCalendarHourRange parses start and end', () => {
    expect(resolveCalendarHourRange('09:00', '19:00')).toEqual({
      startHour: 9,
      endHour: 19,
    })
  })

  it('validateCalendarHours rejects invalid range', () => {
    expect(validateCalendarHours('20:00', '08:00')).toMatch(/keyin/)
  })
})
