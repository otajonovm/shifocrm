import { describe, it, expect } from 'vitest'
import { scheduleRowsToWorkSchedule } from './staffHelpers'

describe('staffBridge helpers', () => {
  it('scheduleRowsToWorkSchedule builds JSON for doctors table', () => {
    const result = scheduleRowsToWorkSchedule([
      {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '18:00',
        chair_number: 2,
      },
      {
        day_of_week: 3,
        start_time: '10:00',
        end_time: '16:00',
        chair_number: 2,
      },
    ])

    expect(result.chair_number).toBe('2-Kreslo')
    expect(result.days.mon.enabled).toBe(true)
    expect(result.days.mon.start).toBe('09:00')
    expect(result.days.wed.enabled).toBe(true)
    expect(result.days.tue.enabled).toBe(false)
  })
})
