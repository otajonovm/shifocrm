/**
 * CSV/daftar import — parsing va dublikat tekshiruv.
 */

import { formatPhoneForStorage, normalizePhoneDigits } from '@/lib/phoneUz'

const HEADER_ALIASES = {
  full_name: ['ism', 'name', 'fio', 'f.i.o', 'bemor', 'patient', 'full_name', 'fullname', 'фио', 'имя'],
  phone: ['telefon', 'phone', 'tel', 'mobil', 'mobile', 'телефон'],
  birth_date: ['tugilgan', 'birth', 'birth_date', 'birthday', 'дата рождения'],
  notes: ['izoh', 'notes', 'note', 'comment', 'комментарий'],
  last_visit: ['oxirgi', 'last_visit', 'visit', 'tashrif'],
  address: ['manzil', 'address', 'адрес'],
}

const detectDelimiter = (line) => {
  const semicolons = (line.match(/;/g) || []).length
  const commas = (line.match(/,/g) || []).length
  return semicolons >= commas ? ';' : ','
}

const parseCsvLine = (line, delimiter) => {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

const normalizeHeader = (h) =>
  String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\ufeff/g, '')
    .replace(/[^\w\u0400-\u04FF]+/g, '_')

const mapHeaderToField = (header) => {
  const norm = normalizeHeader(header)
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => norm.includes(a.replace(/\s+/g, '_')))) {
      return field
    }
  }
  return null
}

export const parseCsvText = (text) => {
  const raw = String(text || '').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []

  const delimiter = detectDelimiter(lines[0])
  const headerCells = parseCsvLine(lines[0], delimiter)
  const fieldByCol = headerCells.map(mapHeaderToField)

  const rows = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i], delimiter)
    if (cells.every((c) => !c)) continue

    const row = {
      full_name: '',
      phone: '',
      birth_date: null,
      notes: null,
      last_visit: null,
      address: null,
      tooth_notes: [],
      confidence: 1,
      _sourceLine: i + 1,
    }

    cells.forEach((cell, idx) => {
      const field = fieldByCol[idx]
      if (!field || !cell) return
      row[field] = cell
    })

    if (!row.full_name && cells[0]) row.full_name = cells[0]
    if (!row.phone && cells[1]) row.phone = cells[1]

    row.phone = formatPhoneForStorage(row.phone) || row.phone
    if (row.full_name) rows.push(row)
  }

  return rows
}

export const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })

export const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/** Mavjud bemorlar bilan telefon bo'yicha dublikat */
export const markDuplicatePhones = (rows, existingPatients = []) => {
  const phoneSet = new Set()
  for (const p of existingPatients) {
    const digits = normalizePhoneDigits(p.phone)
    if (digits.length >= 12) phoneSet.add(digits)
  }

  const batchPhones = new Set()

  return rows.map((row) => {
    const digits = normalizePhoneDigits(row.phone)
    let duplicate = false
    let duplicateReason = null

    if (digits.length >= 12) {
      if (phoneSet.has(digits)) {
        duplicate = true
        duplicateReason = 'existing_patient'
      } else if (batchPhones.has(digits)) {
        duplicate = true
        duplicateReason = 'batch_duplicate'
      } else {
        batchPhones.add(digits)
      }
    }

    return {
      ...row,
      duplicate,
      duplicateReason,
      selected: !duplicate && Boolean(row.full_name?.trim()),
    }
  })
}

export const normalizeVisionRows = (visionRows = []) =>
  (Array.isArray(visionRows) ? visionRows : []).map((row, idx) => ({
    full_name: String(row.full_name || row.name || '').trim(),
    phone: formatPhoneForStorage(row.phone) || String(row.phone || '').trim(),
    birth_date: row.birth_date || null,
    notes: row.notes || null,
    last_visit: row.last_visit || null,
    address: row.address || null,
    tooth_notes: Array.isArray(row.tooth_notes) ? row.tooth_notes : [],
    confidence: Number(row.confidence) || 0.7,
    _sourceLine: idx + 1,
  })).filter((r) => r.full_name)
