/**
 * CSV/Excel/daftar import — parsing va dublikat tekshiruv.
 */

import * as XLSX from 'xlsx'
import { formatPhoneForStorage, normalizePhoneDigits } from '@/lib/phoneUz'
import { normalizeVisionImportRows } from '@/lib/visionImportSchema'

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

const createEmptyRow = (sourceLine) => ({
  full_name: '',
  phone: '',
  birth_date: null,
  notes: null,
  last_visit: null,
  address: null,
  tooth_notes: [],
  confidence: 1,
  _sourceLine: sourceLine,
})

/** Jadval sarlavhasi va qatorlaridan import qatorlari */
export const mapTableToImportRows = (headerCells, dataRows) => {
  const fieldByCol = headerCells.map(mapHeaderToField)
  const rows = []

  dataRows.forEach((cells, index) => {
    const lineCells = (Array.isArray(cells) ? cells : []).map((cell) => String(cell ?? '').trim())
    if (lineCells.every((cell) => !cell)) return

    const row = createEmptyRow(index + 2)

    lineCells.forEach((cell, idx) => {
      const field = fieldByCol[idx]
      if (!field || !cell) return
      row[field] = cell
    })

    if (!row.full_name && lineCells[0]) row.full_name = lineCells[0]
    if (!row.phone && lineCells[1]) row.phone = lineCells[1]

    row.phone = formatPhoneForStorage(row.phone) || row.phone
    if (row.full_name) rows.push(row)
  })

  return rows
}

export const parseCsvText = (text) => {
  const raw = String(text || '').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []

  const delimiter = detectDelimiter(lines[0])
  const headerCells = parseCsvLine(lines[0], delimiter)
  const dataRows = lines.slice(1).map((line) => parseCsvLine(line, delimiter))

  return mapTableToImportRows(headerCells, dataRows)
}

export const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames?.[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (!Array.isArray(table) || !table.length) return []

  const headerCells = (table[0] || []).map((cell) => String(cell ?? ''))
  const dataRows = table.slice(1)

  return mapTableToImportRows(headerCells, dataRows)
}

export const isExcelFileName = (name) => /\.(xlsx|xls)$/i.test(String(name || ''))

export const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })

export const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
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

/** Daftar rasmini AI uchun siqish (tezroq yuborish, aniqroq OCR) */
export const compressImageForVision = (file, { maxWidth = 1800, maxHeight = 1800, quality = 0.88 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Faqat rasm fayllar qabul qilinadi (JPG, PNG, WEBP)'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      const scale = Math.min(1, maxWidth / width, maxHeight / height)
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        readFileAsBase64(file).then((base64) => resolve({
          base64,
          mimeType: file.type || 'image/jpeg',
        })).catch(reject)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mimeType, quality)
      resolve({
        base64: dataUrl.split(',')[1],
        mimeType,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Rasm ochib bo\'lmadi. JPG yoki PNG formatda yuklang.'))
    }

    img.src = url
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

export const normalizeVisionRows = (visionRows = []) => {
  const normalized = normalizeVisionImportRows(visionRows)
  return normalized.map((row) => ({
    ...row,
    phone: formatPhoneForStorage(row.phone) || row.phone,
  }))
}
