/** Klinika kalendari: kunlik ko'rinish uchun ish vaqti oralig'i */

export const DEFAULT_CALENDAR_START = '08:00'
export const DEFAULT_CALENDAR_END = '20:00'

export function normalizeCalendarTime(value) {
  if (!value) return ''
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

export function timeStringToHour(timeStr) {
  const normalized = normalizeCalendarTime(timeStr)
  if (!normalized) return null
  const [hours] = normalized.split(':').map(Number)
  return Number.isFinite(hours) ? hours : null
}

export function validateCalendarHours(start, end) {
  const startH = timeStringToHour(start)
  const endH = timeStringToHour(end)
  if (startH == null || endH == null) {
    return 'Kalendar ish vaqti noto\'g\'ri kiritilgan.'
  }
  if (endH <= startH) {
    return 'Ish tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak.'
  }
  return null
}

export function resolveCalendarHourRange(startTime, endTime) {
  const range = resolveCalendarMinuteRange(startTime, endTime)
  return {
    startHour: Math.floor(range.startMinutes / 60),
    endHour: Math.ceil(range.endMinutes / 60),
  }
}

export function timeStringToMinutes(timeStr) {
  const normalized = normalizeCalendarTime(timeStr)
  if (!normalized) return null
  const [hours, minutes = 0] = normalized.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

export function minutesToTimeString(totalMinutes) {
  const safe = Math.max(0, Number(totalMinutes) || 0)
  const hours = Math.floor(safe / 60) % 24
  const minutes = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function resolveCalendarMinuteRange(startTime, endTime) {
  const startMinutes = timeStringToMinutes(startTime) ?? timeStringToMinutes(DEFAULT_CALENDAR_START)
  const endMinutes = timeStringToMinutes(endTime) ?? timeStringToMinutes(DEFAULT_CALENDAR_END)
  const safeStart = Number.isFinite(startMinutes) ? startMinutes : 8 * 60
  const safeEnd = Number.isFinite(endMinutes) ? endMinutes : 20 * 60
  return {
    startMinutes: safeStart,
    endMinutes: Math.max(safeStart + 30, safeEnd),
  }
}

/** Klinika ish vaqti oralig'idagi vaqt katakchalari (masalan har 30 daqiqa) */
export function buildCalendarTimeSlots(startTime, endTime, intervalMinutes = 30) {
  const { startMinutes, endMinutes } = resolveCalendarMinuteRange(startTime, endTime)
  const step = Math.max(15, Number(intervalMinutes) || 30)
  const slots = []

  for (let minute = startMinutes; minute < endMinutes; minute += step) {
    const time = minutesToTimeString(minute)
    slots.push({
      key: `slot-${minute}`,
      time,
      display: time,
      isHalfHour: minute % 60 === 30,
    })
  }

  return slots
}
