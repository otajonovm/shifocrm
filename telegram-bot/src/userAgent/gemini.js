const { loadClinicContext } = require('./clinicContext')

const MODEL = process.env.GEMINI_MODEL
  || process.env.VITE_VISION_MODEL
  || 'gemini-flash-latest'

function extractText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || []
  return parts.map((part) => part.text || '').join('').trim()
}

function parseModelJson(text) {
  const raw = String(text || '').trim()
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : raw
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new Error('GEMINI_JSON')
  }
  return JSON.parse(body.slice(start, end + 1))
}

async function requestGemini(apiKey, prompt, withJsonMode) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const generationConfig = { temperature: 0.4 }
  if (withJsonMode) generationConfig.responseMimeType = 'application/json'

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    const error = new Error(`Gemini ${response.status}`)
    error.status = response.status
    error.body = raw.slice(0, 500)
    throw error
  }

  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    const error = new Error('GEMINI_RESPONSE')
    error.body = raw.slice(0, 500)
    throw error
  }

  return parseModelJson(extractText(payload))
}

function buildPrompt({ clinic, history, text, today, known }) {
  const transcript = history
    .slice(-8)
    .map((item) => `${item.role === 'assistant' ? 'Agent' : 'Bemor'}: ${item.text}`)
    .join('\n')

  const emergency = [
    clinic.phone ? `Tezkor telefon: ${clinic.phone}` : '',
    clinic.address ? `Manzil: ${clinic.address}` : 'Manzil kiritilmagan, bemorni klinikaga hozir kelishga unda.',
  ].filter(Boolean).join('. ')

  return [
    `Siz — "${clinic.name}" stomatologiya klinikasining professional, xushmuomala va g'amxo'r virtual administratorisiz.`,
    'Vazifa: xizmatlar haqida ma\'lumot berish, savollarga javob berish va bemorni qabulga yozish.',
    'Til: bemor qaysi tilda yozsa, reply shu tilda (o\'zbek yoki rus).',
    'Ohang: muloyim, qisqa, empatik. Og\'riq yoki qo\'rquv bo\'lsa hamdardlik bildiring. Javob keyingi bitta qadamga undasin.',
    'Cheklov: tashxis qo\'yma. Dori, antibiotik va og\'riq qoldiruvchi tavsiya qilma.',
    'Narx: faqat quyidagi boshlang\'ich narx. Yakuniy narx emas. Narxdan keyin shifokor ko\'rigidan so\'ng aniqlanishini ayt.',
    'Ro\'yxatda yo\'q xizmatga aniq narx qo\'yma.',
    `Xizmatlar:\n${clinic.serviceText}`,
    `Shoshilinch (yuz shishi, to'xtovsiz kuchli og'riq, qonash): urgent=true. reply da zudlik bilan qo'ng'iroq yoki klinikaga kelishni ayt. ${emergency}`,
    'Qabulga yozishda maydonlarni birma-bir so\'ra, barchasini bitta xabarda talab qilma.',
    'Tartib: 1) shikoyat yoki xizmat, 2) shifokor ismi (agar bir nechta bo\'lsa), 3) kun va vaqt, 4) ism va telefon.',
    clinic.doctors.length > 1
      ? `Shifokorlar: ${clinic.doctors.map((doctor) => doctor.name).join(', ')}. Bemor shifokor aytsa doctor maydoniga to\'liq ismni yoz. Aniqlanmasa bo\'sh qoldir va reply da shu ro\'yxatdan birini tanlashni so\'ra.`
      : `Bitta shifokor: ${clinic.doctors[0]?.name || ''}. doctor maydoniga shu ismni yoz.`,
    'Bemor bir xabarda hammasini bersa, qayta so\'rama.',
    `Bugun (Asia/Tashkent): ${today}.`,
    'Sana YYYY-MM-DD. Aniq soat bo\'lsa time HH:MM. Ertalab bo\'lsa period=morning va time bo\'sh. Tushdan keyin period=afternoon va time bo\'sh.',
    'Bo\'sh vaqtni o\'zing taklif qilma va slot o\'ylab topma.',
    'Bilmaydigan maydon bo\'sh qolsin.',
    `Ma'lum: ism=${known.name || ''}, telefon=${known.phone || ''}, sana=${known.date || ''}, vaqt=${known.time || ''}, xizmat=${known.service || ''}, shikoyat=${known.notes || ''}, shifokor=${known.doctor || ''}.`,
    'JSON kalitlari: name, phone, date, time, period, service, notes, doctor, lang, urgent, reply.',
    'lang: uz yoki ru. urgent: true yoki false. period: morning, afternoon yoki bo\'sh.',
    'reply: bemorga ko\'rinadigan javob. Hammasi yig\'ilsa reply bo\'sh, chunki vaqtni tizim tasdiqlaydi.',
    transcript ? `Oldingi suhbat:\n${transcript}` : '',
    `Yangi xabar: ${text}`,
  ].filter(Boolean).join('\n')
}

async function extractPatientFields({ history = [], text, today, known = {} }) {
  const apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
    const error = new Error('GEMINI_KEY_MISSING')
    error.code = 'GEMINI_KEY_MISSING'
    throw error
  }

  const clinic = await loadClinicContext()
  const prompt = buildPrompt({ clinic, history, text, today, known })

  try {
    return await requestGemini(apiKey, prompt, true)
  } catch (error) {
    if (error.status && error.status !== 400) {
      console.error('Gemini javobi:', error.status, error.body || error.message)
      throw error
    }
    console.error('Gemini JSON rejimi rad etildi, oddiy so\'rov:', error.body || error.message)
    return requestGemini(apiKey, prompt, false)
  }
}

module.exports = {
  extractPatientFields,
}
