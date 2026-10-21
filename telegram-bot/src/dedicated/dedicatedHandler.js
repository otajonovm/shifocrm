const {
  MENU,
  formatSomAmount,
  mainKeyboard,
  normalizePhone,
  parseReferralStartPayload,
  stripBotUsername,
} = require('./dedicatedUtils')
const repo = require('../repository/dedicatedBotRepo')

const userStates = new Map()

function stateKey(doctorId, chatId) {
  return `${doctorId}:${chatId}`
}

function brandName(botRow, doctor) {
  return String(botRow?.bot_title || doctor?.full_name || 'Kabinet').trim()
}

function defaultWelcome(botRow, doctor, firstName) {
  const greeting = firstName ? `, ${firstName}` : ''
  return (
    `👋 Assalomu alaykum${greeting}!\n\n` +
    `${brandName(botRow, doctor)} keshbek botiga xush kelibsiz.\n\n` +
    `Balansni ko'rish uchun telefon raqamingizni yuboring.\n\n` +
    `Format: +998901234567`
  )
}

async function sendMainMenu(bot, chatId, botRow, doctor, extraText) {
  const text = extraText
    || botRow.welcome_message
    || `Xush kelibsiz! ${brandName(botRow, doctor)} keshbek xizmati.`
  await bot.sendMessage(chatId, text, { reply_markup: mainKeyboard() })
}

async function maybeCreditReferral(botRow, doctor, patient, referrerPatientId) {
  const referrerId = Number(referrerPatientId)
  const patientId = Number(patient?.id)
  if (!Number.isFinite(referrerId) || referrerId <= 0 || referrerId === patientId) return
  const existing = await repo.findReferral(botRow.doctor_id, patientId)
  if (existing) return
  const bonus = Math.max(0, Number(botRow.referral_bonus) || 0)
  await repo.insertReferral({
    clinic_id: botRow.clinic_id || doctor?.clinic_id || null,
    doctor_id: botRow.doctor_id,
    referrer_patient_id: referrerId,
    referred_patient_id: patientId,
    bonus_amount: bonus,
  })
  if (bonus > 0) {
    await repo.creditCashbackBonus({
      patientId: referrerId,
      amount: bonus,
      note: 'referral bonus',
    }).catch((error) => {
      console.error('referral bonus:', error.message)
    })
  }
}

async function handleDedicatedStart(bot, botRow, msg) {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || ''
  const doctor = await repo.getDoctor(botRow.doctor_id)
  const { referrerPatientId } = parseReferralStartPayload(msg.text)

  const existing = await repo.getChatLink(botRow.doctor_id, chatId)
  if (existing?.patient_id) {
    await sendMainMenu(bot, chatId, botRow, doctor)
    return
  }

  userStates.set(stateKey(botRow.doctor_id, chatId), {
    step: 'waiting_phone',
    firstName,
    lastName: msg.from?.last_name || '',
    username: msg.from?.username || '',
    referrerPatientId,
  })

  await bot.sendMessage(chatId, defaultWelcome(botRow, doctor, firstName))
}

async function handlePhoneNumber(bot, botRow, msg) {
  const chatId = msg.chat.id
  const key = stateKey(botRow.doctor_id, chatId)
  const state = userStates.get(key)
  if (!state || state.step !== 'waiting_phone') return false

  const phone = normalizePhone(msg.text)
  if (!phone) {
    await bot.sendMessage(
      chatId,
      '❌ Noto\'g\'ri format!\n\nIltimos, telefon raqamni to\'g\'ri formatda yuboring:\n+998901234567 yoki 901234567',
    )
    return true
  }

  const doctor = await repo.getDoctor(botRow.doctor_id)
  const clinicId = botRow.clinic_id || doctor?.clinic_id || null
  const patient = await repo.findPatientByPhone(phone, clinicId)
  if (!patient) {
    await bot.sendMessage(
      chatId,
      `❌ ${phone} raqami kabinetda topilmadi.\n\nAvval qabulga yoziling, so'ng /start ni qayta yuboring.`,
    )
    userStates.delete(key)
    return true
  }

  await repo.upsertDoctorBotChat({
    clinic_id: clinicId || patient.clinic_id || null,
    doctor_id: botRow.doctor_id,
    patient_id: patient.id,
    chat_id: String(chatId),
    phone,
    username: state.username,
    first_name: state.firstName,
    last_name: state.lastName,
  })

  if (state.referrerPatientId) {
    await maybeCreditReferral(botRow, doctor, patient, state.referrerPatientId).catch((error) => {
      console.error('referral on phone:', error.message)
    })
  }

  userStates.delete(key)
  const balance = await repo.getCashbackBalance(patient.id)
  await sendMainMenu(
    bot,
    chatId,
    botRow,
    doctor,
    botRow.welcome_message
      || `✅ ${patient.full_name || 'Hurmatli bemor'}, xush kelibsiz!\n\n💰 Keshbek balansingiz: ${formatSomAmount(balance)} so'm`,
  )
  return true
}

async function handleBalance(bot, botRow, chatLink) {
  const balance = await repo.getCashbackBalance(chatLink.patient_id)
  await bot.sendMessage(
    chatLink.chat_id,
    `💰 Keshbek balansingiz: ${formatSomAmount(balance)} so'm`,
    { reply_markup: mainKeyboard() },
  )
}

async function handleReferral(bot, botRow, chatLink) {
  const username = stripBotUsername(botRow.bot_username)
  const link = username
    ? `https://t.me/${username}?start=ref_${chatLink.patient_id}`
    : ''
  const bonus = formatSomAmount(botRow.referral_bonus)
  await bot.sendMessage(
    chatLink.chat_id,
    `🎁 Do'stingizni taklif qiling.\n\nDo'stingiz botga kirsa, hisobingizga ${bonus} so'm qo'shiladi.\n\n${link}`,
    { reply_markup: mainKeyboard() },
  )
}

async function handleDedicatedMessage(bot, botRow, msg) {
  if (await handlePhoneNumber(bot, botRow, msg)) return

  const chatId = msg.chat.id
  const text = String(msg.text || '').trim()
  const chatLink = await repo.getChatLink(botRow.doctor_id, chatId)
  if (!chatLink?.patient_id) {
    await bot.sendMessage(chatId, 'Avval /start buyrug\'ini yuboring va telefon raqamingizni kiriting.')
    return
  }

  if (text === MENU.BALANCE) {
    await handleBalance(bot, botRow, chatLink)
    return
  }
  if (text === MENU.REFERRAL) {
    await handleReferral(bot, botRow, chatLink)
    return
  }

  await sendMainMenu(bot, chatId, botRow, await repo.getDoctor(botRow.doctor_id))
}

async function handleDedicatedUpdate(bot, botRow, update) {
  const msg = update?.message
  if (!msg) return
  if (msg.text && /^\/start/i.test(msg.text)) {
    await handleDedicatedStart(bot, botRow, msg)
    return
  }
  await handleDedicatedMessage(bot, botRow, msg)
}

module.exports = {
  handleDedicatedUpdate,
}
