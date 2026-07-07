/**
 * Import tooth_notes → odontogram teeth map (FDI notation).
 */

const CONDITION_TO_STATE = {
  caries: 'caries',
  karies: 'caries',
  кариес: 'caries',
  filling: 'filled',
  filled: 'filled',
  plomba: 'filled',
  plomb: 'filled',
  пломба: 'filled',
  missing: 'missing',
  yoq: 'missing',
  absent: 'missing',
  отсутствует: 'missing',
  crown: 'crown',
  koronka: 'crown',
  коронка: 'crown',
  root_canal: 'root_canal',
  kanal: 'root_canal',
  devital: 'root_canal',
  endo: 'root_canal',
  healthy: 'healthy',
  soglom: 'healthy',
}

const VALID_FDI = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48',
])

export const mapConditionToState = (condition) => {
  const key = String(condition || '').trim().toLowerCase().replace(/\s+/g, '_')
  return CONDITION_TO_STATE[key] || 'caries'
}

export const normalizeToothId = (raw) => {
  const s = String(raw || '').replace(/\D/g, '')
  if (VALID_FDI.has(s)) return s
  return null
}

/**
 * @param {Array<{tooth_id?, condition?, planned_service?, note?}>} toothNotes
 * @param {Object} [baseOdontogram] - createEmptyOdontogram() natijasi
 */
export const toothNotesToOdontogramData = (toothNotes = [], baseOdontogram = null) => {
  const data = baseOdontogram
    ? JSON.parse(JSON.stringify(baseOdontogram))
    : { teeth: {} }

  if (!data.teeth) data.teeth = {}

  for (const note of toothNotes) {
    const toothId = normalizeToothId(note.tooth_id ?? note.tooth)
    if (!toothId) continue

    const state = mapConditionToState(note.condition)
    const parts = [note.planned_service, note.note].filter(Boolean)
    data.teeth[toothId] = {
      state,
      note: parts.join(' — ').slice(0, 500),
    }
  }

  return data
}
