const TelegramBot = require('node-telegram-bot-api')

const cache = new Map()

function getDedicatedBotInstance(doctorId, token) {
  const key = String(doctorId)
  const existing = cache.get(key)
  if (existing && existing.token === token) return existing.bot
  const bot = new TelegramBot(token, { polling: false })
  cache.set(key, { token, bot })
  return bot
}

function dropDedicatedBotInstance(doctorId) {
  cache.delete(String(doctorId))
}

module.exports = {
  dropDedicatedBotInstance,
  getDedicatedBotInstance,
}
