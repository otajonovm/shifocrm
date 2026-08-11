import * as visitsApi from '@/api/visitsApi'

const SCHEDULE_CONFLICT_CODE = '23P01'

export function isScheduleConflictError(error) {
  const code = error?.code || error?.details?.code
  if (code === SCHEDULE_CONFLICT_CODE) return true
  const message = String(error?.message || '')
  return message.includes('23P01') || /exclusion|conflict/i.test(message)
}

/**
 * Visit + appointment ko'chirish (legacy update — move_visit RPC kerak emas).
 */
export async function moveVisit({ visitId, doctorId, date, startTime, durationMinutes = 60 }) {
  const duration = Math.max(Number(durationMinutes) || 60, 1)
  const [h, m] = String(startTime || '00:00').split(':').map(Number)
  const total = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) + duration
  const endTime = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`

  return visitsApi.updateVisit(visitId, {
    doctor_id: Number(doctorId),
    date,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: duration,
  })
}
