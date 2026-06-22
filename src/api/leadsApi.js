/**
 * Leads API - Public doctor profile lead capture
 * Handles lead submissions, tracking, and clinic staff access
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from './supabaseConfig'
import { buildEndTimeFromStart } from '@/lib/visitAppointmentSync'

const TABLE = 'leads'
const HOLD_MINUTES = 30

const SLOT_CONFLICT_ERROR_TEXT = 'Ushbu vaqt allaqachon band. Iltimos boshqa vaqt tanlang.'

const normalizeTime = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const [hours, minutes] = raw.split(':')
  if (!hours || !minutes) return raw
  const hh = String(Number(hours)).padStart(2, '0')
  const mm = String(Number(minutes)).padStart(2, '0')
  if (!Number.isFinite(Number(hours)) || !Number.isFinite(Number(minutes))) return raw
  return `${hh}:${mm}`
}

const buildHoldExpiresAt = () => {
  const date = new Date(Date.now() + HOLD_MINUTES * 60 * 1000)
  return date.toISOString()
}

const isSlotConflictError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  if (code === '23505') return true
  return (
    message.includes('duplicate key')
    || message.includes('idx_leads_active_hold_slot_unique')
    || message.includes('idx_leads_booked_slot_unique')
  )
}

const createSlotConflictError = () => {
  const error = new Error(SLOT_CONFLICT_ERROR_TEXT)
  error.code = 'SLOT_ALREADY_BOOKED'
  return error
}

const normalizePhoneDigits = (value) => String(value || '').replace(/\D+/g, '')

const findOrCreatePatientFromLead = async (lead) => {
  const { listPatients, createPatient } = await import('./patientsApi')
  const allPatients = await listPatients()
  const targetDigits = normalizePhoneDigits(lead.phone)
  const existingPatient = (allPatients || []).find((patient) => {
    return normalizePhoneDigits(patient?.phone) === targetDigits && targetDigits.length > 0
  })

  if (existingPatient) return existingPatient

  return await createPatient({
    full_name: String(lead.patient_name || '').trim() || 'Bemor',
    phone: String(lead.phone || '').trim(),
    doctor_id: Number(lead.doctor_id) || null,
    status: 'waiting',
    notes: `Public lead #${lead.id} dan yaratildi`,
    createFirstVisit: false,
  })
}

const releaseExpiredHoldsForSlot = async ({ doctorId, preferredDate, preferredTime }) => {
  const nowIso = new Date().toISOString()
  const query = [
    `doctor_id=eq.${Number(doctorId)}`,
    `preferred_date=eq.${encodeURIComponent(String(preferredDate))}`,
    `preferred_time=eq.${encodeURIComponent(String(preferredTime))}`,
    'status=in.(hold,new,contacted)',
    `hold_expires_at=lte.${encodeURIComponent(nowIso)}`,
  ].join('&')

  try {
    await supabasePatchWhere(TABLE, query, {
      status: 'expired',
      updated_at: nowIso
    })
  } catch {
    // no-op: best-effort cleanup before insert
  }
}

const findLeadBySlot = async ({
  doctorId,
  preferredDate,
  preferredTime,
  status,
  excludeLeadId = null,
} = {}) => {
  const doctor = Number(doctorId)
  const date = String(preferredDate || '').slice(0, 10)
  const time = normalizeTime(preferredTime)
  if (!Number.isFinite(doctor) || !date || !time || !status) return null

  const parts = [
    `doctor_id=eq.${doctor}`,
    `preferred_date=eq.${encodeURIComponent(date)}`,
    `preferred_time=eq.${encodeURIComponent(time)}`,
    `status=eq.${encodeURIComponent(String(status))}`,
  ]
  if (excludeLeadId != null && Number.isFinite(Number(excludeLeadId))) {
    parts.push(`id=neq.${Number(excludeLeadId)}`)
  }
  parts.push('limit=1')

  const rows = await supabaseGet(TABLE, parts.join('&'))
  return rows?.[0] || null
}

const clearCompetingHoldsForSlot = async ({
  doctorId,
  preferredDate,
  preferredTime,
  excludeLeadId = null,
}) => {
  const doctor = Number(doctorId)
  const date = String(preferredDate || '').slice(0, 10)
  const time = normalizeTime(preferredTime)
  if (!Number.isFinite(doctor) || !date || !time) return

  const nowIso = new Date().toISOString()
  const parts = [
    `doctor_id=eq.${doctor}`,
    `preferred_date=eq.${encodeURIComponent(date)}`,
    `preferred_time=eq.${encodeURIComponent(time)}`,
    'status=in.(hold,new,contacted)',
  ]
  if (excludeLeadId != null && Number.isFinite(Number(excludeLeadId))) {
    parts.push(`id=neq.${Number(excludeLeadId)}`)
  }

  try {
    await supabasePatchWhere(TABLE, parts.join('&'), {
      status: 'expired',
      hold_expires_at: null,
      updated_at: nowIso,
    })
  } catch {
    // best-effort cleanup before booking
  }
}

const sameLeadPhone = (left, right) => {
  const leftDigits = normalizePhoneDigits(left?.phone)
  const rightDigits = normalizePhoneDigits(right?.phone)
  return leftDigits.length > 0 && leftDigits === rightDigits
}

const resolveDuplicateBookedLead = async (lead, existingBookedLead) => {
  const leadId = Number(lead.id)
  const existingId = Number(existingBookedLead.id)
  const orphanVisitId = Number(lead.visit_id)

  if (
    Number.isFinite(orphanVisitId)
    && orphanVisitId !== Number(existingBookedLead.visit_id)
  ) {
    const { deleteVisit } = await import('./visitsApi')
    await deleteVisit(orphanVisitId).catch(() => {})
  }

  const noteParts = [
    lead.note,
    `Takroriy murojaat — Lead #${existingId} band qilingan`,
  ].filter(Boolean)

  await supabasePatchWhere(TABLE, `id=eq.${leadId}`, {
    status: 'rejected',
    visit_id: null,
    hold_expires_at: null,
    note: noteParts.join(' | '),
    updated_at: new Date().toISOString(),
  })

  let visit = null
  if (existingBookedLead.visit_id) {
    const { getVisitById } = await import('./visitsApi')
    visit = await getVisitById(existingBookedLead.visit_id)
  }

  return {
    lead: existingBookedLead,
    visit,
    reusedVisit: true,
    duplicateResolved: true,
  }
}

const patchLeadAsBooked = async (leadId, visitId = null) => {
  const data = {
    status: 'booked',
    hold_expires_at: null,
    updated_at: new Date().toISOString(),
  }
  if (visitId != null && Number.isFinite(Number(visitId))) {
    data.visit_id = Number(visitId)
  }

  try {
    const rows = await supabasePatchWhere(TABLE, `id=eq.${Number(leadId)}`, data)
    return rows?.[0] || null
  } catch (error) {
    if (isSlotConflictError(error)) throw createSlotConflictError()
    throw error
  }
}

/**
 * Submit a public lead from doctor profile page
 * @param {object} payload - {doctor_id, clinic_id, patient_name, phone, preferred_date, preferred_time, selected_service, note}
 * @returns {object} Created lead with id
 */
