const { supabase } = require('../supabase')

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

async function findPatientByPhone(phone) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, phone, doctor_id, clinic_id')
    .eq('phone', phone)
    .limit(1)

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
    notes: `Lead #${lead.id} — Telegram orqali bog'landi`,
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

  const byPhone = await findPatientByPhone(String(lead.phone || '').trim())
  if (byPhone) return byPhone

  return createPatientFromLead(lead)
}

async function upsertTelegramChatId({ patientId, chatId, phone, username, firstName, lastName }) {
  const { error } = await supabase
    .from('telegram_chat_ids')
    .upsert(
      {
        patient_id: String(patientId),
        chat_id: String(chatId),
        phone: phone || null,
        username: username || null,
        first_name: firstName || null,
        last_name: lastName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' }
    )

  if (error) {
    throw new Error(`upsertTelegramChatId failed: ${error.message}`)
  }
}

async function linkLeadPatientTelegram({ leadId, chatId, fromUser }) {
  const lead = await getLeadById(leadId)
  if (!lead) {
    throw new Error('LEAD_NOT_FOUND')
  }

  const patient = await resolvePatientForLead(lead)

  await upsertTelegramChatId({
    patientId: patient.id,
    chatId,
    phone: patient.phone || lead.phone,
    username: fromUser?.username,
    firstName: fromUser?.first_name,
    lastName: fromUser?.last_name,
  })

  const nextStatus = ['expired', 'rejected', 'canceled', 'cancelled'].includes(String(lead.status))
    ? lead.status
    : (lead.status === 'booked' || lead.status === 'confirmed' ? lead.status : 'contacted')

  const updatedLead = await updateLeadRecord(lead.id, {
    patient_id: Number(patient.id),
    telegram_linked_at: new Date().toISOString(),
    status: nextStatus,
    hold_expires_at: ['hold', 'new', 'contacted'].includes(nextStatus)
      ? lead.hold_expires_at
      : null,
  })

  return { lead: updatedLead, patient }
}

async function confirmLead(leadId) {
  const lead = await getLeadById(leadId)
  if (!lead) throw new Error('LEAD_NOT_FOUND')

  const patient = await resolvePatientForLead(lead)

  const updatedLead = await updateLeadRecord(lead.id, {
    patient_id: Number(patient.id),
    status: 'confirmed',
    hold_expires_at: null,
  })

  if (lead.visit_id) {
    await supabase
      .from('visits')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', Number(lead.visit_id))
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('patient_id', Number(patient.id))
    .in('status', ['scheduled', 'hold'])
    .order('scheduled_at', { ascending: true })
    .limit(1)

  if (appointments && appointments[0]) {
    await supabase
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', appointments[0].id)
  }

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
    await supabase
      .from('visits')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', Number(lead.visit_id))
  }

  if (lead.patient_id) {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', Number(lead.patient_id))
      .in('status', ['scheduled', 'confirmed', 'hold'])
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
  upsertTelegramChatId,
}
