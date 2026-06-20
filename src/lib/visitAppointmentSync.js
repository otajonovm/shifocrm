/**
 * Visit ↔ Appointment sinxronizatsiya yordamchilari
 */

export const APPOINTMENT_STATUS_FROM_VISIT = {
  pending: 'scheduled',
  arrived: 'arrived',
  in_progress: 'confirmed',
  completed_paid: 'completed',
  completed_debt: 'completed',
  cancelled: 'canceled',
  canceled: 'canceled',
  no_show: 'no_show',
}

export const VISIT_STATUS_FROM_APPOINTMENT = {
  scheduled: 'pending',
  confirmed: 'pending',
  arrived: 'arrived',
  completed: 'completed_paid',
  canceled: 'cancelled',
  cancelled: 'cancelled',
  no_show: 'no_show',
}

export const buildScheduledAt = ({ date, startTime }) => {
  if (!date || !startTime) return null
  const d = String(date).slice(0, 10)
  const t = String(startTime).slice(0, 5)
  return `${d}T${t}:00`
}

export const parseScheduledAtParts = (scheduledAt) => {
  if (!scheduledAt) return { date: null, startTime: null }
  const raw = String(scheduledAt)
  return {
    date: raw.slice(0, 10),
    startTime: raw.slice(11, 16),
  }
}

export const mapVisitStatusToAppointment = (visitStatus) =>
  APPOINTMENT_STATUS_FROM_VISIT[String(visitStatus || '').toLowerCase()] || null

export const mapAppointmentStatusToVisit = (appointmentStatus) =>
  VISIT_STATUS_FROM_APPOINTMENT[String(appointmentStatus || '').toLowerCase()] || null

export const buildEndTimeFromStart = (startTime, durationMinutes = 60) => {
  if (!startTime) return null
  const [h, m] = String(startTime).slice(0, 5).split(':').map(Number)
  const total = h * 60 + m + (Number(durationMinutes) || 60)
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}
