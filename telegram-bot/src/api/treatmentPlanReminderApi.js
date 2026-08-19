const express = require('express')
const {
  sendTreatmentPlanReminderSms,
  getTextUpTestSmsText,
  isSmsConfigured,
} = require('../services/smsSender')
const { getPatientById } = require('../repository/patientsRepo')
const { supabase } = require('../supabase')
const { insertNotificationEvent } = require('../repository/notificationEventsRepo')

const router = express.Router()

async function getPlanById(planId) {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('id', Number(planId))
    .maybeSingle()

  if (error) {
    throw new Error(`getPlanById failed: ${error.message}`)
  }
  return data || null
}

async function markReminderStatus(planId, status) {
  const payload = {
    remind_status: status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'sent') {
    payload.remind_sent_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('treatment_plans')
    .update(payload)
    .eq('id', Number(planId))

  if (error) {
    throw new Error(`markReminderStatus failed: ${error.message}`)
  }
}

router.post('/send-reminder', async (req, res) => {
  try {
    if (!isSmsConfigured()) {
      return res.status(503).json({
        ok: false,
        error: 'SMS_NOT_CONFIGURED',
        message: 'TEXTUP_EMAIL va TEXTUP_PASSWORD .env da ko\'rsatilishi kerak.',
      })
    }

    const body = req.body || {}
    const planId = body.plan_id
    const overridePhone = body.phone

    if (!planId && !overridePhone) {
      return res.status(400).json({
        ok: false,
        error: 'PLAN_OR_PHONE_REQUIRED',
      })
    }

    const plan = planId ? await getPlanById(planId) : null
    if (planId && !plan) {
      return res.status(404).json({ ok: false, error: 'PLAN_NOT_FOUND' })
    }

    const patient = plan?.patient_id ? await getPatientById(plan.patient_id) : null
    const phone = overridePhone || patient?.phone

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: 'PHONE_REQUIRED',
        message: 'Bemor telefon raqami yo\'q. SMS yuborib bo\'lmaydi.',
      })
    }

    const result = await sendTreatmentPlanReminderSms({
      phone,
      plan: {
        ...plan,
        title: body.title || plan?.title,
        planned_date: body.planned_date || plan?.planned_date,
        patientName: body.patient_name || patient?.full_name,
      },
      text: body.text || null,
    })

    if (!result.success) {
      if (plan?.id) {
        await markReminderStatus(plan.id, 'failed').catch(() => {})
      }
      return res.status(502).json({
        ok: false,
        error: 'SMS_SEND_FAILED',
        message: result.error,
        data: result.data || null,
      })
    }

    if (plan?.id) {
      await markReminderStatus(plan.id, 'sent').catch(() => {})
      await insertNotificationEvent({
        clinic_id: plan.clinic_id || patient?.clinic_id || null,
        patient_id: plan.patient_id,
        event_type: 'treatment_plan',
        source_table: 'treatment_plans',
        source_id: String(plan.id),
      }).catch(() => {})
    }

    return res.json({
      ok: true,
      channel: 'sms',
      phone,
      plan_id: plan?.id || null,
      message: await getTextUpTestSmsText(),
    })
  } catch (error) {
    console.error('❌ POST /api/treatment-plans/send-reminder:', error.message)
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
    })
  }
})

module.exports = router
