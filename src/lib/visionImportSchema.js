/**
 * Daftar rasm import — structured JSON schema va normalizatsiya.
 */

export const VISION_IMPORT_ROW_SCHEMA = {
  type: 'object',
  properties: {
    full_name: { type: 'string' },
    phone: { type: 'string' },
    birth_date: { type: ['string', 'null'] },
    address: { type: ['string', 'null'] },
    diagnosis: { type: ['string', 'null'] },
    notes: { type: ['string', 'null'] },
    last_visit: { type: ['string', 'null'] },
    confidence: { type: 'number' },
    tooth_notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tooth_id: { type: 'string' },
          condition: { type: 'string' },
          planned_service: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
    visit_history: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          visit_date: { type: 'string' },
          start_time: { type: ['string', 'null'] },
          diagnosis: { type: ['string', 'null'] },
          treatments: { type: 'array', items: { type: 'string' } },
          service_name: { type: ['string', 'null'] },
          price: { type: ['number', 'null'] },
          paid_amount: { type: ['number', 'null'] },
          notes: { type: ['string', 'null'] },
        },
      },
    },
  },
  required: ['full_name'],
}

export const DENTAL_LEDGER_PROMPT = `Siz stomatologik klinika daftarini o'qiydigan AI ekspertsiz.
Rasm yoki skanerdagi bemorlar jadvalini JSON massiv formatida qaytaring.

Har bir bemor uchun:
{
  "full_name": "string",
  "phone": "string (+998...)",
  "birth_date": "YYYY-MM-DD yoki null",
  "address": "string yoki null",
  "diagnosis": "tashxis yoki null",
  "notes": "izoh yoki null",
  "last_visit": "YYYY-MM-DD yoki null",
  "confidence": 0.0-1.0,
  "tooth_notes": [
    { "tooth_id": "11-48 FDI", "condition": "caries|filled|missing|crown|root_canal", "planned_service": "string", "note": "string" }
  ],
  "visit_history": [
    {
      "visit_date": "YYYY-MM-DD",
      "start_time": "HH:MM yoki null",
      "diagnosis": "tashxis",
      "treatments": ["muolaja1", "muolaja2"],
      "service_name": "asosiy xizmat nomi",
      "price": 150000,
      "paid_amount": 150000,
      "notes": "izoh"
    }
  ]
}

QOIDALAR:
- Faqat JSON massiv qaytaring.
- Ustunlar: Ism, FIO, Telefon, Tashxis, Muolaja, Narx, Sana, To'lov.
- Narxlar butun son (so'm), nuqtasiz.
- visit_history: daftardagi har bir tashrif/muolaja qatori.
- Agar faqat bitta sana bo'lsa — visit_history ga bitta element qiling.
- Telefon +998 formatida.
- Bo'sh qatorlarni qo'shmang.`

const parseAmount = (value) => {
  if (value == null || value === '') return null
  const n = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

const normalizeVisitEntry = (visit = {}) => {
  const treatments = Array.isArray(visit.treatments)
    ? visit.treatments.map((t) => String(t || '').trim()).filter(Boolean)
    : []

  const serviceName = String(
    visit.service_name || treatments[0] || ''
  ).trim() || null

  const price = parseAmount(visit.price)
  const paidAmount = parseAmount(visit.paid_amount)

  return {
    visit_date: visit.visit_date || visit.date || null,
    start_time: visit.start_time || visit.time || null,
    diagnosis: visit.diagnosis || null,
    treatments,
    service_name: serviceName,
    price,
    paid_amount: paidAmount ?? (price != null ? price : null),
    notes: visit.notes || null,
  }
}

export const normalizeVisionImportRow = (row, idx = 0) => {
  const visitHistory = (Array.isArray(row.visit_history) ? row.visit_history : [])
    .map(normalizeVisitEntry)
    .filter((v) => v.visit_date || v.service_name || v.price != null)

  if (!visitHistory.length && row.last_visit) {
    visitHistory.push(normalizeVisitEntry({
      visit_date: row.last_visit,
      service_name: row.service_name || null,
      price: row.price,
      paid_amount: row.paid_amount,
      diagnosis: row.diagnosis,
      notes: row.notes,
    }))
  }

  const totalPrice = visitHistory.reduce((sum, v) => sum + (v.price || 0), 0)
  const totalPaid = visitHistory.reduce((sum, v) => sum + (v.paid_amount || 0), 0)

  return {
    full_name: String(row.full_name || row.name || '').trim(),
    phone: String(row.phone || '').trim(),
    birth_date: row.birth_date || null,
    address: row.address || null,
    diagnosis: row.diagnosis || null,
    notes: row.notes || null,
    last_visit: row.last_visit || visitHistory[0]?.visit_date || null,
    tooth_notes: Array.isArray(row.tooth_notes) ? row.tooth_notes : [],
    visit_history: visitHistory,
    total_price: totalPrice,
    total_paid: totalPaid,
    confidence: Number(row.confidence) || 0.7,
    _sourceLine: row._sourceLine || idx + 1,
  }
}

export const normalizeVisionImportRows = (rows = []) =>
  (Array.isArray(rows) ? rows : [])
    .map((row, idx) => normalizeVisionImportRow(row, idx))
    .filter((r) => r.full_name)
