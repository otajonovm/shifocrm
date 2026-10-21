/**
 * PostgREST schema cache / yo'q ustun (PGRST204, 42703) xatolarini tahlil qilish.
 */

export function isSchemaCacheColumnError(error) {
  const msg = String(error?.message || error?.hint || error?.details || '').toLowerCase()
  const code = String(error?.code || '')
  return code === 'PGRST204'
    || code === '42703'
    || msg.includes('schema cache')
    || /could not find the '.+' column/.test(msg)
    || (msg.includes('column') && msg.includes('does not exist'))
}

export function parseMissingColumn(error) {
  const text = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  const quoted = text.match(/Could not find the '([^']+)' column/i)
  if (quoted?.[1]) return quoted[1]
  const pgQuoted = text.match(/column ["']([^"']+)["'] of relation/i)
  if (pgQuoted?.[1]) return pgQuoted[1]
  const pgBare = text.match(/column ([a-z_][a-z0-9_]*) does not exist/i)
  if (pgBare?.[1]) return pgBare[1]
  return null
}

/**
 * INSERT/UPDATE: schema cache'da yo'q ustunni tashlab (yoki aliasga o'tkazib) qayta urinadi.
 * @param {(body: object) => Promise<any>} writeFn
 * @param {object} payload
 * @param {{ aliases?: Record<string, string[]>, maxDrops?: number }} [options]
 */
export async function writeOmittingMissingColumns(writeFn, payload, options = {}) {
  const aliases = options.aliases || {}
  const maxDrops = options.maxDrops ?? 8
  let body = { ...payload }
  let lastError = null

  for (let attempt = 0; attempt < maxDrops; attempt += 1) {
    try {
      return await writeFn(body)
    } catch (error) {
      lastError = error
      if (!isSchemaCacheColumnError(error)) throw error
      const col = parseMissingColumn(error)
      if (!col || !Object.prototype.hasOwnProperty.call(body, col)) throw error
      const value = body[col]
      const next = { ...body }
      delete next[col]
      const alias = (aliases[col] || []).find((key) => !Object.prototype.hasOwnProperty.call(next, key))
      if (alias && value != null && value !== '') {
        next[alias] = value
      }
      body = next
    }
  }

  throw lastError
}
