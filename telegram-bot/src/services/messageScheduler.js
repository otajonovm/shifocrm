const {
  getPendingMessages,
  updateMessageStatus
} = require('../repository/scheduledMessagesRepo')
const { insertNotificationEvent } = require('../repository/notificationEventsRepo')
const {
  getDueTreatmentPlanReminders,
  updateTreatmentPlanReminderStatus,
  buildTreatmentPlanReminderMessage,
} = require('../repository/treatmentPlansRepo')
const { getTelegramChatId } = require('../repository/telegramChatRepo')
const { getPatientById } = require('../repository/patientsRepo')
const {
  sendTreatmentPlanReminderSms,
  isSmsConfigured,
} = require('./smsSender')

let schedulerInterval = null
let schedulerRunning = false
let botInstance = null
let intervalMs = 30000
let lastRunAt = null
let lastError = null

async function processPendingMessages() {
  if (!botInstance) {
    throw new Error('Bot instance mavjud emas')
  }

  const nowIso = new Date().toISOString()
  const pendingMessages = await getPendingMessages({ nowIso, limit: 100 })

  if (pendingMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const messageRow of pendingMessages) {
    try {
      const chatId = await getTelegramChatId(messageRow.patient_id)

      if (!chatId) {
        await updateMessageStatus({
          id: messageRow.id,
          status: 'failed',
          failureReason: 'CHAT_ID_NOT_FOUND'
        })
        failed += 1
        continue
      }

      await botInstance.sendMessage(chatId, messageRow.message)

      await updateMessageStatus({
        id: messageRow.id,
        status: 'sent',
        sentAt: new Date().toISOString(),
        failureReason: null
      })

      const msgText = String(messageRow.message || '').toLowerCase()
      let eventType = 'follow_up_1d'
      if (msgText.includes('7') || msgText.includes('hafta')) {
        eventType = 'follow_up_7d'
      } else if (msgText.includes('3')) {
        eventType = 'follow_up_3d'
      }

      await insertNotificationEvent({
        patient_id: messageRow.patient_id,
        event_type: eventType,
        source_table: 'scheduled_messages',
        source_id: String(messageRow.id),
      })

      sent += 1
      console.log(`✅ Scheduled xabar yuborildi: id=${messageRow.id}, patient_id=${messageRow.patient_id}`)
    } catch (error) {
      const reason = error?.message ? String(error.message).slice(0, 300) : 'SEND_FAILED'
      await updateMessageStatus({
        id: messageRow.id,
        status: 'failed',
        failureReason: reason
      })
      failed += 1
      console.error(`❌ Scheduled xabar yuborilmadi: id=${messageRow.id}`, reason)
    }
  }

  return {
    processed: pendingMessages.length,
    sent,
    failed
  }
}

async function processTreatmentPlanReminders() {
  if (!botInstance) {
    throw new Error('Bot instance mavjud emas')
  }

  const nowIso = new Date().toISOString()
  const duePlans = await getDueTreatmentPlanReminders({ nowIso, limit: 50 })

  if (duePlans.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const plan of duePlans) {
    try {
      const patient = await getPatientById(plan.patient_id).catch(() => null)
      const phone = patient?.phone || null
      const chatId = await getTelegramChatId(plan.patient_id)
      const telegramMessage = buildTreatmentPlanReminderMessage(plan)

      let smsOk = false
      let telegramOk = false
      let lastError = null

      if (isSmsConfigured() && phone) {
        const smsResult = await sendTreatmentPlanReminderSms({
          phone,
          plan: {
            ...plan,
            patientName: patient?.full_name,
          },
        })
        smsOk = Boolean(smsResult?.success)
        if (!smsOk) {
          lastError = smsResult?.error || 'SMS_SEND_FAILED'
          console.error(`❌ Treatment plan SMS xato: plan_id=${plan.id}`, lastError)
        }
      }

      if (chatId) {
        try {
          await botInstance.sendMessage(chatId, telegramMessage)
          telegramOk = true
        } catch (sendError) {
          lastError = sendError?.message || 'TELEGRAM_SEND_FAILED'
        }
      }

      if (!smsOk && !telegramOk) {
        await updateTreatmentPlanReminderStatus({
          id: plan.id,
          status: 'failed',
        })
        failed += 1
        console.warn(
          `⚠️ Davolash rejasi eslatmasi yuborilmadi: plan_id=${plan.id}`,
          lastError || (!phone ? 'PHONE_AND_CHAT_MISSING' : 'SEND_FAILED'),
        )
        continue
      }

      await updateTreatmentPlanReminderStatus({
        id: plan.id,
        status: 'sent',
        sentAt: new Date().toISOString(),
      })

      await insertNotificationEvent({
        patient_id: plan.patient_id,
        clinic_id: plan.clinic_id || patient?.clinic_id || null,
        event_type: 'treatment_plan',
        source_table: 'treatment_plans',
        source_id: String(plan.id),
      })

      sent += 1
      const channels = [smsOk ? 'sms' : null, telegramOk ? 'telegram' : null].filter(Boolean).join('+')
      console.log(`✅ Davolash rejasi eslatmasi yuborildi (${channels}): plan_id=${plan.id}, patient_id=${plan.patient_id}`)
    } catch (error) {
      const reason = error?.message ? String(error.message).slice(0, 300) : 'SEND_FAILED'
      await updateTreatmentPlanReminderStatus({
        id: plan.id,
        status: 'failed',
      })
      failed += 1
      console.error(`❌ Davolash rejasi eslatmasi yuborilmadi: plan_id=${plan.id}`, reason)
    }
  }

  return {
    processed: duePlans.length,
    sent,
    failed,
  }
}

async function runSchedulerTick() {
  const scheduled = await processPendingMessages()
  const plans = await processTreatmentPlanReminders()
  return {
    scheduled,
    plans,
    processed: scheduled.processed + plans.processed,
    sent: scheduled.sent + plans.sent,
    failed: scheduled.failed + plans.failed,
  }
}

function startMessageScheduler(bot, options = {}) {
  if (schedulerRunning) {
    return
  }

  botInstance = bot
  intervalMs = Number(options.intervalMs) || 30000

  schedulerInterval = setInterval(async () => {
    try {
      const result = await runSchedulerTick()
      lastRunAt = new Date().toISOString()
      lastError = null

      if (result.processed > 0) {
        console.log(`📬 Scheduler: processed=${result.processed}, sent=${result.sent}, failed=${result.failed} (scheduled=${result.scheduled.processed}, plans=${result.plans.processed})`)
      }
    } catch (error) {
      lastError = error.message || 'UNKNOWN_ERROR'
      lastRunAt = new Date().toISOString()
      console.error('❌ Message scheduler error:', error.message)
    }
  }, intervalMs)

  schedulerRunning = true
  console.log(`⏱️ Message scheduler ishga tushdi (interval: ${intervalMs}ms)`)
}

function stopMessageScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  schedulerRunning = false
  console.log('🛑 Message scheduler to‘xtatildi')
}

function getSchedulerStatus() {
  return {
    running: schedulerRunning,
    intervalMs,
    lastRunAt,
    lastError
  }
}

module.exports = {
  startMessageScheduler,
  stopMessageScheduler,
  getSchedulerStatus,
  processPendingMessages,
  processTreatmentPlanReminders,
  runSchedulerTick,
}
