const { supabase } = require('../supabase')

const BOTS_TABLE = 'doctor_dedicated_bots'
const CHATS_TABLE = 'doctor_bot_chats'
const REFERRALS_TABLE = 'patient_referrals'
const BALANCES_TABLE = 'patient_cashback_balances'
const TXNS_TABLE = 'cashback_transactions'

async function getDedicatedBotByDoctorId(doctorId, { includeInactive = false } = {}) {
  const id = Number(doctorId)
  if (!Number.isFinite(id) || id <= 0) return null
  let query = supabase.from(BOTS_TABLE).select('*').eq('doctor_id', id)
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('getDedicatedBotByDoctorId:', error.message)
    return null
  }
  return data || null
}

async function getDedicatedBotById(id) {
  if (!id) return null
  const { data, error } = await supabase
    .from(BOTS_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('getDedicatedBotById:', error.message)
    return null
  }
  return data || null
}

async function upsertDedicatedBot(payload) {
  const { data, error } = await supabase
    .from(BOTS_TABLE)
    .upsert(payload, { onConflict: 'doctor_id' })
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

async function getDoctor(doctorId) {
  const id = Number(doctorId)
  if (!Number.isFinite(id) || id <= 0) return null
  const { data, error } = await supabase
    .from('doctors')
    .select('id, full_name, phone, clinic_id, public_slug, specialization')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('getDoctor:', error.message)
    return null
  }
  return data || null
}

async function findPatientByPhone(phone, clinicId) {
  let query = supabase
    .from('patients')
    .select('id, full_name, phone, clinic_id')
    .eq('phone', phone)
    .limit(1)
  if (clinicId) query = query.eq('clinic_id', clinicId)
  const { data, error } = await query
  if (error) throw error
  return data && data[0] ? data[0] : null
}

async function getChatLink(doctorId, chatId) {
  const { data, error } = await supabase
    .from(CHATS_TABLE)
    .select('*')
    .eq('doctor_id', Number(doctorId))
    .eq('chat_id', String(chatId))
    .maybeSingle()
  if (error) {
    console.error('getChatLink:', error.message)
    return null
  }
  return data || null
}

async function upsertDoctorBotChat(row) {
  const { data, error } = await supabase
    .from(CHATS_TABLE)
    .upsert({
      ...row,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'doctor_id,patient_id' })
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

async function getChatByPatient(doctorId, patientId) {
  const { data, error } = await supabase
    .from(CHATS_TABLE)
    .select('chat_id, patient_id')
    .eq('doctor_id', Number(doctorId))
    .eq('patient_id', Number(patientId))
    .maybeSingle()
  if (error) {
    console.error('getChatByPatient:', error.message)
    return null
  }
  return data || null
}

async function getCashbackBalance(patientId) {
  const { data, error } = await supabase
    .from(BALANCES_TABLE)
    .select('balance')
    .eq('patient_id', Number(patientId))
    .maybeSingle()
  if (error) {
    console.error('getCashbackBalance:', error.message)
    return 0
  }
  const value = Number(data?.balance)
  return Number.isFinite(value) && value > 0 ? value : 0
}

async function creditCashbackBonus({ patientId, amount, note }) {
  const earned = Math.round(Number(amount) || 0)
  const pid = Number(patientId)
  if (!Number.isFinite(pid) || earned <= 0) return { ok: false }
  const current = await supabase
    .from(BALANCES_TABLE)
    .select('patient_id, balance, lifetime_earned, lifetime_spent')
    .eq('patient_id', pid)
    .maybeSingle()
  if (current.error) throw current.error
  const row = current.data
  const now = new Date().toISOString()
  const balance = Math.max(0, (Number(row?.balance) || 0) + earned)
  const lifetimeEarned = Math.max(0, (Number(row?.lifetime_earned) || 0) + earned)
  if (row) {
    const patched = await supabase
      .from(BALANCES_TABLE)
      .update({
        balance,
        lifetime_earned: lifetimeEarned,
        updated_at: now,
      })
      .eq('patient_id', pid)
    if (patched.error) throw patched.error
  } else {
    const inserted = await supabase
      .from(BALANCES_TABLE)
      .insert({
        patient_id: pid,
        balance,
        lifetime_earned: lifetimeEarned,
        lifetime_spent: 0,
      })
    if (inserted.error) throw inserted.error
  }
  const txn = await supabase.from(TXNS_TABLE).insert({
    patient_id: pid,
    amount: earned,
    type: 'earn',
    note: note || 'referral bonus',
    balance_after: balance,
  })
  if (txn.error) {
    console.error('creditCashbackBonus txn:', txn.error.message)
  }
  return { ok: true, earned, balance }
}

async function findReferral(doctorId, referredPatientId) {
  const { data, error } = await supabase
    .from(REFERRALS_TABLE)
    .select('id')
    .eq('doctor_id', Number(doctorId))
    .eq('referred_patient_id', Number(referredPatientId))
    .maybeSingle()
  if (error) {
    console.error('findReferral:', error.message)
    return null
  }
  return data || null
}

async function insertReferral(row) {
  const { data, error } = await supabase
    .from(REFERRALS_TABLE)
    .insert(row)
    .select('id')
    .maybeSingle()
  if (error) throw error
  return data
}

module.exports = {
  creditCashbackBonus,
  findPatientByPhone,
  findReferral,
  getCashbackBalance,
  getChatByPatient,
  getChatLink,
  getDedicatedBotByDoctorId,
  getDedicatedBotById,
  getDoctor,
  insertReferral,
  upsertDedicatedBot,
  upsertDoctorBotChat,
}
