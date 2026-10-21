const { getDedicatedBotByDoctorId } = require('../repository/dedicatedBotRepo')
const { getDedicatedBotInstance } = require('./botRegistry')
const { handleDedicatedUpdate } = require('./dedicatedHandler')

function mountDedicatedWebhook(app) {
  app.post('/api/webhook/dedicated/:doctorId', async (req, res) => {
    const doctorId = Number(req.params.doctorId)
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return res.sendStatus(404)
    }

    const botRow = await getDedicatedBotByDoctorId(doctorId)
    if (!botRow?.is_active || !botRow.bot_token) {
      return res.sendStatus(404)
    }

    const secret = req.get('X-Telegram-Bot-Api-Secret-Token') || ''
    if (botRow.webhook_secret && secret !== botRow.webhook_secret) {
      return res.sendStatus(401)
    }

    res.sendStatus(200)

    try {
      const bot = getDedicatedBotInstance(doctorId, botRow.bot_token)
      await handleDedicatedUpdate(bot, botRow, req.body || {})
    } catch (error) {
      console.error('dedicated webhook:', error.message)
    }
  })
}

module.exports = {
  mountDedicatedWebhook,
}
