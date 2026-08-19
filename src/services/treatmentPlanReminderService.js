import { sendTreatmentPlanSmsReminder } from '@/api/smsApi'
import { updatePlan } from '@/api/treatmentPlansApi'

export async function sendOrQueueTreatmentPlanReminder(plan, {
  phone,
} = {}) {
  if (!plan?.id) {
    return { ok: false, error: 'PLAN_REQUIRED' }
  }

  if (!phone) {
    return { ok: false, error: 'PHONE_REQUIRED' }
  }

  const sms = await sendTreatmentPlanSmsReminder({
    planId: plan.id,
    phone,
  })

  if (!sms.ok) {
    return {
      ok: false,
      error: sms.error,
      message: sms.message || sms.error,
    }
  }

  let updated = null
  try {
    updated = await updatePlan(plan.id, {
      remind_status: 'sent',
      remind_sent_at: new Date().toISOString(),
    })
  } catch {
    updated = { ...plan, remind_status: 'sent' }
  }

  return {
    ok: true,
    plan: updated,
    phone: sms.data?.phone || phone,
  }
}
