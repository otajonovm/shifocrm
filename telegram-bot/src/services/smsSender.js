const path = require('path')
const { pathToFileURL } = require('url')

const SMS_SERVICE_PATH = path.resolve(__dirname, '../../../services/smsService.js')
const TREATMENT_SMS_PATH = path.resolve(__dirname, '../../../services/treatmentPlanSms.js')

let smsModPromise = null
let treatmentSmsModPromise = null

function loadSmsService() {
  if (!smsModPromise) {
    smsModPromise = import(pathToFileURL(SMS_SERVICE_PATH).href)
  }
  return smsModPromise
}

function loadTreatmentPlanSms() {
  if (!treatmentSmsModPromise) {
    treatmentSmsModPromise = import(pathToFileURL(TREATMENT_SMS_PATH).href)
  }
  return treatmentSmsModPromise
}

async function sendSMS(phone, text, options = {}) {
  const mod = await loadSmsService()
  return mod.sendSMS(phone, text, options)
}

async function sendTreatmentPlanReminderSms(payload) {
  const mod = await loadTreatmentPlanSms()
  return mod.sendTreatmentPlanReminderSms(payload)
}

async function getTextUpTestSmsText() {
  const mod = await loadTreatmentPlanSms()
  return mod.getTextUpTestSmsText()
}

function isSmsConfigured() {
  return Boolean(process.env.TEXTUP_EMAIL && process.env.TEXTUP_PASSWORD)
}

module.exports = {
  sendSMS,
  sendTreatmentPlanReminderSms,
  getTextUpTestSmsText,
  isSmsConfigured,
}
