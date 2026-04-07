/**
 * Leads API - Public doctor profile lead capture
 * Handles lead submissions, tracking, and clinic staff access
 */

import { supabaseGet, supabasePost, supabasePatchWhere } from './supabaseConfig'

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
    'status=in.(new,contacted)',
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

    const preferredSummary = `Sana/Vaqt: ${cleanPreferredDate} ${cleanPreferredTime}`
    const data = {
      doctor_id: doctorId,
      clinic_id: clinicId,
      patient_name: cleanName,
      phone: cleanPhone,
      preferred_date: cleanPreferredDate,
      preferred_time: cleanPreferredTime,
      selected_service: selected_service ? String(selected_service).trim() : null,
      note: note ? String(note).trim() : null,
      source: 'doctor_public_page',
      status: 'new',
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

    const holdStatuses = ['new', 'contacted']
    const noHoldStatuses = ['booked', 'qabulda', 'rejected', 'expired']
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

    if (lead.visit_id) {
      const patched = await supabasePatchWhere(TABLE, `id=eq.${leadId}`, {
        status: 'booked',
        hold_expires_at: null,
        updated_at: new Date().toISOString()
      })
      return {
        lead: patched?.[0] || lead,
        visit: null,
        reusedVisit: true
      }
    }

    const patient = await findOrCreatePatientFromLead(lead)
    const { createVisit } = await import('./visitsApi')
    const startTime = normalizeTime(String(lead.preferred_time || ''))

    const visit = await createVisit({
      patient_id: Number(patient.id),
      doctor_id: Number(lead.doctor_id) || null,
      doctor_name: null,
      notes: lead.note || `Public lead #${leadId}`,
      status: 'pending',
      date: String(lead.preferred_date).slice(0, 10),
      start_time: startTime,
      duration_minutes: 30,
      channel: 'public_lead',
      lead_id: leadId,
    })

    const updatedLeads = await supabasePatchWhere(TABLE, `id=eq.${leadId}`, {
      status: 'booked',
      visit_id: visit.id,
      hold_expires_at: null,
      updated_at: new Date().toISOString()
    })

    return {
      lead: updatedLeads?.[0] || null,
      visit,
      reusedVisit: false
    }
  } catch (error) {
    console.error('❌ Failed to convert lead to booked:', error)
    throw error
  }
}
