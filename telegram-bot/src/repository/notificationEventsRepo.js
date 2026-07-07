/**
 * Telegram bot: notification_events yozuvlari (ROI).
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

async function insertNotificationEvent(payload) {
  if (!supabase) return null

  const row = {
    channel: 'telegram',
    sent_at: new Date().toISOString(),
    meta: {},
    ...payload,
  }

  const { data, error } = await supabase
    .from('notification_events')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.warn('notification_events insert:', error.message)
    return null
  }

  return data
}

async function updateLeadRecallAction(leadId, patientAction) {
  if (!supabase || !leadId) return null

  const { data: events } = await supabase
    .from('notification_events')
    .select('id')
    .eq('source_table', 'leads')
    .eq('source_id', String(leadId))
    .eq('event_type', 'lead_2h_recall')
    .order('sent_at', { ascending: false })
    .limit(1)

  const event = events?.[0]
  if (!event?.id) return null

  const { data, error } = await supabase
    .from('notification_events')
    .update({
      patient_action: patientAction,
      action_at: new Date().toISOString(),
    })
    .eq('id', event.id)
    .select()
    .single()

  if (error) {
    console.warn('notification_events update:', error.message)
    return null
  }

  return data
}

module.exports = {
  insertNotificationEvent,
  updateLeadRecallAction,
}
