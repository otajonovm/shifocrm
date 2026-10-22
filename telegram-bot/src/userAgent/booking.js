const { loadEnv } = require('./env')

loadEnv()

const { supabase } = require('../supabase')
const {
  addDays,
  collectOpenSlots,
  pickExactSlot,
  nearestSlots,
  toTimeString,
  toMinutes,
} = require('./slots')

const SLOT_MINUTES = 30
const LOOKAHEAD_DAYS = 14
const ACTIVE_VISIT_STATUSES = ['pending', 'arrived', 'in_progress', 'scheduled', 'confirmed']
const ACTIVE_LEAD_HOLD = new Set(['hold', 'new', 'contacted'])

let cachedClinicId = null
let clinicWarningShown = false

function tashkentParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type) => parts.find((part) => part.type === type)?.value || ''
  const hour = String(pick('hour')).padStart(2, '0')
  const minute = String(pick('minute')).padStart(2, '0')
  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${hour}:${minute}`,
  }
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return ''
}

function phoneVariants(phone) {
  const normalized = normalizePhone(phone)
  const digits = normalized.replace(/\D/g, '')
  return [...new Set([
    normalized,
    digits,
    digits.startsWith('998') ? digits.slice(3) : '',
    digits.startsWith('998') ? `+${digits}` : '',
  ].filter(Boolean))]
}

async function resolveClinicId() {
  if (cachedClinicId) return cachedClinicId

  const fromEnv = Number(process.env.TELEGRAM_DEFAULT_CLINIC_ID)
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    cachedClinicId = fromEnv
    return cachedClinicId
  }

  const { data, error } = await supabase.from('clinics').select('id').limit(2)
  if (error) {
    console.error('Klinika ro\'yxati o\'qilmadi:', error.message)
    return null
  }

  if (data?.length === 1) {
    cachedClinicId = Number(data[0].id)
    return cachedClinicId
  }

  if (!clinicWarningShown) {
    clinicWarningShown = true
    const ids = (data || []).map((row) => row.id).join(', ') || 'topilmadi'
    console.error(`TELEGRAM_DEFAULT_CLINIC_ID kerak. Topilgan klinikalar: ${ids}`)
  }
  return null
}

async function generateNumericId(table) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = Math.floor(10000 + Math.random() * 90000)
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('id', candidate)
      .maybeSingle()
    if (error) throw new Error(`${table} id tekshiruvi: ${error.message}`)
    if (!data) return candidate
  }
  return Math.floor(10000 + (Date.now() % 90000))
}

function isLeadBlocking(lead, nowMs) {
  const status = String(lead?.status || '').toLowerCase()
  if (['booked', 'confirmed', 'qabulda'].includes(status)) return true
  if (!ACTIVE_LEAD_HOLD.has(status)) return false
  if (lead?.visit_id) return true
  const expiresAt = lead?.hold_expires_at ? new Date(lead.hold_expires_at).getTime() : NaN
  if (!Number.isFinite(expiresAt)) return false
  return expiresAt > nowMs
}

function visitInterval(visit) {
  if (!visit?.start_time) return null
  const start = String(visit.start_time).slice(0, 5)
  if (visit.end_time) return { start, end: String(visit.end_time).slice(0, 5) }
  const duration = Number(visit.duration_minutes) || SLOT_MINUTES
  return { start, end: toTimeString(toMinutes(start) + duration) }
}

function leadInterval(lead) {
  if (!lead?.preferred_time) return null
  const start = String(lead.preferred_time).slice(0, 5)
  return { start, end: toTimeString(toMinutes(start) + SLOT_MINUTES) }
}

async function loadDoctors(clinicId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, full_name, work_schedule, is_active, clinic_id')
    .eq('clinic_id', clinicId)

  if (error) throw new Error(`Shifokorlar o'qilmadi: ${error.message}`)
  return (data || []).filter((doctor) => doctor.is_active !== false)
}

