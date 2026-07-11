/**
 * Daftar import API — CSV, Excel, Vision, batch commit.
 */

import * as XLSX from 'xlsx'
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabasePost, supabasePatchWhere } from './supabaseConfig'
import { getShifoAIApiKey } from './shifoAIApi'
import { parseVisionImagePayload } from '@/lib/visionImportCore'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { listPatients } from './patientsApi'
import { logActivity, getCurrentActor } from '@/lib/activityLog'
import { importPatientRow } from '@/services/dataImportService'
import { uploadImportImage, deleteImportImage } from './importStorageApi'
import {
  parseCsvText,
  parseExcelBuffer,
  isExcelFileName,
  readFileAsText,
  readFileAsArrayBuffer,
  compressImageForVision,
  markDuplicatePhones,
  normalizeVisionRows,
} from '@/lib/importParse'

const JOBS_TABLE = 'import_jobs'
const ROWS_TABLE = 'import_rows'

const callSupabaseVisionImport = async (payload) => {
  const url = `${SUPABASE_URL}/functions/v1/vision-import`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(
      body.error || body.message || `Vision import failed (${response.status})`
    )
    error.status = response.status
    throw error
  }

  return response.json()
}

const callLocalVisionImport = async (payload) => {
  const response = await fetch('/api/vision-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error || `Local vision import failed (${response.status})`)
  }

  return body
}

const getVisionConfig = () => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (geminiKey) {
    return {
      apiKey: geminiKey,
      apiBase: 'https://generativelanguage.googleapis.com',
      model: import.meta.env.VITE_VISION_MODEL || 'gemini-flash-latest',
    }
  }

  if (openaiKey) {
    return {
      apiKey: openaiKey,
      apiBase: 'https://api.openai.com',
      model: import.meta.env.VITE_VISION_MODEL || 'gpt-4o',
    }
  }

  return {
    apiKey: getShifoAIApiKey(),
    apiBase: import.meta.env.VITE_SHIFOAI_API_BASE || 'https://api.deepseek.com',
    model: import.meta.env.VITE_SHIFOAI_MODEL || 'deepseek-chat',
  }
}

const callDirectVisionImport = async (payload) => {
  const { apiKey, apiBase, model } = getVisionConfig()
  if (!apiKey) {
    throw new Error('Vision API kaliti (.env) sozlanmagan')
  }

  return parseVisionImagePayload({
    image_base64: payload.image_base64,
    mime_type: payload.mime_type,
    apiKey,
    apiBase,
    model,
  })
}

export const parseCsvFile = async (file) => {
  const text = await readFileAsText(file)
  return parseCsvText(text)
}

export const parseExcelFile = async (file) => {
  const buffer = await readFileAsArrayBuffer(file)
  return parseExcelBuffer(buffer)
}

export const parseSpreadsheetFile = async (file) => {
  if (isExcelFileName(file?.name)) {
    return { rows: await parseExcelFile(file), sourceType: 'excel' }
  }
  return { rows: await parseCsvFile(file), sourceType: 'csv' }
}

const hasDirectVisionKey = () =>
  Boolean(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY)

