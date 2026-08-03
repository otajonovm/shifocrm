/** Canonical FDI tooth sets for permanent (32) and primary (20) dentition. */

export const PERMANENT_TEETH = Object.freeze([
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31,
  41, 42, 43, 44, 45, 46, 47, 48,
])

export const PRIMARY_TEETH = Object.freeze([
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  75, 74, 73, 72, 71,
  81, 82, 83, 84, 85,
])

export const TOOTH_STATUSES = Object.freeze([
  'healthy',
  'caries',
  'filling',
  'filled',
  'crown',
  'missing',
  'root',
  'implant',
  'bridge',
  'extraction',
])

export function normalizeToothStatus(status) {
  const s = String(status || '').toLowerCase().trim()
  if (s === 'filled') return 'filling'
  if (TOOTH_STATUSES.includes(s)) return s === 'filled' ? 'filling' : s
  return 'healthy'
}

export function teethForDentition(dentitionType = 'permanent') {
  if (dentitionType === 'primary') return [...PRIMARY_TEETH]
  if (dentitionType === 'mixed') return [...PERMANENT_TEETH, ...PRIMARY_TEETH]
  return [...PERMANENT_TEETH]
}

export function createEmptyOdontogramData(dentitionType = 'permanent') {
  const teeth = {}
  for (const id of teethForDentition(dentitionType)) {
    teeth[String(id)] = { status: 'healthy', notes: '' }
  }
  return { teeth, dentition_type: dentitionType }
}

export function cloneTeethOnly(data) {
  const src = data?.teeth && typeof data.teeth === 'object' ? data.teeth : {}
  const teeth = {}
  for (const [id, value] of Object.entries(src)) {
    teeth[id] = {
      status: normalizeToothStatus(value?.status),
      notes: typeof value?.notes === 'string' ? value.notes : '',
    }
  }
  return { teeth }
}

export function isValidToothId(toothId, dentitionType = 'permanent') {
  const n = Number(toothId)
  return teethForDentition(dentitionType).includes(n)
}
