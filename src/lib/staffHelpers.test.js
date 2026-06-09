import { describe, it, expect } from 'vitest'
import {
  findChairConflict,
  schedulesOverlap,
  buildSchedulePayload,
  validateScheduleConflicts,
  legacyDoctorScheduleSlots,
  parseChairNumber,
  requiresDoctorCalendarBridge,
} from './staffHelpers'

describe('staffHelpers schedule validation', () => {
  const employees = [
    {
      id: 'emp-1',
      full_name: 'Dr. Karimov',
      is_active: true,
      doctor_schedules: [
        {
          chair_number: 1,
          day_of_week: 1,
          start_time: '09:00',
          end_time: '12:00',
        },
      ],
    },
  ]

  it('schedulesOverlap detects intersection', () => {
    expect(schedulesOverlap('09:00', '12:00', '11:00', '13:00')).toBe(true)
    expect(schedulesOverlap('09:00', '12:00', '12:00', '14:00')).toBe(false)
  })

  it('findChairConflict returns conflicting employee', () => {
    const conflict = findChairConflict(employees, 1, 1, '10:00', '11:00')
    expect(conflict?.employee?.full_name).toBe('Dr. Karimov')
  })

  it('findChairConflict ignores excluded employee', () => {
    const conflict = findChairConflict(employees, 1, 1, '10:00', '11:00', 'emp-1')
    expect(conflict).toBeNull()
  })

  it('buildSchedulePayload rejects end before start', () => {
    expect(() =>
      buildSchedulePayload({
        chair: 1,
        work_schedule: {
          days: {
            mon: { enabled: true, start: '14:00', end: '09:00' },
          },
        },
      })
    ).toThrow(/tugash vaqti/)
  })

  it('validateScheduleConflicts finds payload conflict', () => {
    const payload = [
      { chair_number: 1, day_of_week: 1, start_time: '10:30', end_time: '11:30' },
    ]
    const conflict = validateScheduleConflicts(employees, payload)
    expect(conflict?.employee?.full_name).toBe('Dr. Karimov')
  })

  it('validateScheduleConflicts detects unmigrated legacy doctor', () => {
    const legacyDoctors = [
      {
        id: 99,
        full_name: 'Dr. Legacy',
        is_active: true,
        work_schedule: {
          chair_number: '2-Kreslo',
          days: {
            mon: { enabled: true, start: '09:00', end: '13:00' },
          },
        },
      },
    ]
    const payload = [
      { chair_number: 2, day_of_week: 1, start_time: '10:00', end_time: '11:00' },
    ]
    const conflict = validateScheduleConflicts([], payload, null, { legacyDoctors })
    expect(conflict?.employee?.full_name).toBe('Dr. Legacy')
    expect(conflict?.source).toBe('legacy_doctor')
  })

  it('buildSchedulePayload returns empty for non-doctor roles', () => {
    const result = buildSchedulePayload(
      { chair: '', work_schedule: { days: {} } },
      null,
      { isDoctor: false }
    )
    expect(result).toEqual([])
  })

  it('parseChairNumber handles label format', () => {
    expect(parseChairNumber('2-Kreslo')).toBe(2)
    expect(parseChairNumber('Xirurgiya xonasi')).toBe(4)
  })

  it('requiresDoctorCalendarBridge excludes admin roles', () => {
    expect(requiresDoctorCalendarBridge('Terapevt')).toBe(true)
    expect(requiresDoctorCalendarBridge('Administrator (Reception)')).toBe(false)
  })

  it('legacyDoctorScheduleSlots parses work_schedule JSON', () => {
    const slots = legacyDoctorScheduleSlots({
      is_active: true,
      work_schedule: {
        chair_number: '1-Kreslo',
        days: { wed: { enabled: true, start: '14:00', end: '18:00' } },
      },
    })
    expect(slots).toHaveLength(1)
    expect(slots[0].day_of_week).toBe(3)
    expect(slots[0].chair_number).toBe(1)
  })
})
