/**
 * Public Doctor Profile API - No authentication required for read-only public data
 * Fetch doctor info and services for public lead capture pages
 */

import { supabaseGet } from './supabaseConfig'
import { findAvailableSlots } from '@/lib/smartCalendar/schedulingEngine'

const ACTIVE_VISIT_STATUSES = ['pending', 'arrived', 'in_progress', 'scheduled', 'confirmed']
const ACTIVE_LEAD_HOLD_STATUSES = ['new', 'contacted']
const BOOKED_LEAD_STATUS = 'booked'

const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const normalizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== 'object') return null
  const days = schedule.days && typeof schedule.days === 'object' ? schedule.days : null
  if (!days) return null
  return {
    timezone: schedule.timezone || 'Asia/Tashkent',
    days
  }
}

const toLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildDateRange = (daysAhead = 14) => {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + Math.max(1, Number(daysAhead) || 14))
  const startDate = toLocalDateString(start)
  const endDate = toLocalDateString(end)
  return { startDate, endDate }
}

const mapVisitsByDate = (rows = []) => {
  const map = new Map()
  rows.forEach((visit) => {
    const date = String(visit.date || '').slice(0, 10)
    if (!date) return
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(visit)
  })
  return map
}

const mapLeadsByDate = (rows = []) => {
  const map = new Map()
  rows.forEach((lead) => {
    const date = String(lead.preferred_date || '').slice(0, 10)
    if (!date) return
    if (!map.has(date)) map.set(date, [])
    map.get(date).push(lead)
  })
  return map
}

const normalizeTimeText = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const [hours, minutes] = raw.split(':')
  if (!hours || !minutes) return raw
  const hourNum = Number(hours)
  const minuteNum = Number(minutes)
  if (!Number.isFinite(hourNum) || !Number.isFinite(minuteNum)) return raw
  return `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`
}

const addMinutesToTime = (timeText, minutesToAdd) => {
  const [hours, minutes] = String(timeText || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
  const total = (hours * 60) + minutes + Math.max(1, Number(minutesToAdd) || 30)
  const endHour = Math.floor(total / 60)
  const endMinute = total % 60
  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
}

const buildWorkingIntervalsForDay = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.start || !daySchedule.end) return []
  return [{ start: daySchedule.start, end: daySchedule.end }]
}

const buildBreakIntervalsForDay = (daySchedule) => {
  if (!daySchedule?.enabled) return []
  if (!daySchedule.break_start || !daySchedule.break_end) return []
  return [{ start: daySchedule.break_start, end: daySchedule.break_end }]
}

const toVisitInterval = (visit) => {
  if (!visit?.start_time) return null
  const start = String(visit.start_time)
  const end = visit.end_time
    ? String(visit.end_time)
    : null

  if (end) return { start, end }

  const duration = Number(visit.duration_minutes)
  if (!Number.isFinite(duration) || duration <= 0) return null

  const [h, m] = start.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const total = (h * 60) + m + duration
  const endH = Math.floor(total / 60)
  const endM = total % 60
  const endText = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return { start, end: endText }
}

const isActiveVisit = (visit) => ACTIVE_VISIT_STATUSES.includes(String(visit?.status || '').toLowerCase())

const isLeadBlockingSlot = (lead, nowMs) => {
  const status = String(lead?.status || '').toLowerCase()
  if (status === BOOKED_LEAD_STATUS) return true
  if (!ACTIVE_LEAD_HOLD_STATUSES.includes(status)) return false

  const expiresAt = lead?.hold_expires_at ? new Date(lead.hold_expires_at).getTime() : NaN
  if (!Number.isFinite(expiresAt)) return false
  return expiresAt > nowMs
}

const toLeadInterval = (lead, slotMinutes = 30) => {
  const start = normalizeTimeText(lead?.preferred_time)
  if (!start) return null
  const end = addMinutesToTime(start, slotMinutes)
  if (!end) return null
  return { start, end }
}

const isMissingColumnError = (error, columnName) => {
  const message = String(error?.message || '').toLowerCase()
  const details = String(error?.details || '').toLowerCase()
  return message.includes(columnName) || details.includes(columnName)
}