export const createLead = async (payload) => {
  try {
    const {
      doctor_id,
      clinic_id,
      patient_name,
      phone,
      preferred_date = null,
      preferred_time = null,
      selected_service = null,
      note = null
    } = payload

    // Validation
    const doctorId = Number(doctor_id)
    const clinicId = Number(clinic_id)
    if (!Number.isFinite(doctorId) || !Number.isFinite(clinicId)) {
      throw new Error('Invalid doctor_id or clinic_id')
    }
    const cleanName = String(patient_name || '').trim()
    const cleanPhone = String(phone || '').trim()
    const cleanPreferredDate = String(preferred_date || '').trim()
    const cleanPreferredTime = normalizeTime(preferred_time)
    if (!cleanName) throw new Error('Patient name required')
    if (!cleanPhone) throw new Error('Phone number required')
    if (!cleanPreferredDate) throw new Error('Preferred date required')
    if (!cleanPreferredTime) throw new Error('Preferred time required')

    const now = new Date().toISOString()
    const holdExpiresAt = buildHoldExpiresAt()

    await releaseExpiredHoldsForSlot({
      doctorId,
      preferredDate: cleanPreferredDate,
      preferredTime: cleanPreferredTime,
    })

    const patient = await findOrCreatePatientFromLead({
      id: null,
      patient_name: cleanName,
      phone: cleanPhone,
      doctor_id: doctorId,
    })

    const preferredSummary = `Sana/Vaqt: ${cleanPreferredDate} ${cleanPreferredTime}`
    const data = {
      doctor_id: doctorId,
      clinic_id: clinicId,
      patient_id: Number(patient.id),
      patient_name: cleanName,
      phone: cleanPhone,
      preferred_date: cleanPreferredDate,
      preferred_time: cleanPreferredTime,
      selected_service: selected_service ? String(selected_service).trim() : null,
      note: note ? String(note).trim() : null,
      source: 'doctor_public_page',
      status: 'hold',
      hold_expires_at: holdExpiresAt,
      created_at: now,
      updated_at: now
    }

    let result
    try {
      result = await supabasePost(TABLE, data)
    } catch (error) {
      if (isSlotConflictError(error)) {
        throw createSlotConflictError()
      }

      const message = String(error?.message || '').toLowerCase()
      const hasPreferredDateSchemaError =
        message.includes('preferred_date') ||
        message.includes('preferred_time') ||
        message.includes('selected_service') ||
        message.includes('hold_expires_at') ||
        message.includes('could not find the')

      if (!hasPreferredDateSchemaError) throw error

      const fallbackData = {
        doctor_id: doctorId,
        clinic_id: clinicId,
        patient_name: cleanName,
        phone: cleanPhone,
        note: [preferredSummary, note ? String(note).trim() : ''].filter(Boolean).join(' | '),
        source: 'doctor_public_page',
        status: 'new',
        created_at: now,
        updated_at: now
      }
      result = await supabasePost(TABLE, fallbackData)
    }

    console.log('✅ Lead created:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to create lead:', error)
    throw error
  }
}

