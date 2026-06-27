const { supabase } = require('../supabase')

const LEAD_CHAT_TABLE = 'lead_telegram_chats'

async function getLeadById(leadId) {
  const numId = Number(leadId)
  if (!Number.isFinite(numId)) return null

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', numId)
    .maybeSingle()

  if (error) {
    throw new Error(`getLeadById failed: ${error.message}`)
  }

  return data
}

async function updateLeadRecord(leadId, payload) {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(leadId))
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(`updateLeadRecord failed: ${error.message}`)
  }

  return data
}

async function findPatientByPhone(phone, clinicId = null) {
  let query = supabase
    .from('patients')
    .select('id, full_name, phone, doctor_id, clinic_id')
    .eq('phone', phone)
    .limit(1)

  if (clinicId != null && Number.isFinite(Number(clinicId))) {
    query = query.eq('clinic_id', Number(clinicId))
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`findPatientByPhone failed: ${error.message}`)
  }

  return data && data[0] ? data[0] : null
}

async function createPatientFromLead(lead) {
  const payload = {
    full_name: String(lead.patient_name || 'Bemor').trim(),
    phone: String(lead.phone || '').trim(),
    doctor_id: lead.doctor_id ? Number(lead.doctor_id) : null,
    clinic_id: lead.clinic_id ? Number(lead.clinic_id) : null,
    status: 'waiting',
    notes: `Onlayn yozilish #${lead.id} — Telegram tasdiqlangan`,
  }

  const { data, error } = await supabase
    .from('patients')
    .insert(payload)
    .select('id, full_name, phone, doctor_id, clinic_id')
    .single()

  if (error) {
    throw new Error(`createPatientFromLead failed: ${error.message}`)
  }

  return data
}

async function resolvePatientForLead(lead) {
  if (lead.patient_id) {
    const { data } = await supabase
      .from('patients')
      .select('id, full_name, phone, doctor_id, clinic_id')
      .eq('id', Number(lead.patient_id))
      .maybeSingle()

    if (data) return data
  }

  const byPhone = await findPatientByPhone(
    String(lead.phone || '').trim(),
    lead.clinic_id,
  )
  if (byPhone) return byPhone

  return createPatientFromLead(lead)
}

/** Onlayn lead uchun Telegram chat (telegram_chat_ids dan mustaqil) */
async function upsertLeadTelegramChat({ leadId, chatId, phone, fromUser }) {
  const leadNum = Number(leadId)
  const row = {
    lead_id: leadNum,
    chat_id: String(chatId),
    phone: phone || null,
    username: fromUser?.username || null,
    first_name: fromUser?.first_name || null,
    last_name: fromUser?.last_name || null,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from(LEAD_CHAT_TABLE)
    .select('id')
    .eq('lead_id', leadNum)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from(LEAD_CHAT_TABLE)
      .update(row)
      .eq('id', existing.id)
    if (error) throw new Error(`upsertLeadTelegramChat update failed: ${error.message}`)
    return
  }

  const { error } = await supabase
    .from(LEAD_CHAT_TABLE)
    .insert({ ...row, created_at: new Date().toISOString() })
  if (error) throw new Error(`upsertLeadTelegramChat insert failed: ${error.message}`)
}

async function getLeadTelegramChat(leadId) {
  const { data } = await supabase
    .from(LEAD_CHAT_TABLE)
    .select('chat_id, phone, username, first_name, last_name')
    .eq('lead_id', Number(leadId))
    .maybeSingle()
  return data
}

