/**
 * Dedicated doctor cashback Telegram bots — public HTTPS webhook.
 *
 * Telegram: POST /api/webhook/dedicated/:doctorId
 * CRM:      POST /api/dedicated-bots/{provision,notify,deactivate,sync-webhooks}
 * Health:   GET  /health
 *
 * verify_jwt = false (Telegram webhook Authorization yubormaydi).
 * CRM so'rovlari X-API-KEY bilan himoyalanadi.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const MENU = {
  BALANCE: '💰 Mening keshbek balansim',
  REFERRAL: '🎁 Do\'stimni taklif qilish',
}

const pendingPhone = new Map()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-api-key, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function routePath(pathname) {
  const marker = '/dedicated-bot'
  const idx = pathname.indexOf(marker)
  const rest = idx >= 0 ? pathname.slice(idx + marker.length) : pathname
  return rest.replace(/\/+$/, '') || '/'
}

function clampPercent(value, fallback = 5) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

function normalizeBotUsername(value) {
  const raw = String(value || '').trim().replace(/^@+/, '')
  return raw ? `@${raw}` : ''
}

function stripBotUsername(value) {
  return String(value || '').trim().replace(/^@+/, '')
}

function tokenLast4(value) {
  const token = String(value || '').trim()
  return token.length >= 4 ? token.slice(-4) : ''
}

function formatSomAmount(value) {
  const n = Math.round(Number(value) || 0)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatDoctorLabel(fullName) {
  const name = String(fullName || '').trim() || 'Shifokor'
  if (/^(dr\.?|доктор)\s/i.test(name)) return name
  return `Dr. ${name}`
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return null
}

function parseReferralStartPayload(text) {
  const raw = String(text || '')
  const match = raw.match(/\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?/i)
  const payload = match && match[1] ? String(match[1]).trim() : ''
  const ref = payload.match(/^ref[_-]?(\d+)$/i)
  return { referrerPatientId: ref ? Number(ref[1]) : null }
}

function mainKeyboard() {
  return {
    keyboard: [[{ text: MENU.BALANCE }], [{ text: MENU.REFERRAL }]],
    resize_keyboard: true,
  }
}

function publicUrl() {
  const explicit = String(Deno.env.get('TELEGRAM_PUBLIC_URL') || '').replace(/\/$/, '')
  if (explicit) return explicit
  const supabaseUrl = String(Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '')
  return supabaseUrl ? `${supabaseUrl}/functions/v1/dedicated-bot` : ''
}

function webhookUrl(doctorId) {
  const base = publicUrl()
  return base ? `${base}/api/webhook/dedicated/${doctorId}` : ''
}

function expectedApiKey() {
  return String(
    Deno.env.get('TELEGRAM_API_KEY')
    || Deno.env.get('API_KEY')
    || Deno.env.get('VITE_TELEGRAM_API_KEY')
    || '',
  ).trim()
}

function checkApiKey(req) {
  const expected = expectedApiKey()
  if (!expected) return true
  const provided = String(req.headers.get('x-api-key') || '').trim()
  return provided === expected
}

function createDb() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return null
  return createClient(supabaseUrl, serviceKey)
}

async function tg(token, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  return response.json()
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

async function getBotByDoctorId(db, doctorId, includeInactive = false) {
  let query = db.from('doctor_dedicated_bots').select('*').eq('doctor_id', Number(doctorId))
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('getBotByDoctorId:', error.message)
    return null
  }
  return data
}

async function getDoctor(db, doctorId) {
  const { data, error } = await db
    .from('doctors')
    .select('id, full_name, phone, clinic_id, public_slug, specialization')
    .eq('id', Number(doctorId))
    .maybeSingle()
  if (error) {
    console.error('getDoctor:', error.message)
    return null
  }
  return data
}

function brandName(botRow, doctor) {
  return String(botRow?.bot_title || doctor?.full_name || 'Kabinet').trim()
}

async function sendMessage(token, chatId, text, extra = {}) {
  return tg(token, 'sendMessage', {
    chat_id: chatId,
    text,
    ...extra,
  })
}

async function handleStart(db, botRow, msg) {
  const chatId = msg.chat.id
  const doctor = await getDoctor(db, botRow.doctor_id)
  const { data: existing } = await db
    .from('doctor_bot_chats')
    .select('patient_id')
    .eq('doctor_id', botRow.doctor_id)
    .eq('chat_id', String(chatId))
    .maybeSingle()

  if (existing?.patient_id) {
    await sendMessage(
      botRow.bot_token,
      chatId,
      botRow.welcome_message || `Xush kelibsiz! ${brandName(botRow, doctor)} keshbek xizmati.`,
      { reply_markup: mainKeyboard() },
    )
    return
  }

  const { referrerPatientId } = parseReferralStartPayload(msg.text)
  pendingPhone.set(`${botRow.doctor_id}:${chatId}`, {
    firstName: msg.from?.first_name || '',
    lastName: msg.from?.last_name || '',
    username: msg.from?.username || '',
    referrerPatientId,
  })

  const greeting = msg.from?.first_name ? `, ${msg.from.first_name}` : ''
  await sendMessage(
    botRow.bot_token,
    chatId,
    `👋 Assalomu alaykum${greeting}!\n\n` +
      `${brandName(botRow, doctor)} keshbek botiga xush kelibsiz.\n\n` +
      `Balansni ko'rish uchun telefon raqamingizni yuboring.\n\n` +
      `Format: +998901234567`,
  )
}

async function maybeCreditReferral(db, botRow, doctor, patient, referrerPatientId) {
  const referrerId = Number(referrerPatientId)
  const patientId = Number(patient?.id)
  if (!Number.isFinite(referrerId) || referrerId <= 0 || referrerId === patientId) return
  const { data: existing } = await db
    .from('patient_referrals')
    .select('id')
    .eq('doctor_id', botRow.doctor_id)
    .eq('referred_patient_id', patientId)
    .maybeSingle()
  if (existing) return
  const bonus = Math.max(0, Number(botRow.referral_bonus) || 0)
  await db.from('patient_referrals').insert({
    clinic_id: botRow.clinic_id || doctor?.clinic_id || null,
    doctor_id: botRow.doctor_id,
    referrer_patient_id: referrerId,
    referred_patient_id: patientId,
    bonus_amount: bonus,
  })
  if (bonus <= 0) return
  const now = new Date().toISOString()
  const { data: row } = await db
    .from('patient_cashback_balances')
    .select('patient_id, balance, lifetime_earned, lifetime_spent')
    .eq('patient_id', referrerId)
    .maybeSingle()
  const balance = Math.max(0, (Number(row?.balance) || 0) + bonus)
  const lifetimeEarned = Math.max(0, (Number(row?.lifetime_earned) || 0) + bonus)
  if (row) {
    await db.from('patient_cashback_balances').update({
      balance,
      lifetime_earned: lifetimeEarned,
      updated_at: now,
    }).eq('patient_id', referrerId)
  } else {
    await db.from('patient_cashback_balances').insert({
      patient_id: referrerId,
      balance,
      lifetime_earned: lifetimeEarned,
      lifetime_spent: 0,
    })
  }
  await db.from('cashback_transactions').insert({
    patient_id: referrerId,
    amount: bonus,
    type: 'earn',
    note: 'referral bonus',
    balance_after: balance,
  })
}

async function handlePhone(db, botRow, msg) {
  const chatId = msg.chat.id
  const phone = normalizePhone(msg.text)
  if (!phone) {
    await sendMessage(
      botRow.bot_token,
      chatId,
      '❌ Noto\'g\'ri format!\n\nIltimos, telefon raqamni to\'g\'ri formatda yuboring:\n+998901234567 yoki 901234567',
    )
    return
  }

  const doctor = await getDoctor(db, botRow.doctor_id)
  const clinicId = botRow.clinic_id || doctor?.clinic_id || null
  let query = db.from('patients').select('id, full_name, phone, clinic_id').eq('phone', phone).limit(1)
  if (clinicId) query = query.eq('clinic_id', clinicId)
  const { data: patients } = await query
  const patient = patients && patients[0]
  if (!patient) {
    await sendMessage(
      botRow.bot_token,
      chatId,
      `❌ ${phone} raqami kabinetda topilmadi.\n\nAvval qabulga yoziling, so'ng /start ni qayta yuboring.`,
    )
    pendingPhone.delete(`${botRow.doctor_id}:${chatId}`)
    return
  }

  const state = pendingPhone.get(`${botRow.doctor_id}:${chatId}`) || {}
  await db.from('doctor_bot_chats').upsert({
    clinic_id: clinicId || patient.clinic_id || null,
    doctor_id: botRow.doctor_id,
    patient_id: patient.id,
    chat_id: String(chatId),
    phone,
    username: state.username || msg.from?.username || '',
    first_name: state.firstName || msg.from?.first_name || '',
    last_name: state.lastName || msg.from?.last_name || '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id' })

  if (state.referrerPatientId) {
    await maybeCreditReferral(db, botRow, doctor, patient, state.referrerPatientId).catch((error) => {
      console.error('referral:', error.message)
    })
  }
  pendingPhone.delete(`${botRow.doctor_id}:${chatId}`)

  const { data: bal } = await db
    .from('patient_cashback_balances')
    .select('balance')
    .eq('patient_id', patient.id)
    .maybeSingle()
  const balance = Number(bal?.balance) || 0
  await sendMessage(
    botRow.bot_token,
    chatId,
    botRow.welcome_message
      || `✅ ${patient.full_name || 'Hurmatli bemor'}, xush kelibsiz!\n\n💰 Keshbek balansingiz: ${formatSomAmount(balance)} so'm`,
    { reply_markup: mainKeyboard() },
  )
}

async function handleMenu(db, botRow, msg) {
  const chatId = msg.chat.id
  const text = String(msg.text || '').trim()
  const { data: chatLink } = await db
    .from('doctor_bot_chats')
    .select('chat_id, patient_id')
    .eq('doctor_id', botRow.doctor_id)
    .eq('chat_id', String(chatId))
    .maybeSingle()

  if (!chatLink?.patient_id) {
    if (normalizePhone(text)) {
      await handlePhone(db, botRow, msg)
      return
    }
    await sendMessage(botRow.bot_token, chatId, 'Avval /start buyrug\'ini yuboring va telefon raqamingizni kiriting.')
    return
  }

  if (text === MENU.BALANCE) {
    const { data: bal } = await db
      .from('patient_cashback_balances')
      .select('balance')
      .eq('patient_id', chatLink.patient_id)
      .maybeSingle()
    await sendMessage(
      botRow.bot_token,
      chatId,
      `💰 Keshbek balansingiz: ${formatSomAmount(Number(bal?.balance) || 0)} so'm`,
      { reply_markup: mainKeyboard() },
    )
    return
  }

  if (text === MENU.REFERRAL) {
    const username = stripBotUsername(botRow.bot_username)
    const link = username ? `https://t.me/${username}?start=ref_${chatLink.patient_id}` : ''
    await sendMessage(
      botRow.bot_token,
      chatId,
      `🎁 Do'stingizni taklif qiling.\n\nDo'stingiz botga kirsa, hisobingizga ${formatSomAmount(botRow.referral_bonus)} so'm qo'shiladi.\n\n${link}`,
      { reply_markup: mainKeyboard() },
    )
    return
  }

  const doctor = await getDoctor(db, botRow.doctor_id)
  await sendMessage(
    botRow.bot_token,
    chatId,
    botRow.welcome_message || `Xush kelibsiz! ${brandName(botRow, doctor)} keshbek xizmati.`,
    { reply_markup: mainKeyboard() },
  )
}

async function handleWebhook(db, doctorId, req) {
  const botRow = await getBotByDoctorId(db, doctorId)
  if (!botRow?.is_active || !botRow.bot_token) {
    return json({ ok: false, error: 'NOT_FOUND' }, 404)
  }
  const update = await req.json().catch(() => ({}))
  const msg = update?.message
  if (msg?.text && /^\/start/i.test(msg.text)) {
    await handleStart(db, botRow, msg)
  } else if (msg) {
    await handleMenu(db, botRow, msg)
  }
  return json({ ok: true })
}

async function setBotWebhook(botRow) {
  const doctorId = Number(botRow.doctor_id)
  const url = webhookUrl(doctorId)
  if (!url || !botRow.bot_token) return { ok: false, error: 'PUBLIC_URL_MISSING' }
  const secret = botRow.webhook_secret || crypto.randomUUID().replace(/-/g, '')
  const result = await tg(botRow.bot_token, 'setWebhook', {
    url,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
  return { ok: Boolean(result?.ok), result, url, secret }
}

async function handleProvision(db, body) {
  const doctorId = Number(body.doctor_id)
  if (!Number.isFinite(doctorId) || doctorId <= 0) {
    return json({ ok: false, error: 'DOCTOR_REQUIRED', message: 'Shifokorni tanlang.' }, 400)
  }
  const doctor = await getDoctor(db, doctorId)
  if (!doctor) {
    return json({ ok: false, error: 'DOCTOR_NOT_FOUND', message: 'Shifokor topilmadi.' }, 404)
  }
  const existing = body.id
    ? (await db.from('doctor_dedicated_bots').select('*').eq('id', body.id).maybeSingle()).data
    : await getBotByDoctorId(db, doctorId, true)
  const token = String(body.bot_token || '').trim() || existing?.bot_token
  if (!token) {
    return json({ ok: false, error: 'TOKEN_REQUIRED', message: 'Bot token kiriting.' }, 400)
  }
  const me = await tg(token, 'getMe', {})
  if (!me?.ok) {
    return json({ ok: false, error: 'INVALID_TOKEN', message: 'Telegram token yaroqsiz.' }, 400)
  }
  const username = normalizeBotUsername(body.bot_username || me.result?.username)
  const webhookSecret = existing?.webhook_secret || crypto.randomUUID().replace(/-/g, '')
  const hook = webhookUrl(doctorId)
  const set = await tg(token, 'setWebhook', {
    url: hook,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
  if (!set?.ok) {
    return json({
      ok: false,
      error: 'WEBHOOK_FAILED',
      message: set?.description || 'Telegram webhook o\'rnatilmadi.',
    }, 502)
  }
  const payload = {
    id: existing?.id,
    clinic_id: Number(body.clinic_id) || doctor.clinic_id,
    doctor_id: doctorId,
    bot_token: token,
    bot_token_last4: tokenLast4(token),
    bot_username: username,
    bot_title: String(body.bot_title || '').trim() || doctor.full_name || null,
    welcome_message: String(body.welcome_message || '').trim() || null,
    cashback_percent: clampPercent(body.cashback_percent, 5),
    max_spend_percent: clampPercent(body.max_spend_percent, 30),
    referral_bonus: Number(body.referral_bonus) >= 0 ? Number(body.referral_bonus) : 20000,
    is_active: body.is_active !== false,
    webhook_url: hook,
    webhook_secret: webhookSecret,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db
    .from('doctor_dedicated_bots')
    .upsert(payload, { onConflict: 'doctor_id' })
    .select('*')
    .maybeSingle()
  if (error) throw error
  return json({ ok: true, data: publicBotPayload(data) })
}

async function handleNotify(db, body) {
  const doctorId = Number(body.doctor_id)
  const patientId = Number(body.patient_id)
  const earnedAmount = Math.round(Number(body.earned_amount) || 0)
  if (!Number.isFinite(doctorId) || !Number.isFinite(patientId) || earnedAmount <= 0) {
    return json({ ok: false, error: 'INVALID_PAYLOAD' }, 400)
  }
  const botRow = await getBotByDoctorId(db, doctorId)
  if (!botRow?.bot_token) return json({ ok: false, error: 'BOT_NOT_ACTIVE' }, 404)
  const { data: chat } = await db
    .from('doctor_bot_chats')
    .select('chat_id')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .maybeSingle()
  if (!chat?.chat_id) return json({ ok: false, error: 'CHAT_ID_NOT_FOUND' }, 404)
  const doctor = await getDoctor(db, doctorId)
  const text = `${formatDoctorLabel(botRow.bot_title || doctor?.full_name)} qabulidagi to'lovingiz uchun ${formatSomAmount(earnedAmount)} so'm keshbek hisoblandi!`
  const sent = await sendMessage(botRow.bot_token, chat.chat_id, text)
  if (!sent?.ok) return json({ ok: false, error: 'NOTIFY_FAILED' }, 502)
  return json({ ok: true })
}

async function handleDeactivate(db, body) {
  const row = body.id
    ? (await db.from('doctor_dedicated_bots').select('*').eq('id', body.id).maybeSingle()).data
    : await getBotByDoctorId(db, Number(body.doctor_id), true)
  if (!row) return json({ ok: false, error: 'NOT_FOUND', message: 'Bot topilmadi.' }, 404)
  if (row.bot_token) {
    await tg(row.bot_token, 'deleteWebhook', {}).catch(() => {})
  }
  const { data, error } = await db
    .from('doctor_dedicated_bots')
    .update({ is_active: false, webhook_url: null, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return json({ ok: true, data: publicBotPayload(data) })
}

async function handleSyncWebhooks(db) {
  const { data: rows, error } = await db
    .from('doctor_dedicated_bots')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  const results = []
  for (const row of rows || []) {
    const set = await setBotWebhook(row)
    if (set.ok) {
      await db.from('doctor_dedicated_bots').update({
        webhook_url: set.url,
        webhook_secret: set.secret,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id)
    }
    results.push({
      doctor_id: row.doctor_id,
      username: row.bot_username,
      ok: set.ok,
      url: set.url,
      error: set.result?.description || set.error || null,
    })
  }
  return json({ ok: true, data: results })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const path = routePath(new URL(req.url).pathname)
  if (req.method === 'GET' && (path === '/' || path === '/health')) {
    return json({
      status: 'ok',
      service: 'dedicated-bot',
      timestamp: new Date().toISOString(),
    })
  }

  const db = createDb()
  if (!db) return json({ ok: false, error: 'SUPABASE env missing' }, 500)

  try {
    const webhookMatch = path.match(/^\/api\/webhook\/dedicated\/(\d+)$/)
    if (req.method === 'POST' && webhookMatch) {
      return await handleWebhook(db, Number(webhookMatch[1]), req)
    }

    if (req.method === 'POST' && path.startsWith('/api/dedicated-bots/')) {
      if (!checkApiKey(req)) return json({ ok: false, error: 'UNAUTHORIZED' }, 401)
      const body = await req.json().catch(() => ({}))
      if (path === '/api/dedicated-bots/provision') return await handleProvision(db, body)
      if (path === '/api/dedicated-bots/notify') return await handleNotify(db, body)
      if (path === '/api/dedicated-bots/deactivate') return await handleDeactivate(db, body)
      if (path === '/api/dedicated-bots/sync-webhooks') return await handleSyncWebhooks(db)
    }

    if (req.method === 'GET' && path === '/api/dedicated-bots/webhook-info') {
      const { data: rows, error } = await db
        .from('doctor_dedicated_bots')
        .select('doctor_id, bot_username, bot_token, webhook_url, is_active')
        .eq('is_active', true)
      if (error) throw error
      const data = []
      for (const row of rows || []) {
        const info = await tg(row.bot_token, 'getWebhookInfo', {})
        const r = info?.result || {}
        data.push({
          doctor_id: row.doctor_id,
          username: row.bot_username,
          url: r.url || null,
          pending: r.pending_update_count || 0,
          last_error: r.last_error_message || null,
          last_error_date: r.last_error_date || null,
        })
      }
      return json({ ok: true, data })
    }

    return json({ ok: false, error: 'NOT_FOUND' }, 404)
  } catch (error) {
    console.error('dedicated-bot:', error?.message || error)
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500)
  }
})