const runVisionImport = async (payload) => {
  const attempts = []

  // Dev: avval server proxy (CORS/referrer muammosiz)
  if (import.meta.env.DEV && hasDirectVisionKey()) {
    attempts.push({ name: 'local', run: () => callLocalVisionImport(payload) })
  }

  // Brauzer → Gemini/OpenAI
  if (hasDirectVisionKey()) {
    attempts.push({ name: 'direct', run: () => callDirectVisionImport(payload) })
  }

  // Supabase faqat kalit yo'q bo'lganda
  if (!hasDirectVisionKey()) {
    attempts.push({ name: 'supabase', run: () => callSupabaseVisionImport(payload) })
  }

  if (!attempts.length) {
    throw new Error(
      'Vision API kaliti sozlanmagan. .env ga VITE_GEMINI_API_KEY qo\'ying va serverni qayta ishga tushiring.'
    )
  }

  let lastError = null

  for (const attempt of attempts) {
    try {
      const data = await attempt.run()
      if ((data?.rows || []).length > 0) {
        return data
      }
      lastError = new Error('Rasmdan bemor ma\'lumoti topilmadi')
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error(
    'Daftar rasmini tahlil qilib bo\'lmadi. Surat sifatini yaxshilang yoki CSV/Excel import qiling.'
  )
}

export const parseVisionImage = async (file) => {
  const { base64, mimeType } = await compressImageForVision(file)
  const clinicId = await getCurrentClinicId()

  const uploaded = await uploadImportImage(file)

  const payload = {
    image_base64: base64,
    mime_type: mimeType,
    clinic_id: clinicId,
  }

  try {
    const data = await runVisionImport(payload)
    return normalizeVisionRows(data.rows || [])
  } finally {
    if (uploaded?.path) {
      await deleteImportImage(uploaded.path)
    }
  }
}

export const prepareImportPreview = async (rawRows) => {
  const existing = await listPatients().catch(() => [])
  return markDuplicatePhones(rawRows, existing)
}

const createImportJob = async ({ sourceType, totalRows, meta = {} }) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan')

  const actor = getCurrentActor()
  const payload = {
    clinic_id: cid,
    source_type: sourceType,
    status: 'processing',
    total_rows: totalRows,
    actor_name: actor.name,
    actor_role: actor.role,
    meta,
  }

  try {
    const result = await supabasePost(JOBS_TABLE, payload)
    return result?.[0] || null
  } catch {
    return null
  }
}

const finalizeImportJob = async (jobId, stats) => {
  if (!jobId) return
  try {
    await supabasePatchWhere(JOBS_TABLE, `id=eq.${jobId}`, {
      status: 'completed',
      approved_rows: stats.approved,
      imported_rows: stats.imported,
      failed_rows: stats.failed,
      completed_at: new Date().toISOString(),
    })
  } catch {
    // audit optional
  }
}

const buildParsedRowPayload = (row) => ({
  full_name: row.full_name || '',
  phone: row.phone || '',
  birth_date: row.birth_date || null,
  notes: row.notes || null,
  diagnosis: row.diagnosis || null,
  last_visit: row.last_visit || null,
  address: row.address || null,
  tooth_notes: row.tooth_notes || [],
  visit_history: row.visit_history || [],
  total_price: row.total_price ?? null,
  total_paid: row.total_paid ?? null,
})

const saveImportRow = async (jobId, rowIndex, row, status, { patientId = null, errorMessage = null } = {}) => {
  if (!jobId) return
  try {
    await supabasePost(ROWS_TABLE, {
      job_id: jobId,
      row_index: rowIndex,
      status,
      confidence: row.confidence ?? 1,
      parsed: buildParsedRowPayload(row),
      error_message: errorMessage,
      patient_id: patientId,
    })
  } catch {
    // audit optional
  }
}

/**
 * Tasdiqlangan qatorlarni import qiladi.
 * @param {Array} rows — preview rows with selected=true
 * @param {object} opts
 */
export const commitImportRows = async (rows, { sourceType = 'csv', skipDuplicates = true } = {}) => {
  const cid = await getCurrentClinicId()
  if (!cid) throw new Error('Klinika tanlanmagan')

  const toImport = (rows || []).filter((r) => r.selected && (!skipDuplicates || !r.duplicate))
  const job = await createImportJob({
    sourceType,
    totalRows: toImport.length,
    meta: { skip_duplicates: skipDuplicates },
  })

  const results = {
    imported: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    patientIds: [],
    visitIds: [],
    paymentIds: [],
    appointmentIds: [],
    totalRevenue: 0,
  }

  for (let index = 0; index < toImport.length; index += 1) {
    const row = toImport[index]
    const rowIndex = row._sourceLine || index + 1

    try {
      if (!row.full_name?.trim()) {
        results.skipped += 1
        await saveImportRow(job?.id, rowIndex, row, 'skipped', {
          errorMessage: 'Ism kiritilmagan',
        })
        continue
      }

      const imported = await importPatientRow(row)

      results.patientIds.push(imported.patientId)
      results.visitIds.push(...imported.visitIds)
      results.paymentIds.push(...imported.paymentIds)
      results.appointmentIds.push(...imported.appointmentIds)
      results.totalRevenue += row.total_paid || 0

      await saveImportRow(job?.id, rowIndex, row, 'imported', { patientId: imported.patientId })
      results.imported += 1
    } catch (err) {
      results.failed += 1
      const message = err?.message || 'Import xatolik'
      results.errors.push({
        name: row.full_name,
        message,
      })
      await saveImportRow(job?.id, rowIndex, row, 'failed', { errorMessage: message })
    }
  }

  await finalizeImportJob(job?.id, {
    approved: toImport.length,
    imported: results.imported,
    failed: results.failed,
  })

  await logActivity({
    action: 'import.patients',
    summary: `Daftar import: ${results.imported} bemor yaratildi (${sourceType})`,
    entity: 'import_job',
    entityId: job?.id || null,
    meta: {
      imported: results.imported,
      failed: results.failed,
      skipped: results.skipped,
      source_type: sourceType,
      visits: results.visitIds.length,
      payments: results.paymentIds.length,
      appointments: results.appointmentIds.length,
      total_revenue: results.totalRevenue,
    },
  })

  return results
}

export const downloadImportTemplateCsv = () => {
  const header = 'Ism;Telefon;Tugilgan sana;Izoh;Oxirgi tashrif'
  const sample = 'Ali Valiyev;+998901234567;1990-05-12;Eslatma;2026-01-15'
  const blob = new Blob([`\uFEFF${header}\r\n${sample}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'shifocrm_daftar_shablon.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadImportTemplateExcel = () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Ism', 'Telefon', 'Tugilgan sana', 'Izoh', 'Oxirgi tashrif'],
    ['Ali Valiyev', '+998901234567', '1990-05-12', 'Eslatma', '2026-01-15'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Bemorlar')
  XLSX.writeFile(workbook, 'shifocrm_daftar_shablon.xlsx')
}