/** Tasdiqlangandan keyin — asosiy telegram_chat_ids jadvaliga (patient_id PK) */
async function migrateLeadChatToPatientTelegram(patient, leadChat) {
  if (!leadChat?.chat_id || !patient?.id) return

  const { error } = await supabase
    .from('telegram_chat_ids')
    .upsert(
      {
        patient_id: String(patient.id),
        chat_id: String(leadChat.chat_id),
        phone: leadChat.phone || patient.phone || null,
        username: leadChat.username || null,
        first_name: leadChat.first_name || null,
        last_name: leadChat.last_name || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' },
    )

  if (error) {
    console.warn('migrateLeadChatToPatientTelegram:', error.message)
  }
}

async function linkLeadPatientTelegram({ leadId, chatId, fromUser }) {
  const lead = await getLeadById(leadId)
  if (!lead) {
    throw new Error('LEAD_NOT_FOUND')
  }

  await upsertLeadTelegramChat({
    leadId: lead.id,
    chatId,
    phone: lead.phone,
    fromUser,
  })

  const terminal = ['expired', 'rejected', 'canceled', 'cancelled', 'confirmed', 'qabulda']
  const current = String(lead.status || '').toLowerCase()
  const nextStatus = terminal.includes(current)
    ? lead.status
    : (current === 'booked' ? 'booked' : 'contacted')

  const updatedLead = await updateLeadRecord(lead.id, {
    telegram_linked_at: new Date().toISOString(),
    status: nextStatus,
    hold_expires_at: null,
  })

  return {
    lead: updatedLead,
    patient: lead.patient_id
      ? await resolvePatientForLead(lead).catch(() => null)
      : null,
  }
}

async function syncVisitAndAppointmentFromConfirm(lead, patient) {
  if (!lead.visit_id) return

  const visitId = Number(lead.visit_id)
  await supabase
    .from('visits')
    .update({
      patient_id: Number(patient.id),
      status: 'arrived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)

  const { data: visitRow } = await supabase
    .from('visits')
    .select('appointment_id')
    .eq('id', visitId)
    .maybeSingle()

  if (visitRow?.appointment_id) {
    await supabase
      .from('appointments')
      .update({
        patient_id: Number(patient.id),
        status: 'arrived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', Number(visitRow.appointment_id))
  } else {
    const { data: appts } = await supabase
      .from('appointments')
      .select('id')
      .eq('visit_id', visitId)
      .limit(1)

    if (appts?.[0]?.id) {
      await supabase
        .from('appointments')
        .update({
          patient_id: Number(patient.id),
          status: 'arrived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appts[0].id)
    }
  }
}

async function confirmLead(leadId) {
  const lead = await getLeadById(leadId)
  if (!lead) throw new Error('LEAD_NOT_FOUND')

  const patient = await resolvePatientForLead(lead)
  const leadChat = await getLeadTelegramChat(lead.id)

  const updatedLead = await updateLeadRecord(lead.id, {
    patient_id: Number(patient.id),
    status: 'confirmed',
    hold_expires_at: null,
  })

  await syncVisitAndAppointmentFromConfirm(lead, patient)
  await migrateLeadChatToPatientTelegram(patient, leadChat)

  return { lead: updatedLead, patient }
}

async function cancelLead(leadId) {
  const lead = await getLeadById(leadId)
  if (!lead) throw new Error('LEAD_NOT_FOUND')

  const updatedLead = await updateLeadRecord(lead.id, {
    status: 'canceled',
    hold_expires_at: null,
  })

  if (lead.visit_id) {
    const visitId = Number(lead.visit_id)
    await supabase
      .from('visits')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', visitId)

    const { data: appts } = await supabase
      .from('appointments')
      .select('id')
      .eq('visit_id', visitId)
      .limit(5)

    for (const row of appts || []) {
      await supabase
        .from('appointments')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  } else if (lead.patient_id) {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', Number(lead.patient_id))
      .in('status', ['scheduled', 'confirmed', 'hold', 'arrived'])
      .limit(5)

    for (const row of appointments || []) {
      await supabase
        .from('appointments')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  }

  return { lead: updatedLead }
}

module.exports = {
  getLeadById,
  linkLeadPatientTelegram,
  confirmLead,
  cancelLead,
  resolvePatientForLead,
  upsertLeadTelegramChat,
}
