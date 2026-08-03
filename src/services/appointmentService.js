import { supabaseRpc } from '@/api/supabaseConfig'

const SCHEDULE_CONFLICT_CODE = '23P01'

export function isScheduleConflictError(error) {
  const code = error?.code || error?.details?.code
  if (code === SCHEDULE_CONFLICT_CODE) return true
  const message = String(error?.message || '')
  return message.includes('23P01') || /exclusion|conflict/i.test(message)
}

/**
 * Atomically move a visit (and linked appointment) via DB RPC.
 * @param {{ visitId: number|string, doctorId: number|string, date: string, startTime: string, durationMinutes?: number }} params
 */
export async function moveVisit({ visitId, doctorId, date, startTime, durationMinutes = 60 }) {
  const duration = Math.max(Number(durationMinutes) || 60, 1)
  return supabaseRpc('move_visit', {
    p_visit_id: Number(visitId),
    p_doctor_id: Number(doctorId),
    p_date: date,
    p_start_time: startTime,
    p_duration_minutes: duration,
  })
}
