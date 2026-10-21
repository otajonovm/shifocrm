const crypto = require('crypto')
const TelegramBot = require('node-telegram-bot-api')
const {
  clampPercent,
  dedicatedWebhookUrl,
  formatDedicatedCashbackNotify,
  normalizeBotUsername,
  tokenLast4,
  usernamesMatch,
} = require('./dedicatedUtils')
const { dropDedicatedBotInstance, getDedicatedBotInstance } = require('./botRegistry')
const repo = require('../repository/dedicatedBotRepo')

function randomSecret() {
  return crypto.randomBytes(24).toString('hex')
}

function publicBotPayload(row) {
  if (!row) return null
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    doctor_id: row.doctor_id,
    bot_username: row.bot_username,
    bot_title: row.bot_title,
    welcome_message: row.welcome_message,
    cashback_percent: row.cashback_percent,
    max_spend_percent: row.max_spend_percent,
    referral_bonus: row.referral_bonus,
    is_active: row.is_active,
    webhook_url: row.webhook_url,
    bot_token_last4: row.bot_token_last4,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function provisionDedicatedBot(req, res) {
  try {
    const body = req.body || {}
    const doctorId = Number(body.doctor_id)
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return res.status(400).json({ ok: false, error: 'DOCTOR_REQUIRED', message: 'Shifokorni tanlang.' })
    }

    const doctor = await repo.getDoctor(doctorId)
    if (!doctor) {
      return res.status(404).json({ ok: false, error: 'DOCTOR_NOT_FOUND', message: 'Shifokor topilmadi.' })
    }

    const existing = body.id
      ? await repo.getDedicatedBotById(body.id)
      : await repo.getDedicatedBotByDoctorId(doctorId, { includeInactive: true })

    const token = String(body.bot_token || '').trim() || existing?.bot_token
    if (!token) {
      return res.status(400).json({ ok: false, error: 'TOKEN_REQUIRED', message: 'Bot token kiriting.' })
    }

    const webhookUrl = dedicatedWebhookUrl(doctorId)
    if (!webhookUrl) {
      return res.status(500).json({
        ok: false,
        error: 'PUBLIC_URL_MISSING',
        message: 'TELEGRAM_PUBLIC_URL sozlanmagan. Webhook uchun https manzil kerak.',
      })
    }

    const tempBot = new TelegramBot(token, { polling: false })
    let me
    try {
      me = await tempBot.getMe()
    } catch {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_TOKEN',
        message: 'Telegram token yaroqsiz. BotFather dagi tokenni tekshiring.',
      })
    }

    const username = normalizeBotUsername(body.bot_username || me.username)
    if (me.username && body.bot_username && !usernamesMatch(body.bot_username, me.username)) {
      return res.status(400).json({
        ok: false,
        error: 'USERNAME_MISMATCH',
        message: `Token @${me.username} botiga tegishli. Username ni shunga moslang.`,
      })
    }

    const webhookSecret = existing?.webhook_secret || randomSecret()
    await tempBot.setWebHook(webhookUrl, { secret_token: webhookSecret })

    const row = await repo.upsertDedicatedBot({
      id: existing?.id,
      clinic_id: Number(body.clinic_id) || doctor.clinic_id,
      doctor_id: doctorId,
      bot_token: token,
      bot_token_last4: tokenLast4(token),
      bot_username: username || normalizeBotUsername(me.username),
      bot_title: String(body.bot_title || '').trim() || doctor.full_name || null,
      welcome_message: String(body.welcome_message || '').trim() || null,
      cashback_percent: clampPercent(body.cashback_percent, 5),
      max_spend_percent: clampPercent(body.max_spend_percent, 30),
      referral_bonus: Number(body.referral_bonus) >= 0 ? Number(body.referral_bonus) : 20000,
      is_active: body.is_active !== false,
      webhook_url: webhookUrl,
      webhook_secret: webhookSecret,
    })

    dropDedicatedBotInstance(doctorId)
    getDedicatedBotInstance(doctorId, token)

    return res.json({ ok: true, data: publicBotPayload(row) })
  } catch (error) {
    console.error('provisionDedicatedBot:', error.message)
    return res.status(500).json({
      ok: false,
      error: 'PROVISION_FAILED',
      message: 'Botni ulashda xatolik yuz berdi.',
    })
  }
}

async function deactivateDedicatedBot(req, res) {
  try {
    const body = req.body || {}
    const row = body.id
      ? await repo.getDedicatedBotById(body.id)
      : await repo.getDedicatedBotByDoctorId(Number(body.doctor_id), { includeInactive: true })
    if (!row) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'Bot topilmadi.' })
    }
    if (row.bot_token) {
      const tempBot = new TelegramBot(row.bot_token, { polling: false })
      await tempBot.deleteWebHook().catch(() => {})
    }
    const updated = await repo.upsertDedicatedBot({
      ...row,
      is_active: false,
      webhook_url: null,
    })
    dropDedicatedBotInstance(row.doctor_id)
    return res.json({ ok: true, data: publicBotPayload(updated) })
  } catch (error) {
    console.error('deactivateDedicatedBot:', error.message)
    return res.status(500).json({
      ok: false,
      error: 'DEACTIVATE_FAILED',
      message: 'Botni o\'chirishda xatolik yuz berdi.',
    })
  }
}

async function notifyDedicatedCashback(req, res) {
  try {
    const doctorId = Number(req.body?.doctor_id)
    const patientId = Number(req.body?.patient_id)
    const earnedAmount = Math.round(Number(req.body?.earned_amount) || 0)
    if (!Number.isFinite(doctorId) || !Number.isFinite(patientId) || earnedAmount <= 0) {
      return res.status(400).json({ ok: false, error: 'INVALID_PAYLOAD' })
    }
    const botRow = await repo.getDedicatedBotByDoctorId(doctorId)
    if (!botRow?.bot_token) {
      return res.status(404).json({ ok: false, error: 'BOT_NOT_ACTIVE' })
    }
    const chat = await repo.getChatByPatient(doctorId, patientId)
    if (!chat?.chat_id) {
      return res.status(404).json({ ok: false, error: 'CHAT_ID_NOT_FOUND' })
    }
    const doctor = await repo.getDoctor(doctorId)
    const bot = getDedicatedBotInstance(doctorId, botRow.bot_token)
    const message = formatDedicatedCashbackNotify({
      doctorName: botRow.bot_title || doctor?.full_name,
      earnedAmount,
    })
    await bot.sendMessage(chat.chat_id, message)
    return res.json({ ok: true })
  } catch (error) {
    console.error('notifyDedicatedCashback:', error.message)
    return res.status(500).json({ ok: false, error: 'NOTIFY_FAILED' })
  }
}

function mountProvisionApi(app, checkApiKey) {
  app.post('/api/dedicated-bots/provision', checkApiKey, provisionDedicatedBot)
  app.post('/api/dedicated-bots/deactivate', checkApiKey, deactivateDedicatedBot)
  app.post('/api/dedicated-bots/notify', checkApiKey, notifyDedicatedCashback)
}

module.exports = {
  mountProvisionApi,
  publicBotPayload,
}
