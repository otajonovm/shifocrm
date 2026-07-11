/**
 * Vaqtinchalik import rasmlari — Supabase Storage (import-temp).
 * AI tahlildan keyin avtomatik o'chiriladi.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'
import { getCurrentClinicId } from '@/lib/clinicContext'

const BUCKET = 'import-temp'

const storageUrl = (path) =>
  `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`

/**
 * @returns {Promise<{ path: string, storagePath: string } | null>}
 */
export const uploadImportImage = async (file) => {
  const cid = await getCurrentClinicId()
  if (!cid || !file) return null

  const ext = String(file.name || 'jpg').split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${cid}/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${safeExt}`

  try {
    const response = await fetch(storageUrl(path), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'image/jpeg',
        'x-upsert': 'false',
      },
      body: file,
    })

    if (!response.ok) {
      console.warn('Import rasm yuklanmadi (bucket mavjud emas bo\'lishi mumkin)')
      return null
    }

    return { path, storagePath: `${BUCKET}/${path}` }
  } catch {
    return null
  }
}

export const deleteImportImage = async (path) => {
  if (!path) return

  try {
    await fetch(storageUrl(path), {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
  } catch {
    // xavfsizlik: o'chirish ixtiyoriy
  }
}