const formatDateLabel = (dateText) => {
  const date = new Date(`${dateText}T00:00:00`)
  return date.toLocaleDateString('uz-UZ', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

/**
 * Get doctor by public slug (public, no auth required)
 * @param {string} slug - doctor public_slug
 * @returns {object|null} Doctor object with public fields or null
 */
export const getDoctorByPublicSlug = async (slug) => {
  try {
    const cleanSlug = String(slug || '').trim().toLowerCase()
    if (!cleanSlug) throw new Error('Slug required')

    const queryWithLocation = `public_slug=eq.${encodeURIComponent(cleanSlug)}&is_public=eq.true&select=id,full_name,phone,public_bio,public_avatar_url,public_location_url,specialization,clinic_id,public_phone,public_telegram,public_whatsapp,work_schedule`
    const queryWithoutLocation = `public_slug=eq.${encodeURIComponent(cleanSlug)}&is_public=eq.true&select=id,full_name,phone,public_bio,public_avatar_url,specialization,clinic_id,public_phone,public_telegram,public_whatsapp,work_schedule`

    let rows
    try {
      rows = await supabaseGet('doctors', queryWithLocation)
    } catch (error) {
      if (!isMissingColumnError(error, 'public_location_url')) {
        throw error
      }
      rows = await supabaseGet('doctors', queryWithoutLocation)
    }

    if (!rows || !rows[0]) return null

    const doctor = rows[0]
    const fallbackPhone = doctor.public_phone || doctor.phone || ''

    return {
      ...doctor,
      public_location_url: doctor.public_location_url || null,
      public_phone: fallbackPhone,
      public_whatsapp: doctor.public_whatsapp || fallbackPhone,
    }
  } catch (error) {
    console.error('❌ Failed to fetch doctor profile:', error)
    throw error
  }
}

/**
 * Get services offered by a clinic doctor
 * @param {number} clinicId
 * @returns {array} List of services {id, name, price}
 */
export const getDoctorServices = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')

    const rows = await supabaseGet(
      'services',
      `clinic_id=eq.${numId}&order=name&select=id,name,base_price`
    )
    return (rows || []).map((item) => ({
      ...item,
      price: Number(item.base_price) || 0
    }))
  } catch (error) {
    console.error('❌ Failed to fetch services:', error)
    return []
  }
}

/**
 * Get clinic info (name, logo)
 * @param {number} clinicId
 * @returns {object|null} Clinic object or null
 */
export const getDoctorClinicInfo = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')

    const rows = await supabaseGet(
      'clinics',
      `id=eq.${numId}&select=id,name,logo_url`
    )
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch clinic info:', error)
    throw error
  }
}

/**
 * Build dynamic free slots from doctor work schedule and existing visits.
 * @param {{doctorId: number|string, workSchedule?: any, daysAhead?: number, slotMinutes?: number}} options
 * @returns {Promise<Array<{date: string, label: string, slots: Array<{start: string, end: string}>}>>}
 */
export const getDoctorAvailableSlots = async ({
  doctorId,
  workSchedule = null,
  daysAhead = 14,
  slotMinutes = 30
}) => {
  try {
    const numDoctorId = Number(doctorId)
    if (!Number.isFinite(numDoctorId)) throw new Error('Invalid doctor_id')

    const schedule = normalizeSchedule(workSchedule)
    if (!schedule?.days) return []

    const { startDate, endDate } = buildDateRange(daysAhead)
    const rows = await supabaseGet(
      'visits',
      `doctor_id=eq.${numDoctorId}&date=gte.${startDate}&date=lte.${endDate}&select=id,date,start_time,end_time,duration_minutes,status&order=date.asc,start_time.asc`
    )

    const leadRows = await supabaseGet(
      'leads',
      `doctor_id=eq.${numDoctorId}&preferred_date=gte.${startDate}&preferred_date=lte.${endDate}&select=id,preferred_date,preferred_time,status,hold_expires_at&order=preferred_date.asc,preferred_time.asc`
    )

    const visitsByDate = mapVisitsByDate(rows || [])
    const leadsByDate = mapLeadsByDate(leadRows || [])
    const result = []
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    const nowMs = Date.now()
    const targetSlotMinutes = Math.max(10, Number(slotMinutes) || 30)

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dateText = toLocalDateString(cursor)
      const dayKey = DAY_KEY_BY_INDEX[cursor.getDay()]
      const daySchedule = schedule.days?.[dayKey]
      if (!daySchedule?.enabled) continue

      const workingIntervals = buildWorkingIntervalsForDay(daySchedule)
      if (!workingIntervals.length) continue

      const breakIntervals = buildBreakIntervalsForDay(daySchedule)
      const existingVisits = (visitsByDate.get(dateText) || [])
        .filter(isActiveVisit)
        .map(toVisitInterval)
        .filter(Boolean)

      const existingLeadHolds = (leadsByDate.get(dateText) || [])
        .filter((lead) => isLeadBlockingSlot(lead, nowMs))
        .map((lead) => toLeadInterval(lead, targetSlotMinutes))
        .filter(Boolean)

      const existing = [...existingVisits, ...existingLeadHolds]

      const slots = findAvailableSlots({
        workingIntervals,
        breakIntervals,
        existingAppointments: existing,
        blockedIntervals: [],
        durationMinutes: targetSlotMinutes,
        stepMinutes: Math.max(5, targetSlotMinutes)
      }).map((slot) => ({ start: slot.start, end: slot.end }))

      if (slots.length) {
        result.push({
          date: dateText,
          label: formatDateLabel(dateText),
          slots
        })
      }
    }

    return result
  } catch (error) {
    console.error('❌ Failed to build available slots:', error)
    return []
  }
}