async function loadBusyMap(clinicId, doctorIds, fromDate, toDate) {
  const busy = {}
  if (!doctorIds.length) return busy

  const { data: visits, error: visitError } = await supabase
    .from('visits')
    .select('id, doctor_id, date, start_time, end_time, duration_minutes, status')
    .eq('clinic_id', clinicId)
    .in('doctor_id', doctorIds)
    .gte('date', fromDate)
    .lte('date', toDate)

  if (visitError) throw new Error(`Qabullar o'qilmadi: ${visitError.message}`)

  ;(visits || []).forEach((visit) => {
    if (!ACTIVE_VISIT_STATUSES.includes(String(visit.status || '').toLowerCase())) return
    const interval = visitInterval(visit)
    if (!interval) return
    const key = `${visit.doctor_id}|${String(visit.date).slice(0, 10)}`
    if (!busy[key]) busy[key] = []
    busy[key].push(interval)
  })

  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('id, doctor_id, preferred_date, preferred_time, status, hold_expires_at, visit_id')
    .eq('clinic_id', clinicId)
    .in('doctor_id', doctorIds)
    .gte('preferred_date', fromDate)
    .lte('preferred_date', toDate)

  if (leadError) {
    console.warn('Lidlar o\'qilmadi, faqat qabullar hisoblanadi:', leadError.message)
    return busy
  }

  const nowMs = Date.now()
  ;(leads || []).forEach((lead) => {
    if (!isLeadBlocking(lead, nowMs)) return
    const interval = leadInterval(lead)
    if (!interval) return
    const key = `${lead.doctor_id}|${String(lead.preferred_date).slice(0, 10)}`
    if (!busy[key]) busy[key] = []
    busy[key].push(interval)
  })

  return busy
}

async function findSlotOffer({ date, time, doctorId = null }) {
  const clinicId = await resolveClinicId()
  if (!clinicId) return { reason: 'no_clinic' }

  const now = tashkentParts()
  if (date < now.date || (date === now.date && time < now.time)) {
    return { reason: 'past', clinicId }
  }

  let doctors = await loadDoctors(clinicId)
  if (doctorId) {
    doctors = doctors.filter((doctor) => Number(doctor.id) === Number(doctorId))
  }
  if (!doctors.length) return { reason: 'no_doctors', clinicId }

  const fromDate = now.date
  const toDate = addDays(fromDate, LOOKAHEAD_DAYS - 1)
  const busyByDoctorDate = await loadBusyMap(
    clinicId,
    doctors.map((doctor) => doctor.id),
    fromDate,
    toDate,
  )

  const { slots, hasSchedule } = collectOpenSlots({
    doctors,
    busyByDoctorDate,
    fromDate,
    days: LOOKAHEAD_DAYS,
    durationMinutes: SLOT_MINUTES,
    notBeforeTime: now.time,
  })

  if (!hasSchedule) return { reason: 'no_schedule', clinicId }
  if (!slots.length) return { reason: 'no_slots', clinicId }

  const exact = pickExactSlot(slots, date, time)
  if (exact) return { reason: 'exact', clinicId, slot: exact }

  return {
    reason: 'alternatives',
    clinicId,
    alternatives: nearestSlots(slots, date, time, 3),
  }
}

async function findPatientByPhone(phone, clinicId) {
  const variants = phoneVariants(phone)
  for (const variant of variants) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, phone, doctor_id, clinic_id')
      .eq('clinic_id', clinicId)
      .eq('phone', variant)
      .limit(1)
    if (error) throw new Error(`Bemor qidiruvi: ${error.message}`)
    if (data?.[0]) return data[0]
  }
  return null
}