/**
 * Get all leads for a doctor (authenticated)
 * @param {number} doctorId
 * @returns {array} List of leads
 */
export const listLeadsByDoctor = async (doctorId) => {
  try {
    const numId = Number(doctorId)
    if (!Number.isFinite(numId)) throw new Error('Invalid doctor_id')
    const rows = await supabaseGet(TABLE, `doctor_id=eq.${numId}&order=created_at.desc`)
    return rows || []
  } catch (error) {
    console.error('❌ Failed to fetch doctor leads:', error)
    throw error
  }
}

export const getLeadById = async (leadId) => {
  try {
    const numId = Number(leadId)
    if (!Number.isFinite(numId)) throw new Error('Invalid lead_id')
    const rows = await supabaseGet(TABLE, `id=eq.${numId}&limit=1`)
    return rows && rows[0] ? rows[0] : null
  } catch (error) {
    console.error('❌ Failed to fetch lead:', error)
    throw error
  }
}

/**
 * Get all leads for a clinic (authenticated clinic admin)
 * @param {number} clinicId
 * @returns {array} List of leads
 */
export const listLeadsByClinic = async (clinicId) => {
  try {
    const numId = Number(clinicId)
    if (!Number.isFinite(numId)) throw new Error('Invalid clinic_id')
    const rows = await supabaseGet(TABLE, `clinic_id=eq.${numId}&order=created_at.desc`)
    return rows || []
  } catch (error) {
    console.error('❌ Failed to fetch clinic leads:', error)
    throw error
  }
}

/**
 * Update lead status
 * @param {number} leadId
 * @param {string} status - 'new', 'contacted', 'converted', 'rejected', etc.
 * @returns {object} Updated lead
 */
export const updateLeadStatus = async (leadId, status) => {
  try {
    const numId = Number(leadId)
    if (!Number.isFinite(numId)) throw new Error('Invalid lead_id')
    const cleanStatus = String(status || '').trim()
    if (!cleanStatus) throw new Error('Status required')

    const holdStatuses = ['hold', 'new', 'contacted']
    const noHoldStatuses = ['booked', 'confirmed', 'qabulda', 'rejected', 'expired', 'canceled', 'cancelled']
    const data = {
      status: cleanStatus,
      updated_at: new Date().toISOString()
    }
    if (holdStatuses.includes(cleanStatus)) {
      data.hold_expires_at = buildHoldExpiresAt()
    }
    if (noHoldStatuses.includes(cleanStatus)) {
      data.hold_expires_at = null
    }
    const result = await supabasePatchWhere(TABLE, `id=eq.${numId}`, data)
    console.log('✅ Lead updated:', result[0])
    return result[0]
  } catch (error) {
    console.error('❌ Failed to update lead:', error)
    throw error
  }
}

/**
 * Move lead/patient to in-clinic stage (qabulda).
 * Rules:
 * - Ensure visit exists (create via booked conversion if needed)
 * - Visit status => arrived
 * - Patient status => in_consultation
 * - Lead status => qabulda
 */
