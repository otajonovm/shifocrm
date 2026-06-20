const {
  linkLeadPatientTelegram,
  confirmLead,
  cancelLead,
} = require('../repository/leadsRepo')

function parseLeadIdFromStart(text) {
  if (!text) return null
  const parts = String(text).trim().split(/\s+/)
  if (parts.length < 2) return null

  const raw = parts.slice(1).join(' ').trim()
  const leadMatch = raw.match(/^lead[_-]?(\d+)$/i) || raw.match(/^(\d+)$/)
  if (!leadMatch) return null

  const leadId = Number(leadMatch[1])
  return Number.isFinite(leadId) ? leadId : null
}

async function handleLeadStart(bot, msg, leadId) {
  const chatId = msg.chat.id

  try {
    const { lead, patient } = await linkLeadPatientTelegram({
      leadId,
      chatId,
      fromUser: msg.from,
    })

    const when = lead.appointment_time || lead.preferred_date
      ? `${lead.preferred_date || ''} ${lead.preferred_time || ''}`.trim()
      : '—'

    await bot.sendMessage(
      chatId,
      `✅ Ro'yxatdan o'tdingiz!\n\n` +
      `👤 ${patient.full_name || lead.patient_name}\n` +
      `📱 ${patient.phone || lead.phone}\n` +
      `📅 Qabul: ${when}\n\n` +
      `Qabul vaqtiga 2 soat qolganda tasdiqlash xabari yuboriladi.`
    )
  } catch (error) {
    console.error('handleLeadStart error:', error.message)
    await bot.sendMessage(
      chatId,
      '❌ Arizani bog\'lab bo\'lmadi. Iltimos, klinikaga murojaat qiling yoki /start buyrug\'ini qayta yuboring.'
    )
  }
}

async function handleLeadCallback(bot, query) {
  const chatId = query.message?.chat?.id
  const data = String(query.data || '')

  if (!chatId || !data.startsWith('lead_')) {
    return false
  }

  const [action, idPart] = data.split(':')
  const leadId = Number(idPart)
  if (!Number.isFinite(leadId)) {
    await bot.answerCallbackQuery(query.id, { text: 'Noto\'g\'ri ma\'lumot' })
    return true
  }

  try {
    if (action === 'lead_confirm') {
      await confirmLead(leadId)
      await bot.answerCallbackQuery(query.id, { text: 'Qabul tasdiqlandi ✅' })
      await bot.editMessageText(
        `${query.message.text}\n\n✅ Siz qabulga kelasiz — rahmat!`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
        }
      )
      return true
    }

    if (action === 'lead_cancel') {
      await cancelLead(leadId)
      await bot.answerCallbackQuery(query.id, { text: 'Qabul bekor qilindi' })
      await bot.editMessageText(
        `${query.message.text}\n\n❌ Qabul bekor qilindi.`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
        }
      )
      return true
    }
  } catch (error) {
    console.error('handleLeadCallback error:', error.message)
    await bot.answerCallbackQuery(query.id, { text: 'Xatolik yuz berdi' })
    return true
  }

  return false
}

module.exports = {
  parseLeadIdFromStart,
  handleLeadStart,
  handleLeadCallback,
}
