/**
 * Qabul vaqtlari kesishishini aniqlash (UI validatsiya)
 */

const CANCELLED_STATUSES = new Set(['cancelled', 'no_show', 'canceled'])

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const raw = String(timeStr).trim()
  const parts = raw.split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1] || 0)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

export const minutesToTimeString = (totalMinutes) => {
  const safe = Math.max(0, Number(totalMinutes) || 0)
  const h = Math.floor(safe / 60) % 24
  const m = safe % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const getVisitTimeRange = (visit) => {
  const start = parseTimeToMinutes(visit?.start_time)
  let end = visit?.end_time
    ? parseTimeToMinutes(visit.end_time)
    : start + (Number(visit?.duration_minutes) || 60)

  if (!end || end <= start) {
    end = start + (Number(visit?.duration_minutes) || 60)
  }

  return { start, end }
}

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd
}

export const findAppointmentConflicts = ({
  visits = [],
  doctorId,
  date,
  startTime,
  endTime = null,
  durationMinutes = 60,
  excludeVisitId = null,
}) => {
  if (!doctorId || !date || !startTime) return []

  const start = parseTimeToMinutes(startTime)
  const end = endTime
    ? parseTimeToMinutes(endTime)
    : start + (Number(durationMinutes) || 60)

  const targetDoctorId = Number(doctorId)
  const targetDate = String(date).slice(0, 10)

  return visits.filter((visit) => {
    if (!visit) return false
    if (excludeVisitId && Number(visit.id) === Number(excludeVisitId)) return false
    if (Number(visit.doctor_id) !== targetDoctorId) return false
    if (String(visit.date).slice(0, 10) !== targetDate) return false
    if (CANCELLED_STATUSES.has(String(visit.status || '').toLowerCase())) return false

    const range = getVisitTimeRange(visit)
    return rangesOverlap(start, end, range.start, range.end)
  })
}

export const formatConflictMessage = (conflicts = [], { patientMap = {} } = {}) => {
  if (!conflicts.length) return ''

  const lines = conflicts.slice(0, 3).map((visit) => {
    const name = patientMap[Number(visit.patient_id)]
      || visit.patient_name
      || `Bemor #${visit.patient_id}`
    const range = getVisitTimeRange(visit)
    return `${name} (${minutesToTimeString(range.start)}–${minutesToTimeString(range.end)})`
  })

  const suffix = conflicts.length > 3 ? ` va yana ${conflicts.length - 3} ta` : ''
  return `Vaqt band: ${lines.join(', ')}${suffix}`
}