export const convertLeadToQabulda = async (leadInput) => {
  try {
    const sourceLead = leadInput?.id ? leadInput : await getLeadById(leadInput)
    if (!sourceLead) throw new Error('Lead topilmadi')

    let workingLead = sourceLead
    let visit = null

    if (!workingLead.visit_id) {
      const bookedResult = await convertLeadToBooked(workingLead)
      workingLead = bookedResult?.lead || workingLead
      visit = bookedResult?.visit || null
    }

    if (!visit && workingLead.visit_id) {
      const { getVisitById } = await import('./visitsApi')
      visit = await getVisitById(workingLead.visit_id)
    }

    if (visit?.id) {
      const { updateVisit } = await import('./visitsApi')
      await updateVisit(visit.id, {
        status: 'arrived'
      })

      if (visit.patient_id) {
        const { updatePatient } = await import('./patientsApi')
        await updatePatient(visit.patient_id, {
          status: 'in_consultation'
        })
      }
    }

    const patched = await supabasePatchWhere(TABLE, `id=eq.${Number(workingLead.id)}`, {
      status: 'qabulda',
      hold_expires_at: null,
      updated_at: new Date().toISOString()
    })

    return {
      lead: patched?.[0] || null,
      visit
    }
  } catch (error) {
    console.error('❌ Failed to convert lead to qabulda:', error)
    throw error
  }
}

/**
 * Convert lead to booked and create operational visit.
 * Final freeze:
 * - lead.status = booked
 * - lead.visit_id = visit.id
 * - visit.lead_id = lead.id
 */
export const convertLeadToBooked = async (leadInput) => {
  try {
    const lead = leadInput?.id ? leadInput : await getLeadById(leadInput)
    if (!lead) throw new Error('Lead topilmadi')

    const leadId = Number(lead.id)
    if (!Number.isFinite(leadId)) throw new Error('Lead ID noto‘g‘ri')

    if (!lead.preferred_date || !lead.preferred_time) {
      throw new Error('Leadda sana/vaqt yo‘q. Avval sana va vaqtni kiriting.')
    }

    const preferredDate = String(lead.preferred_date).slice(0, 10)
    const preferredTime = normalizeTime(String(lead.preferred_time || ''))

    if (String(lead.status || '').toLowerCase() === 'booked') {
      let visit = null
      if (lead.visit_id) {
        const { getVisitById } = await import('./visitsApi')
        visit = await getVisitById(lead.visit_id)
      }
      return { lead, visit, reusedVisit: true, alreadyBooked: true }
    }

    await clearCompetingHoldsForSlot({
      doctorId: lead.doctor_id,
      preferredDate,
      preferredTime,
      excludeLeadId: leadId,
    })

    const existingBooked = await findLeadBySlot({
      doctorId: lead.doctor_id,
      preferredDate,
      preferredTime,
      status: 'booked',
      excludeLeadId: leadId,
    })

    if (existingBooked) {
      if (sameLeadPhone(lead, existingBooked)) {
        return await resolveDuplicateBookedLead(lead, existingBooked)
      }
      throw createSlotConflictError()
    }

    if (lead.visit_id) {
      const patchedLead = await patchLeadAsBooked(leadId)
      return {
        lead: patchedLead || lead,
        visit: null,
        reusedVisit: true,
      }
    }

    const patient = await findOrCreatePatientFromLead(lead)
    const { createVisit, syncAppointmentFromVisit, deleteVisit } = await import('./visitsApi')
    const startTime = preferredTime

    const visit = await createVisit({
      patient_id: Number(patient.id),
      doctor_id: Number(lead.doctor_id) || null,
      doctor_name: null,
      notes: lead.note || `Public lead #${leadId}`,
      status: 'pending',
      date: preferredDate,
      start_time: startTime,
      end_time: buildEndTimeFromStart(startTime, 60),
      duration_minutes: 60,
      channel: 'public_lead',
      lead_id: leadId,
    })

    await syncAppointmentFromVisit(visit).catch((err) => {
      console.warn('Lead booked: appointment sync', err?.message)
    })

    try {
      const patchedLead = await patchLeadAsBooked(leadId, visit.id)
      return {
        lead: patchedLead,
        visit,
        reusedVisit: false,
      }
    } catch (error) {
      await deleteVisit(visit.id).catch(() => {})
      throw error
    }
  } catch (error) {
    console.error('❌ Failed to convert lead to booked:', error)
    if (isSlotConflictError(error) || error?.code === 'SLOT_ALREADY_BOOKED') {
      throw createSlotConflictError()
    }
    throw error
  }
}
