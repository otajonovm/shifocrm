const fs = require('fs')
const path = require('path')
const { extractPatientFields } = require('./gemini')
const { loadClinicContext } = require('./clinicContext')
const {
  tashkentParts,
  normalizePhone,
  findSlotOffer,
  bookSlot,
  listTodayVisits,
} = require('./booking')

const DATA_DIR = path.resolve(__dirname, '../../data')
const DIALOG_FILE = path.join(DATA_DIR, 'dialogs.json')
const locks = new Map()

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DIALOG_FILE)) {
    fs.writeFileSync(DIALOG_FILE, '{}\n', 'utf8')
  }
}

function readAll() {
  ensureStore()
  try {
    return JSON.parse(fs.readFileSync(DIALOG_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeAll(data) {
  ensureStore()
  fs.writeFileSync(DIALOG_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function blankDialog(telegramUserId) {
  return {
    telegramUserId: String(telegramUserId),
    name: '',
    phone: '',
    date: '',
    time: '',
    service: '',
    notes: '',
    doctorId: null,
    doctorName: '',
    lang: 'uz',
    urgent: false,
    history: [],
    pending: null,
    from: null,
  }
}

function getDialog(telegramUserId) {
  const all = readAll()
  return all[String(telegramUserId)] || blankDialog(telegramUserId)
}

function saveDialog(dialog) {
  const all = readAll()
  all[String(dialog.telegramUserId)] = dialog
  writeAll(all)
}

function withLock(id, fn) {
  const key = String(id)
  const previous = locks.get(key) || Promise.resolve()
  const run = previous.then(fn, fn)
  locks.set(key, run.then(() => {}, () => {}))
  return run
}

function formatDate(dateText) {
  const [year, month, day] = String(dateText || '').split('-')
  if (!year || !month || !day) return dateText
  return `${day}.${month}.${year}`
}

function normalizeDate(value, today) {
  const text = String(value || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/)
  if (!match) return ''
  const day = Number(match[1])
  const month = Number(match[2])
  let year = match[3] ? Number(match[3]) : Number(String(today).slice(0, 4))
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function normalizeTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})[:.](\d{2})$/)
  if (!match) return ''
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return ''
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isYes(text) {
  return /^(ha|ha+|yes|ok|okey|tasdiq|roziman|bo['’]?ladi|boladi|да|давай|хорошо)$/i.test(String(text || '').trim())
}

function isNo(text) {
  return /^(yo['’]?q|yoq|bekor|no|cancel|нет|не надо)$/i.test(String(text || '').trim())
}

function isRussian(dialog) {
  return dialog.lang === 'ru'
}

function foldName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/dr\.?/g, ' ')
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchDoctor(doctors, text) {
  const query = foldName(text)
  if (!query || query.length < 2) return { doctor: null, ambiguous: [] }
  const scored = doctors.filter((doctor) => {
    const name = foldName(doctor.name)
    if (!name) return false
    if (name === query || name.includes(query) || query.includes(name)) return true
    const parts = name.split(' ').filter((part) => part.length > 2)
    return parts.some((part) => query.includes(part))
  })
  if (scored.length === 1) return { doctor: scored[0], ambiguous: [] }
  return { doctor: null, ambiguous: scored }
}

function remember(dialog, role, text) {
  dialog.history.push({ role, text: String(text || '').slice(0, 500) })
  dialog.history = dialog.history.slice(-12)
}

function confirmText(dialog, slot) {
  if (isRussian(dialog)) {
    return [
      'Записать вас на это время?',
      dialog.service ? `Услуга: ${dialog.service}` : '',
      `Имя: ${dialog.name}`,
      `Телефон: ${dialog.phone}`,
      `Врач: ${slot.doctorName}`,
      `Дата: ${formatDate(slot.date)} ${slot.start}–${slot.end}`,
      '',
      'Напишите «да» или назовите другое время.',
    ].filter(Boolean).join('\n')
  }
  return [
    'Shu vaqtga yozib qo\'yaymi?',
    dialog.service ? `Xizmat: ${dialog.service}` : '',
    `Ism: ${dialog.name}`,
    `Telefon: ${dialog.phone}`,
    `Shifokor: ${slot.doctorName}`,
    `Sana: ${formatDate(slot.date)} ${slot.start}–${slot.end}`,
    '',
    'Ha deb yozing yoki boshqa vaqt ayting.',
  ].filter(Boolean).join('\n')
}

function alternativesText(dialog, options) {
  const lines = options.map((slot, index) => (
    `${index + 1}) ${formatDate(slot.date)} ${slot.start}–${slot.end} — ${slot.doctorName}`
  ))
  if (isRussian(dialog)) {
    const ruLines = options.map((slot, index) => (
      `${index + 1}) ${formatDate(slot.date)} ${slot.start}–${slot.end} — ${slot.doctorName}`
    ))
    return [
      'Это время занято. Ближайшие свободные окна:',
      ...ruLines,
      '',
      'Напишите номер или другое время.',
    ].join('\n')
  }
  return [
    'Bu vaqt band. Eng yaqin bo\'sh vaqtlar:',
    ...lines,
    '',
    'Raqamini yozing yoki boshqa vaqt ayting.',
  ].join('\n')
}

function successText(dialog, slot) {
  if (isRussian(dialog)) {
    return [
      'Вы записаны. Итоговая стоимость уточняется на осмотре.',
      dialog.service ? `Услуга: ${dialog.service}` : '',
      `Имя: ${dialog.name}`,
      `Телефон: ${dialog.phone}`,
      `Врач: ${slot.doctorName}`,
      `Дата: ${formatDate(slot.date)} ${slot.start}–${slot.end}`,
    ].filter(Boolean).join('\n')
  }
  return [
    'Yozib qo\'ydim. Yakuniy narx shifokor ko\'rigidan so\'ng aniqlanadi.',
    dialog.service ? `Xizmat: ${dialog.service}` : '',
    `Ism: ${dialog.name}`,
    `Telefon: ${dialog.phone}`,
    `Shifokor: ${slot.doctorName}`,
    `Sana: ${formatDate(slot.date)} ${slot.start}–${slot.end}`,
  ].filter(Boolean).join('\n')
}

function offerFailureText(dialog, reason) {
  const ru = isRussian(dialog)
  if (reason === 'no_clinic') return ru ? 'Клиника не настроена.' : 'Klinika sozlanmagan. Administrator bilan bog\'laning.'
  if (reason === 'no_doctors') return ru ? 'Сейчас нет врача для записи.' : 'Hozircha shifokor topilmadi. Administrator bilan bog\'laning.'
  if (reason === 'no_schedule') return ru ? 'Расписание врача не заполнено.' : 'Shifokor ish jadvali kiritilmagan. Administrator bilan bog\'laning.'
  if (reason === 'past') return ru ? 'Это время уже прошло. Назовите другой день.' : 'Bu vaqt o\'tib ketgan. Bugun yoki keyingi kunlardan vaqt ayting.'
  if (reason === 'no_slots') return ru ? 'На ближайшие 14 дней свободного времени нет. Назовите другой день.' : 'Yaqin 14 kunda bo\'sh vaqt yo\'q. Boshqa kun ayting.'
  return ru ? 'Свободного времени не нашёл. Назовите другое время.' : 'Hozircha bo\'sh vaqt topilmadi. Boshqa vaqt ayting.'
}

async function proposeSlots(dialog) {
  const offer = await findSlotOffer({
    date: dialog.date,
    time: dialog.time,
    doctorId: dialog.doctorId,
  })
  if (offer.reason === 'exact') {
    dialog.pending = { type: 'confirm', slot: offer.slot }
    return confirmText(dialog, offer.slot)
  }
  if (offer.reason === 'alternatives' && offer.alternatives?.length) {
    dialog.pending = { type: 'choose', options: offer.alternatives }
    return alternativesText(dialog, offer.alternatives)
  }
  dialog.pending = null
  return offerFailureText(dialog, offer.reason)
}

async function confirmBooking(dialog) {
  const slot = dialog.pending?.slot
  if (!slot) return 'Avval vaqtni ayting: ism, telefon va qachon kelmoqchisiz.'
  try {
    await bookSlot({
      slot,
      name: dialog.name,
      phone: dialog.phone,
      chatId: dialog.telegramUserId,
      fromUser: dialog.from,
      serviceName: dialog.service || null,
      notes: leadNotes(dialog),
    })
  } catch (error) {
    console.error('Qabul yozilmadi:', error.message)
    if (/exclusion|slot_range|duplicate|band/i.test(error.message)) {
      dialog.pending = null
      dialog.time = ''
      return 'Bu vaqt hozir band bo\'lib qoldi. Boshqa vaqt ayting.'
    }
    return 'Yozib bo\'lmadi. Iltimos, birozdan keyin qayta urinib ko\'ring.'
  }

  console.log(JSON.stringify({
    patient_name: dialog.name,
    phone: dialog.phone,
    service_type: dialog.service || '',
    preferred_time: `${slot.date} ${slot.start}`,
    notes: dialog.notes || '',
  }))

  const reply = successText(dialog, slot)
  const fresh = blankDialog(dialog.telegramUserId)
  Object.assign(dialog, fresh)
  return reply
}

function leadNotes(dialog) {
  return [
    dialog.service ? `Xizmat: ${dialog.service}` : '',
    dialog.notes ? `Shikoyat: ${dialog.notes}` : '',
    'Telegram shaxsiy agent orqali yozildi',
  ].filter(Boolean).join('\n')
}

function applyExtraction(dialog, extracted, today) {
  const name = String(extracted?.name || '').trim()
  if (name.length >= 2) dialog.name = name.slice(0, 120)

  const phone = normalizePhone(extracted?.phone)
  if (phone) dialog.phone = phone

  const date = normalizeDate(extracted?.date, today)
  if (date) dialog.date = date

  const time = normalizeTime(extracted?.time)
  const period = String(extracted?.period || '').toLowerCase()
  if (time) dialog.time = time
  else if (!dialog.time && (period === 'morning' || period === 'ertalab')) dialog.time = '09:00'
  else if (!dialog.time && (period === 'afternoon' || period === 'tushdan_keyin' || period === 'tushdan keyin')) dialog.time = '14:00'

  const service = String(extracted?.service || '').trim()
  if (service.length >= 2) dialog.service = service.slice(0, 160)

  const notes = String(extracted?.notes || '').trim()
  if (notes.length >= 2) dialog.notes = notes.slice(0, 400)

  const lang = String(extracted?.lang || '').toLowerCase()
  if (lang === 'ru' || lang === 'uz') dialog.lang = lang

  if (extracted?.urgent === true || extracted?.urgent === 'true') dialog.urgent = true
}

function assignDoctor(dialog, doctors, extracted, text) {
  if (doctors.length === 1) {
    dialog.doctorId = doctors[0].id
    dialog.doctorName = doctors[0].name
    return { ambiguous: [] }
  }

  const fromField = matchDoctor(doctors, extracted?.doctor)
  const fromText = dialog.doctorId ? { doctor: null, ambiguous: [] } : matchDoctor(doctors, text)
  const doctor = fromField.doctor || fromText.doctor
  const ambiguous = doctor ? [] : (fromField.ambiguous.length ? fromField.ambiguous : fromText.ambiguous)
  if (!doctor) return { ambiguous }
  if (Number(dialog.doctorId) !== Number(doctor.id)) {
    dialog.pending = null
  }
  dialog.doctorId = doctor.id
  dialog.doctorName = doctor.name
  return { ambiguous: [] }
}

function missingQuestion(dialog, modelReply, doctors) {
  const reply = String(modelReply || '').trim()
  const needsDoctor = doctors.length > 1 && !dialog.doctorId
  if (reply && !(needsDoctor && !/shifokor|врач/i.test(reply))) return reply.slice(0, 700)
  const ru = isRussian(dialog)
  const names = doctors.map((doctor) => doctor.name).join(', ')
  if (!dialog.service && !dialog.notes) {
    return ru
      ? 'Что вас беспокоит или какая услуга нужна?'
      : 'Nima bezovta qilyapti yoki qanday xizmat kerak?'
  }
  if (needsDoctor) {
    return ru
      ? `К какому врачу записать? ${names}`
      : `Qaysi shifokor qabuliga yozay? ${names}`
  }
  if (!dialog.date || !dialog.time) {
    return ru
      ? 'Какой день и время удобны: утро, после обеда или точный час?'
      : 'Qaysi kun va vaqt qulay: ertalab, tushdan keyin yoki aniq soat?'
  }
  if (!dialog.name) return ru ? 'Как вас зовут?' : 'Ismingizni yozing.'
  if (!dialog.phone) return ru ? 'Оставьте номер телефона, например 901234567.' : 'Telefon raqamingizni yozing. Masalan: 901234567.'
  return ru ? 'Напишите имя, телефон и удобное время.' : 'Ism, telefon va vaqtni yozing.'
}

async function withEmergency(dialog, reply) {
  if (!dialog.urgent) return reply
  const clinic = await loadClinicContext()
  const marker = clinic.address || clinic.phone
  if (marker && String(reply).includes(marker)) return reply
  const line = isRussian(dialog)
    ? `Это срочно. ${clinic.phone ? `Позвоните: ${clinic.phone}. ` : ''}Приезжайте в клинику${clinic.address ? `: ${clinic.address}` : ''}.`
    : `Bu shoshilinch. ${clinic.phone ? `Qo'ng'iroq qiling: ${clinic.phone}. ` : ''}Klinikaga hozir keling${clinic.address ? `: ${clinic.address}` : ''}.`
  return `${line}\n\n${reply}`.trim()
}

async function handlePatientMessage({ telegramUserId, text, from }) {
  return withLock(telegramUserId, async () => {
    const dialog = getDialog(telegramUserId)
    dialog.from = {
      username: from?.username || null,
      firstName: from?.firstName || from?.first_name || null,
      lastName: from?.lastName || from?.last_name || null,
    }
    const trimmed = String(text || '').trim()
    remember(dialog, 'user', trimmed)

    let reply = ''

    if (dialog.pending?.type === 'choose') {
      const index = Number(trimmed)
      const option = dialog.pending.options?.[index - 1]
      if (index >= 1 && option) {
        dialog.date = option.date
        dialog.time = option.start
        dialog.pending = { type: 'confirm', slot: option }
        reply = confirmText(dialog, option)
        remember(dialog, 'assistant', reply)
        saveDialog(dialog)
        return reply
      }
    }

    if (dialog.pending?.type === 'confirm') {
      if (isYes(trimmed)) {
        reply = await confirmBooking(dialog)
        remember(dialog, 'assistant', reply)
        saveDialog(dialog)
        return reply
      }
      if (isNo(trimmed)) {
        dialog.pending = null
        reply = 'Yozilmadi. Boshqa kun va vaqt ayting.'
        remember(dialog, 'assistant', reply)
        saveDialog(dialog)
        return reply
      }
    }

    const today = tashkentParts().date
    let extracted
    try {
      extracted = await extractPatientFields({
        history: dialog.history.slice(0, -1),
        text: trimmed,
        today,
        known: {
          name: dialog.name,
          phone: dialog.phone,
          date: dialog.date,
          time: dialog.time,
          service: dialog.service,
          notes: dialog.notes,
          doctor: dialog.doctorName,
        },
      })
    } catch (error) {
      console.error('Gemini xato:', error.status || '', error.body || error.message)
      reply = 'Hozircha xabaringizni tushunolmadim. Birozdan keyin qayta yozing.'
      remember(dialog, 'assistant', reply)
      saveDialog(dialog)
      return reply
    }

    const previousDate = dialog.date
    const previousTime = dialog.time
    applyExtraction(dialog, extracted, today)
    if (dialog.date !== previousDate || dialog.time !== previousTime) {
      dialog.pending = null
    }

    const clinic = await loadClinicContext()
    const matched = assignDoctor(dialog, clinic.doctors || [], extracted, trimmed)
    if (matched.ambiguous.length > 1) {
      const names = matched.ambiguous.map((doctor) => doctor.name).join(', ')
      reply = isRussian(dialog)
        ? `Уточните врача: ${names}`
        : `Qaysi shifokorni nazarda tutdingiz? ${names}`
      remember(dialog, 'assistant', reply)
      saveDialog(dialog)
      return reply
    }

    if (extracted?.phone && !normalizePhone(extracted.phone) && !dialog.phone) {
      reply = 'Telefon noto\'g\'ri. 9 ta raqam yozing, masalan 901234567.'
      remember(dialog, 'assistant', reply)
      saveDialog(dialog)
      return reply
    }

    const needsDoctor = (clinic.doctors || []).length > 1
    const ready = Boolean(dialog.service || dialog.notes)
      && dialog.doctorId
      && dialog.name
      && dialog.phone
      && dialog.date
      && dialog.time
      && (!needsDoctor || dialog.doctorName)
    if (!ready) {
      reply = await withEmergency(dialog, missingQuestion(dialog, extracted?.reply, clinic.doctors || []))
      remember(dialog, 'assistant', reply)
      saveDialog(dialog)
      return reply
    }

    try {
      reply = await proposeSlots(dialog)
    } catch (error) {
      console.error('Slot hisoblash:', error.message)
      reply = 'Bo\'sh vaqtni hozir tekshirib bo\'lmadi. Birozdan keyin qayta yozing.'
    }

    reply = await withEmergency(dialog, reply)

    remember(dialog, 'assistant', reply)
    saveDialog(dialog)
    return reply
  })
}

async function handleAdminToday() {
  try {
    const result = await listTodayVisits()
    if (result.error === 'no_clinic') {
      return 'Klinika sozlanmagan. TELEGRAM_DEFAULT_CLINIC_ID ni .env ga yozing.'
    }
    const header = `Bugungi qabullar (${formatDate(result.date)}):`
    if (!result.rows.length) return `${header}\nHozircha yo'q.`
    const lines = result.rows.map((row) => (
      `${row.time} — ${row.patientName} — ${row.phone} — ${row.doctorName}`
    ))
    return [header, ...lines].join('\n')
  } catch (error) {
    console.error('Admin /bugun:', error.message)
    return 'Bugungi qabullarni o\'qib bo\'lmadi.'
  }
}

module.exports = {
  handlePatientMessage,
  handleAdminToday,
}
