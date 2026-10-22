const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const toMinutes = (timeText) => {
  if (typeof timeText === 'number' && Number.isFinite(timeText)) {
    return Math.max(0, Math.floor(timeText))
  }
  const [hours, minutes] = String(timeText || '00:00').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return (hours * 60) + minutes
}

const toTimeString = (minutes) => {
  const safe = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const normalizeInterval = (interval) => {
  if (!interval) return null
  const start = toMinutes(interval.start)
  const end = toMinutes(interval.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return { start, end }
}

const mergeIntervals = (intervals = []) => {
  const normalized = intervals
    .map(normalizeInterval)
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)

  if (normalized.length === 0) return []

  const merged = [normalized[0]]
  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }
  return merged
}

const subtractIntervals = (sourceIntervals = [], blockedIntervals = []) => {
  const source = mergeIntervals(sourceIntervals)
  const blocked = mergeIntervals(blockedIntervals)
  if (blocked.length === 0) return source

  const result = []

  source.forEach((sourceItem) => {
    let cursor = sourceItem.start

    blocked.forEach((block) => {
      if (block.end <= cursor || block.start >= sourceItem.end) return

      if (block.start > cursor) {
        result.push({ start: cursor, end: Math.min(block.start, sourceItem.end) })
      }

      cursor = Math.max(cursor, block.end)
    })

    if (cursor < sourceItem.end) {
      result.push({ start: cursor, end: sourceItem.end })
    }
  })

  return mergeIntervals(result)
}

const findAvailableSlots = ({
  workingIntervals = [],
  breakIntervals = [],
  blockedIntervals = [],
  existingAppointments = [],
  durationMinutes = 30,
  stepMinutes = 30,
} = {}) => {
  const duration = Math.max(5, Number(durationMinutes) || 30)
  const step = Math.max(5, Number(stepMinutes) || 30)

  const busyIntervals = [
    ...breakIntervals,
    ...blockedIntervals,
    ...existingAppointments.map((entry) => ({
      start: entry.start || entry.start_time,
      end: entry.end || entry.end_time,
    })),
  ]

  const freeIntervals = subtractIntervals(workingIntervals, busyIntervals)
  const slots = []

  freeIntervals.forEach((interval) => {
    for (let start = interval.start; start + duration <= interval.end; start += step) {
      slots.push({
        start: toTimeString(start),
        end: toTimeString(start + duration),
        startMinutes: start,
        endMinutes: start + duration,
      })
    }
  })

  return slots
}

const addDays = (dateText, days) => {
  const [year, month, day] = String(dateText).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const weekdayKey = (dateText) => {
  const [year, month, day] = String(dateText).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return DAY_KEYS[date.getUTCDay()]
}

const dateTimeMinutes = (dateText, timeText) => {
  const [year, month, day] = String(dateText).split('-').map(Number)
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86400000)
  return (dayIndex * 24 * 60) + toMinutes(timeText)
}

const parseSchedule = (schedule) => {
  if (!schedule) return null
  const value = typeof schedule === 'string' ? JSON.parse(schedule) : schedule
  if (!value || typeof value !== 'object' || !value.days) return null
  return value
}

const dayWorkingIntervals = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.start || !daySchedule.end) return []
  return [{ start: daySchedule.start, end: daySchedule.end }]
}

const dayBreakIntervals = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.break_start || !daySchedule.break_end) return []
  return [{ start: daySchedule.break_start, end: daySchedule.break_end }]
}

/**
 * @param {object} params
 * @param {Array<{id: number, full_name?: string, work_schedule?: object}>} params.doctors
 * @param {Record<string, Array<{start: string, end: string}>>} params.busyByDoctorDate
 * @param {string} params.fromDate YYYY-MM-DD
 * @param {number} [params.days]
 * @param {number} [params.durationMinutes]
 * @param {string} [params.notBeforeTime] today only, HH:MM
 */
function collectOpenSlots({
  doctors = [],
  busyByDoctorDate = {},
  fromDate,
  days = 14,
  durationMinutes = 30,
  notBeforeTime = '',
} = {}) {
  const slots = []
  let hasSchedule = false

  doctors.forEach((doctor) => {
    let schedule = null
    try {
      schedule = parseSchedule(doctor.work_schedule)
    } catch {
      schedule = null
    }
    if (!schedule?.days) return
    hasSchedule = true

    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(fromDate, offset)
      const daySchedule = schedule.days[weekdayKey(date)]
      const workingIntervals = dayWorkingIntervals(daySchedule)
      if (!workingIntervals.length) continue

      const busyKey = `${doctor.id}|${date}`
      const existing = busyByDoctorDate[busyKey] || []
      const open = findAvailableSlots({
        workingIntervals,
        breakIntervals: dayBreakIntervals(daySchedule),
        existingAppointments: existing,
        durationMinutes,
        stepMinutes: durationMinutes,
      })

      open.forEach((slot) => {
        if (offset === 0 && notBeforeTime && slot.start < notBeforeTime) return
        slots.push({
          date,
          start: slot.start,
          end: slot.end,
          doctorId: Number(doctor.id),
          doctorName: doctor.full_name || `Shifokor #${doctor.id}`,
          busyCount: existing.length,
        })
      })
    }
  })

  return { slots, hasSchedule }
}

function pickExactSlot(slots, date, time) {
  const matches = slots.filter((slot) => slot.date === date && slot.start === time)
  if (!matches.length) return null
  return matches.sort((a, b) => a.busyCount - b.busyCount)[0]
}

function nearestSlots(slots, date, time, limit = 3) {
  const target = dateTimeMinutes(date, time)
  return slots
    .map((slot) => ({
      ...slot,
      distance: Math.abs(dateTimeMinutes(slot.date, slot.start) - target),
    }))
    .filter((slot) => slot.distance > 0 || slot.start !== time || slot.date !== date)
    .sort((a, b) => a.distance - b.distance || a.start.localeCompare(b.start))
    .slice(0, limit)
    .map(({ distance, ...slot }) => slot)
}

module.exports = {
  findAvailableSlots,
  addDays,
  weekdayKey,
  collectOpenSlots,
  pickExactSlot,
  nearestSlots,
  toMinutes,
  toTimeString,
}
