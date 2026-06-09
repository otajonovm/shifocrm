/** Xodimlar bo'limi: rol, jadval, kreslo yordamchilari (employees + doctor_schedules) */

export const NON_DOCTOR_SPECIALIZATIONS = [
  'Administrator (Reception)',
  'Assistent (Yordamchi)',
  'Kassir/Buxgalter',
]

export const SPECIALIZATION_OPTIONS = [
  'Ortodont',
  'Terapevt',
  'Xirurg',
  'Ortoped',
  'Implantolog',
  ...NON_DOCTOR_SPECIALIZATIONS,
]

/** DB: doctor_schedules.chair_number INT */
export const CHAIR_OPTIONS = [
  { value: 1, label: '1-Kreslo' },
  { value: 2, label: '2-Kreslo' },
  { value: 3, label: '3-Kreslo' },
  { value: 4, label: 'Xirurgiya xonasi' },
]

export const WEEK_FORM_DAYS_FIXED = [
  { key: 'mon', short: 'Du', label: 'Dushanba' },
  { key: 'tue', short: 'Se', label: 'Seshanba' },
  { key: 'wed', short: 'Ch', label: 'Chorshanba' },
  { key: 'thu', short: 'Pa', label: 'Payshanba' },
  { key: 'fri', short: 'Ju', label: 'Juma' },
  { key: 'sat', short: 'Sh', label: 'Shanba' },
]

/** ISO: 1 = Dushanba … 6 = Shanba */
export const DAY_KEY_TO_DOW = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const DOW_TO_DAY_KEY = Object.fromEntries(
  Object.entries(DAY_KEY_TO_DOW).map(([key, dow]) => [String(dow), key])
)

const SPECIALTY_TO_ROLE = {
  'Administrator (Reception)': 'administrator',
  'Assistent (Yordamchi)': 'assistant',
  'Kassir/Buxgalter': 'cashier',
}

export function specialtyToRole(specialty) {
  const text = String(specialty || '').trim()
  return SPECIALTY_TO_ROLE[text] || 'doctor'
}

export function isDoctorRole(specialization) {
  if (!specialization) return false
  return !NON_DOCTOR_SPECIALIZATIONS.includes(String(specialization).trim())
}

/** Kalendar (doctors jadvali) bilan sinxronlash kerakmi */
export function requiresDoctorCalendarBridge(specialization) {
  return isDoctorRole(specialization)
}

/** doctors.chair_number / work_schedule matnidan INT (1–4) */
export function parseChairNumber(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  if (Number.isFinite(num) && num >= 1 && num <= 4) return num
  const text = String(value).toLowerCase()
  if (text.includes('xirurg')) return 4
  const match = text.match(/(\d)/)
  if (match) return Math.min(4, Math.max(1, Number(match[1])))
  return null
}

/** doctors.work_schedule JSON → kolliziya tekshiruvi uchun slotlar */
export function legacyDoctorScheduleSlots(doctor) {
  if (doctor?.is_active === false) return []

  const ws = doctor?.work_schedule
  const chair = parseChairNumber(ws?.chair_number ?? doctor?.chair_number)
  if (!chair || !ws?.days || typeof ws.days !== 'object') return []

  const slots = []
  for (const [key, day] of Object.entries(ws.days)) {
    if (!day?.enabled) continue
    const dow = DAY_KEY_TO_DOW[key]
    if (!dow) continue
    const start = normalizeTime(day.start)
    const end = normalizeTime(day.end)
    if (!start || !end || timeToMinutes(start) >= timeToMinutes(end)) continue
    slots.push({
      day_of_week: dow,
      start_time: start,
      end_time: end,
      chair_number: chair,
    })
  }
  return slots
}

export function buildDefaultWorkSchedule() {
  const days = {}
  WEEK_FORM_DAYS_FIXED.forEach(({ key }) => {
    const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(key)
    days[key] = {
      enabled: isWeekday,
      start: '09:00',
      end: isWeekday ? '18:00' : '14:00',
    }
  })
  return { chair: '', days }
}