async function linkTelegramChat(patient, chatId, fromUser) {
  const { error } = await supabase
    .from('telegram_chat_ids')
    .upsert({
      patient_id: String(patient.id),
      chat_id: String(chatId),
      phone: patient.phone || null,
      username: fromUser?.username || null,
      first_name: fromUser?.firstName || fromUser?.first_name || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' })

  if (error) console.warn('telegram_chat_ids:', error.message)
}

async function bookSlot({ slot, name, phone, chatId, fromUser, notes, serviceName }) {
  const clinicId = await resolveClinicId()
  if (!clinicId) {
    const error = new Error('CLINIC_MISSING')
    error.code = 'CLINIC_MISSING'
    throw error
  }

  const normalizedPhone = normalizePhone(phone)
  let patient = await findPatientByPhone(normalizedPhone, clinicId)

  if (!patient) {
    const patientId = await generateNumericId('patients')
    const { data, error } = await supabase
      .from('patients')
      .insert({
        id: patientId,
        full_name: name,
        phone: normalizedPhone,
        doctor_id: slot.doctorId,
        clinic_id: clinicId,
        status: 'waiting',
        notes: notes || 'Telegram shaxsiy agent orqali yozildi',
      })
      .select('id, full_name, phone, doctor_id, clinic_id')
      .single()
    if (error) throw new Error(`Bemor yozilmadi: ${error.message}`)
    patient = data
  }

  const { error: doctorLinkError } = await supabase
    .from('patients')
    .update({ doctor_id: slot.doctorId })
    .eq('id', patient.id)
    .eq('clinic_id', clinicId)
  if (doctorLinkError) console.warn('Bemor shifokori yangilanmadi:', doctorLinkError.message)
  patient.doctor_id = slot.doctorId

  const visitId = await generateNumericId('visits')
  const visitNotes = notes || 'Telegram shaxsiy agent orqali yozildi'
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .insert({
      id: visitId,
      clinic_id: clinicId,
      patient_id: Number(patient.id),
      doctor_id: slot.doctorId,
      doctor_name: slot.doctorName,
      date: slot.date,
      status: 'pending',
      notes: visitNotes,
      service_name: serviceName || null,
      start_time: slot.start,
      end_time: slot.end,
      duration_minutes: SLOT_MINUTES,
      channel: 'telegram_user',
    })
    .select('id, patient_id, doctor_id, date, start_time, end_time, clinic_id')
    .single()

  if (visitError) throw new Error(`Qabul yozilmadi: ${visitError.message}`)

  const scheduledAt = `${slot.date}T${slot.start}:00`
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinicId,
      patient_id: Number(patient.id),
      doctor_id: slot.doctorId,
      scheduled_at: scheduledAt,
      duration_minutes: SLOT_MINUTES,
      status: 'scheduled',
      notes: visitNotes,
      visit_id: visit.id,
    })
    .select('id')
    .single()

  if (appointmentError) {
    console.warn('Appointment yozilmadi:', appointmentError.message)
  } else if (appointment?.id) {
    const { error: linkError } = await supabase
      .from('visits')
      .update({ appointment_id: appointment.id })
      .eq('id', visit.id)
      .eq('clinic_id', clinicId)
    if (linkError) console.warn('appointment_id bog\'lanmadi:', linkError.message)
  }

  await linkTelegramChat(patient, chatId, fromUser)

  return { patient, visit, clinicId }
}

async function listTodayVisits() {
  const clinicId = await resolveClinicId()
  if (!clinicId) return { error: 'no_clinic', rows: [] }

  const today = tashkentParts().date
  const { data, error } = await supabase
    .from('visits')
    .select('id, start_time, doctor_name, patient_id, status')
    .eq('clinic_id', clinicId)
    .eq('date', today)
    .in('status', ACTIVE_VISIT_STATUSES)
    .order('start_time', { ascending: true })

  if (error) throw new Error(`Bugungi qabullar: ${error.message}`)

  const patientIds = [...new Set((data || []).map((row) => row.patient_id).filter(Boolean))]
  let patientsById = new Map()
  if (patientIds.length) {
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name, phone')
      .eq('clinic_id', clinicId)
      .in('id', patientIds)
    if (patientError) throw new Error(`Bemorlar: ${patientError.message}`)
    patientsById = new Map((patients || []).map((patient) => [Number(patient.id), patient]))
  }

  const rows = (data || []).map((visit) => {
    const patient = patientsById.get(Number(visit.patient_id))
    return {
      time: String(visit.start_time || '').slice(0, 5) || '—',
      doctorName: visit.doctor_name || '—',
      patientName: patient?.full_name || '—',
      phone: patient?.phone || '—',
    }
  })

  return { date: today, rows }
}

module.exports = {
  SLOT_MINUTES,
  tashkentParts,
  normalizePhone,
  resolveClinicId,
  findSlotOffer,
  bookSlot,
  listTodayVisits,
}
