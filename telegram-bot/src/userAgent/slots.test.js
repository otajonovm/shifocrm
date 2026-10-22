const test = require('node:test')
const assert = require('node:assert/strict')
const {
  findAvailableSlots,
  collectOpenSlots,
  pickExactSlot,
  nearestSlots,
} = require('./slots')

test('findAvailableSlots skips breaks and busy times', () => {
  const slots = findAvailableSlots({
    workingIntervals: [{ start: '09:00', end: '12:00' }],
    breakIntervals: [{ start: '10:00', end: '10:30' }],
    existingAppointments: [{ start_time: '11:00', end_time: '11:30' }],
    durationMinutes: 30,
    stepMinutes: 30,
  })
  const starts = slots.map((slot) => slot.start)
  assert.deepEqual(starts, ['09:00', '09:30', '10:30', '11:30'])
  assert.equal(starts.includes('10:00'), false)
  assert.equal(starts.includes('11:00'), false)
})

test('pickExactSlot chooses the less busy doctor', () => {
  const slots = [
    { date: '2026-10-22', start: '15:00', end: '15:30', doctorId: 1, doctorName: 'A', busyCount: 4 },
    { date: '2026-10-22', start: '15:00', end: '15:30', doctorId: 2, doctorName: 'B', busyCount: 1 },
  ]
  const picked = pickExactSlot(slots, '2026-10-22', '15:00')
  assert.equal(picked.doctorId, 2)
})

test('nearestSlots returns the closest alternatives', () => {
  const doctor = {
    id: 7,
    full_name: 'Ali',
    work_schedule: {
      days: {
        thu: { enabled: true, start: '09:00', end: '12:00' },
      },
    },
  }
  const { slots } = collectOpenSlots({
    doctors: [doctor],
    busyByDoctorDate: {
      '7|2026-10-22': [{ start: '10:00', end: '10:30' }],
    },
    fromDate: '2026-10-22',
    days: 1,
    durationMinutes: 30,
  })
  const nearest = nearestSlots(slots, '2026-10-22', '10:00', 2)
  assert.equal(nearest.length, 2)
  assert.equal(nearest[0].start, '09:30')
  assert.equal(nearest[1].start, '10:30')
})
