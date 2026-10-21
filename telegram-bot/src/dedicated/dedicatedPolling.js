const TelegramBot = require('node-telegram-bot-api')
const { supabase } = require('../supabase')
const { handleDedicatedUpdate } = require('./dedicatedHandler')
const { telegramPublicUrl } = require('./dedicatedUtils')

function shouldPollDedicatedBots() {
  if (process.env.DEDICATED_DISABLE_POLLING === '1') return false
  if (process.env.DEDICATED_FORCE_POLLING === '1') return true
  const url = telegramPublicUrl()
  return !(/^https:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url))
}

const pollers = new Map()

async function loadActiveBots() {
  const { data, error } = await supabase
    .from('doctor_dedicated_bots')
    .select('*')
    .eq('is_active', true)
  if (error) {
    console.error('dedicated polling load:', error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}

function attachHandlers(bot, doctorId) {
  bot.on('message', async (msg) => {
    try {
      const { data: botRow } = await supabase
        .from('doctor_dedicated_bots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true)
        .maybeSingle()
      if (!botRow) return
      await handleDedicatedUpdate(bot, botRow, { message: msg })
    } catch (error) {
      console.error('dedicated polling message:', error.message)
    }
  })
  bot.on('polling_error', (error) => {
    console.error(`dedicated polling_error doctor=${doctorId}:`, error.message)
  })
}

async function startDedicatedPolling() {
  if (!shouldPollDedicatedBots()) {
    console.log('ℹ️ Dedicated cashback botlar: webhook rejimida (polling o\'chirilgan)')
    return
  }
  const rows = await loadActiveBots()
  if (!rows.length) {
    console.log('ℹ️ Dedicated cashback botlar: faol bot yo\'q')
    return
  }

  for (const row of rows) {
    const doctorId = Number(row.doctor_id)
    if (!row.bot_token || !Number.isFinite(doctorId)) continue
    if (pollers.has(doctorId)) continue
    try {
      const bot = new TelegramBot(row.bot_token, { polling: true })
      await bot.deleteWebHook().catch(() => {})
      attachHandlers(bot, doctorId)
      pollers.set(doctorId, bot)
      console.log(`✅ Dedicated cashback bot polling: doctor=${doctorId} ${row.bot_username || ''}`)
    } catch (error) {
      console.error(`dedicated polling start doctor=${doctorId}:`, error.message)
    }
  }
}

function stopDedicatedPolling() {
  for (const [doctorId, bot] of pollers.entries()) {
    bot.stopPolling().catch(() => {})
    pollers.delete(doctorId)
  }
}

module.exports = {
  startDedicatedPolling,
  stopDedicatedPolling,
}
