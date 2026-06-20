const { supabase } = require('../supabase')

async function getDueTreatmentPlanReminders({ nowIso, limit = 50 }) {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('remind_status', 'pending')
    .not('remind_at', 'is', null)
    .lte('remind_at', nowIso)
    .order('remind_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`getDueTreatmentPlanReminders failed: ${error.message}`)
  }

  return data || []
}

async function updateTreatmentPlanReminderStatus({
  id,
  status,
  sentAt = null,
}) {
  const payload = {
    remind_status: status,
    remind_sent_at: sentAt,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('treatment_plans')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error(`updateTreatmentPlanReminderStatus failed: ${error.message}`)
  }

  return true
}

function buildTreatmentPlanReminderMessage(plan) {
  const title = plan.title || 'Davolash rejasi'
  const date = plan.planned_date
    ? new Date(`${plan.planned_date}T12:00:00`).toLocaleDateString('uz-UZ')
    : '—'
  const cost = plan.estimated_cost
    ? `${Number(plan.estimated_cost).toLocaleString('uz-UZ')} so'm`
    : null

  const lines = [
    '🔔 Davolash rejasi eslatmasi',
    '',
    `📋 ${title}`,
    `📅 Reja sanasi: ${date}`,
  ]

  if (cost) lines.push(`💰 Taxminiy narx: ${cost}`)
  if (plan.notes) lines.push('', plan.notes)

  lines.push('', 'Savollar bo\'lsa, klinikaga murojaat qiling.')
  return lines.join('\n')
}

module.exports = {
  getDueTreatmentPlanReminders,
  updateTreatmentPlanReminderStatus,
  buildTreatmentPlanReminderMessage,
}
