/**
 * Daftar import API — CSV, Vision, batch commit.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabasePost, supabasePatchWhere } from './supabaseConfig'
import { getShifoAIApiKey } from './shifoAIApi'
import { parseVisionImagePayload } from '@/lib/visionImportCore'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { createPatient, listPatients } from './patientsApi'
import { createVisit } from './visitsApi'
import { createOdontogramSnapshot, createEmptyOdontogram } from './odontogramApi'
import { logActivity, getCurrentActor } from '@/lib/activityLog'
import { toothNotesToOdontogramData } from '@/lib/importOdontogramMap'
import {
  parseCsvText,
  readFileAsText,
  readFileAsBase64,
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

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Local vision import failed (${response.status})`)
  }

  return response.json()
}

const getVisionConfig = () => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (geminiKey) {
    return {
      apiKey: geminiKey,
      apiBase: 'https://generativelanguage.googleapis.com',
      model: import.meta.env.VITE_VISION_MODEL || 'gemini-2.0-flash',
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

export const parseVisionImage = async (file) => {
  const base64 = await readFileAsBase64(file)
  const mimeType = file.type || 'image/jpeg'
  const clinicId = await getCurrentClinicId()

  const payload = {
    image_base64: base64,
    mime_type: mimeType,
    clinic_id: clinicId,
  }

  let data = null

  if (import.meta.env.DEV) {
    try {
      data = await callLocalVisionImport(payload)
    } catch {
      try {
        data = await callSupabaseVisionImport(payload)
      } catch {
        data = await callDirectVisionImport(payload)
      }
    }
  } else {
    try {
      data = await callSupabaseVisionImport(payload)
    } catch (supabaseErr) {
      if (getVisionConfig().apiKey) {
        data = await callDirectVisionImport(payload)
      } else if (supabaseErr.status === 404) {
        throw new Error(
          'vision-import Supabase da topilmadi. Edge Function deploy qiling yoki .env ga VITE_GEMINI_API_KEY qo\'ying.'
        )
      } else {
        throw supabaseErr
      }
    }
  }

  return normalizeVisionRows(data.rows || [])
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
  }

  for (const row of toImport) {
    try {
      if (!row.full_name?.trim()) {
        results.skipped += 1
        continue
      }

      const patient = await createPatient({
        full_name: row.full_name.trim(),
        phone: row.phone || '',
        birth_date: row.birth_date || null,
        address: row.address || null,
        notes: [row.notes, row.last_visit ? `Oxirgi tashrif: ${row.last_visit}` : null]
          .filter(Boolean)
          .join('\n') || null,
        createFirstVisit: false,
        status: 'waiting',
      })

      results.patientIds.push(patient.id)

      const toothNotes = row.tooth_notes || []
      if (toothNotes.length > 0) {
        const visit = await createVisit({
          patient_id: patient.id,
          status: 'pending',
          notes: 'Daftar import — odontogramma',
          channel: 'import',
        })

        const odontogramData = toothNotesToOdontogramData(
          toothNotes,
          createEmptyOdontogram()
        )

        await createOdontogramSnapshot({
          patient_id: patient.id,
          visit_id: visit.id,
          doctor_id: null,
          data: odontogramData,
        })
      }

      results.imported += 1
    } catch (err) {
      results.failed += 1
      results.errors.push({
        name: row.full_name,
        message: err?.message || 'Import xatolik',
      })
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
