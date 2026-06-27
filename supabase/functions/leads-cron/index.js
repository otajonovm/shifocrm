/**
 * Leads Hold Expiry + 2 soatlik eslatma (cron har 5 daqiqa)
 *
 * Supabase Dashboard → Edge Functions → leads-cron
 * Cron: */5 * * * *
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const HOLD_STATUSES = ['hold', 'new', 'contacted']
const REMINDER_STATUSES = ['hold', 'contacted', 'confirmed', 'booked', 'new']
const REMINDER_WINDOW_MINUTES = 5

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const sendTelegramInlineReminder = async ({ botToken, chatId, lead }) => {
  const when = lead.appointment_time
    ? new Date(lead.appointment_time).toLocaleString('uz-UZ', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : `${lead.preferred_date || ''} ${lead.preferred_time || ''}`.trim()

  const text =
    `⏰ Qabul eslatmasi\n\n` +
    `Salom${lead.patient_name ? `, ${lead.patient_name}` : ''}!\n` +
    `Qabulingizga 2 soat qoldi:\n📅 ${when}\n\n` +
    `Kelasizmi?`

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Ha, boraman', callback_data: `lead_confirm:${lead.id}` },
        { text: '❌ Yo\'q', callback_data: `lead_cancel:${lead.id}` },
      ],
    ],
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard,
    }),
  })

  const result = await response.json()
  if (!result.ok) {
    throw new Error(result.description || 'Telegram send failed')
  }

  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'SUPABASE env missing' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const summary = {
    expiredHolds: 0,
    remindersSent: 0,
    remindersFailed: 0,
    errors: [],
  }

  try {
    const { data: expiredCount, error: expireErr } = await supabase.rpc('cleanup_expired_lead_holds')
    if (expireErr) {
      summary.errors.push(`cleanup: ${expireErr.message}`)
    } else {
      summary.expiredHolds = Number(expiredCount) || 0
    }

    if (!botToken) {
      return json({ ok: true, ...summary, note: 'TELEGRAM_BOT_TOKEN yo\'q — eslatmalar o\'tkazib yuborildi' })
    }

    const now = new Date()
    const target = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const windowStart = new Date(target.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000)
    const windowEnd = new Date(target.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000)

    const { data: dueLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, patient_id, patient_name, phone, preferred_date, preferred_time, appointment_time, status')
      .in('status', REMINDER_STATUSES)
      .eq('reminder_2h_sent', false)
      .not('appointment_time', 'is', null)
      .gte('appointment_time', windowStart.toISOString())
      .lte('appointment_time', windowEnd.toISOString())
      .limit(50)

    if (leadsErr) {
      summary.errors.push(`leads query: ${leadsErr.message}`)
      return json({ ok: false, ...summary }, 500)
    }

    for (const lead of dueLeads || []) {
      try {
        let chatId = null

        const { data: byLead } = await supabase
          .from('lead_telegram_chats')
          .select('chat_id')
          .eq('lead_id', Number(lead.id))
          .maybeSingle()

        if (byLead?.chat_id) {
          chatId = byLead.chat_id
        }

        if (!chatId && lead.phone) {
          const { data: byPhone } = await supabase
            .from('telegram_chat_ids')
            .select('chat_id')
            .eq('phone', String(lead.phone).trim())
            .limit(1)
            .maybeSingle()
          if (byPhone?.chat_id) chatId = byPhone.chat_id
        }

        if (!chatId && lead.patient_id) {
          const { data: byPatient } = await supabase
            .from('telegram_chat_ids')
            .select('chat_id')
            .eq('patient_id', String(lead.patient_id))
            .maybeSingle()
          if (byPatient?.chat_id) chatId = byPatient.chat_id
        }

        if (!chatId) {
          summary.remindersFailed += 1
          continue
        }

        await sendTelegramInlineReminder({
          botToken,
          chatId,
          lead,
        })

        await supabase
          .from('leads')
          .update({
            reminder_2h_sent: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        summary.remindersSent += 1
      } catch (err) {
        summary.remindersFailed += 1
        summary.errors.push(`lead ${lead.id}: ${err?.message || 'send failed'}`)
      }
    }

    return json({ ok: true, ...summary })
  } catch (err) {
    return json({ ok: false, error: err?.message || 'Unknown error', ...summary }, 500)
  }
})