export const normalizeTime = (value) => {
  if (!value) return ''
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

export function timeToMinutes(value) {
  const normalized = normalizeTime(value)
  if (!normalized) return NaN
  const [hours, minutes] = normalized.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN
  return hours * 60 + minutes
}

/** Ikki vaqt oralig'i kesishadimi (kreslo kolliziyasi) */
export function schedulesOverlap(startA, endA, startB, endB) {
  const a0 = timeToMinutes(startA)
  const a1 = timeToMinutes(endA)
  const b0 = timeToMinutes(startB)
  const b1 = timeToMinutes(endB)
  if ([a0, a1, b0, b1].some((n) => !Number.isFinite(n))) return false
  return a0 < b1 && b0 < a1
}

/**
 * Bir kresloda bir kunda vaqt kesishuvi bormi?
 * @returns {{ employee: object, schedule: object } | null}
 */
export function findChairConflict(
  employees,
  chairNumber,
  dayOfWeek,
  startTime,
  endTime,
  excludeEmployeeId = null
) {
  const chair = Number(chairNumber)
  const dow = Number(dayOfWeek)
  if (!Number.isFinite(chair) || !Number.isFinite(dow)) return null

  for (const employee of employees || []) {
    if (!employee?.is_active) continue
    if (excludeEmployeeId && employee.id === excludeEmployeeId) continue

    for (const row of employee.doctor_schedules || []) {
      if (Number(row.chair_number) !== chair) continue
      if (Number(row.day_of_week) !== dow) continue
      if (!schedulesOverlap(startTime, endTime, row.start_time, row.end_time)) continue
      return { employee, schedule: row }
    }
  }

  return null
}

/**
 * Migratsiya qilinmagan yoki faqat doctors.work_schedule da qolgan shifokorlar.
 */
export function findChairConflictInLegacyDoctors(
  legacyDoctors,
  chairNumber,
  dayOfWeek,
  startTime,
  endTime,
  { excludeLegacyDoctorId = null, linkedLegacyDoctorIds = null } = {}
) {
  const chair = Number(chairNumber)
  const dow = Number(dayOfWeek)
  if (!Number.isFinite(chair) || !Number.isFinite(dow)) return null

  const linked = linkedLegacyDoctorIds ?? new Set()

  for (const doctor of legacyDoctors || []) {
    if (doctor?.is_active === false) continue
    const docId = Number(doctor.id)
    if (!Number.isFinite(docId)) continue
    if (excludeLegacyDoctorId != null && docId === Number(excludeLegacyDoctorId)) continue
    if (linked.has(docId)) continue

    for (const slot of legacyDoctorScheduleSlots(doctor)) {
      if (Number(slot.chair_number) !== chair) continue
      if (Number(slot.day_of_week) !== dow) continue
      if (!schedulesOverlap(startTime, endTime, slot.start_time, slot.end_time)) continue
      return {
        employee: { full_name: doctor.full_name },
        schedule: slot,
        source: 'legacy_doctor',
      }
    }
  }

  return null
}

function collectLinkedLegacyDoctorIds(employees) {
  const ids = new Set()
  for (const employee of employees || []) {
    const legacyId = employee?.legacy_doctor_id
    if (legacyId != null && Number.isFinite(Number(legacyId))) {
      ids.add(Number(legacyId))
    }
  }
  return ids
}

/** schedulePayload massividagi barcha slotlar uchun kolliziya tekshiruvi */
export function validateScheduleConflicts(
  employees,
  schedulePayload,
  excludeEmployeeId = null,
  { legacyDoctors = [], excludeLegacyDoctorId = null } = {}
) {
  const linkedLegacyDoctorIds = collectLinkedLegacyDoctorIds(employees)

  for (const slot of schedulePayload || []) {
    const empConflict = findChairConflict(
      employees,
      slot.chair_number,
      slot.day_of_week,
      slot.start_time,
      slot.end_time,
      excludeEmployeeId
    )
    if (empConflict) return empConflict

    const legacyConflict = findChairConflictInLegacyDoctors(
      legacyDoctors,
      slot.chair_number,
      slot.day_of_week,
      slot.start_time,
      slot.end_time,
      { excludeLegacyDoctorId, linkedLegacyDoctorIds }
    )
    if (legacyConflict) return legacyConflict
  }
  return null
}

export function formatChairConflictMessage(conflict) {
  const name = conflict?.employee?.full_name || 'noma\'lum shifokor'
  return `Bu kreslo ushbu vaqtda ${name} tomonidan band qilingan!`
}

export function unwrapRelation(rel) {
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel ?? null
}

/** API javobini UI state uchun normalizatsiya */
export function hydrateEmployee(raw) {
  if (!raw) return null
  const { password: _pw, ...safe } = raw
  const perms = unwrapRelation(raw.employee_permissions)
  const schedules = Array.isArray(raw.doctor_schedules) ? raw.doctor_schedules : []

  return {
    ...safe,
    specialization: raw.specialty ?? raw.specialization ?? '',
    legacy_doctor_id: raw.legacy_doctor_id ?? null,
    employee_permissions: perms,
    doctor_schedules: schedules,
  }
}

/** doctor_schedules[] → forma holati */
export function schedulesToFormState(schedules) {
  const { chair: _c, days } = buildDefaultWorkSchedule()
  let chair = ''

  ;(schedules ?? []).forEach((row) => {
    if (chair === '' && row.chair_number != null) {
      chair = Number(row.chair_number)
    }
    const dayKey = DOW_TO_DAY_KEY[String(row.day_of_week)]
    if (!dayKey) return
    days[dayKey] = {
      enabled: true,
      start: normalizeTime(row.start_time),
      end: normalizeTime(row.end_time),
    }
  })

  return { chair, days }
}

/** Forma → doctor_schedules massivi */
/** doctor_schedules[] → doctors.work_schedule JSON (kalendar uchun) */
export function scheduleRowsToWorkSchedule(scheduleRows) {
  if (!Array.isArray(scheduleRows) || !scheduleRows.length) return null

  const chairNum = Number(scheduleRows[0].chair_number)
  const chairLabel = CHAIR_OPTIONS.find((c) => c.value === chairNum)?.label || String(chairNum)
  const { days } = buildDefaultWorkSchedule()

  Object.keys(days).forEach((key) => {
    days[key] = { ...days[key], enabled: false }
  })

  scheduleRows.forEach((row) => {
    const key = DOW_TO_DAY_KEY[String(row.day_of_week)]
    if (!key) return
    days[key] = {
      enabled: true,
      start: normalizeTime(row.start_time),
      end: normalizeTime(row.end_time),
    }
  })

  return { chair_number: chairLabel, days }
}

export function buildSchedulePayload(form, employeeId = null, { isDoctor = true } = {}) {
  if (!isDoctor) return []

  const chair = Number(form.chair)
  if (!Number.isFinite(chair) || chair < 1) {
    throw new Error('Biriktirilgan stomatologik kresloni tanlang.')
  }

  const enabledDays = WEEK_FORM_DAYS_FIXED.filter(
    ({ key }) => form.work_schedule?.days?.[key]?.enabled
  )

  if (!enabledDays.length) {
    throw new Error('Kamida bitta ish kuni tanlanishi kerak.')
  }

  return enabledDays.map(({ key }) => {
    const day = form.work_schedule.days[key]
    const start = normalizeTime(day.start)
    const end = normalizeTime(day.end)
    const label = WEEK_FORM_DAYS_FIXED.find((d) => d.key === key)?.label || key

    if (!start || !end) {
      throw new Error(`${label}: ish boshlanishi va tugash vaqtini kiriting.`)
    }
    if (timeToMinutes(start) >= timeToMinutes(end)) {
      throw new Error(`${label}: tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak.`)
    }
    return {
      ...(employeeId ? { doctor_id: employeeId } : {}),
      day_of_week: DAY_KEY_TO_DOW[key],
      start_time: start,
      end_time: end,
      chair_number: chair,
    }
  })
}

export function getChairLabel(employee) {
  const schedules = employee?.doctor_schedules ?? []
  const chair = schedules[0]?.chair_number
  if (chair == null || chair === '') return '—'
  const num = Number(chair)
  const found = CHAIR_OPTIONS.find((c) => c.value === num)
  return found?.label || String(chair)
}

export function getWorkDaysShort(employee) {
  const schedules = employee?.doctor_schedules ?? []
  const parts = [...schedules]
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((row) => {
      const meta = WEEK_FORM_DAYS_FIXED.find((d) => DAY_KEY_TO_DOW[d.key] === row.day_of_week)
      return meta?.short
    })
    .filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

export function getWorkHoursSummary(employee) {
  const schedules = employee?.doctor_schedules ?? []
  if (!schedules.length) return '—'

  const ranges = schedules.map(
    (row) => `${normalizeTime(row.start_time)}-${normalizeTime(row.end_time)}`
  )
  const unique = [...new Set(ranges)]
  if (unique.length === 1) return unique[0]
  return unique.slice(0, 2).join(' · ') + (unique.length > 2 ? '…' : '')
}
