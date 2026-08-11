/** Canonical FDI tooth sets for permanent (32) and primary (20) dentition. */

export const PERMANENT_TEETH = Object.freeze([
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31,
  41, 42, 43, 44, 45, 46, 47, 48,
])

export const PERMANENT_QUADRANTS = Object.freeze({
  upperRight: Object.freeze([18, 17, 16, 15, 14, 13, 12, 11]),
  upperLeft: Object.freeze([21, 22, 23, 24, 25, 26, 27, 28]),
  lowerRight: Object.freeze([48, 47, 46, 45, 44, 43, 42, 41]),
  lowerLeft: Object.freeze([31, 32, 33, 34, 35, 36, 37, 38]),
})

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
  'crown',
  'missing',
  'root_canal',
  'implant',
  'bridge',
  'extraction',
])

export function normalizeToothStatus(status) {
  const s = String(status || '').toLowerCase().trim()
  if (s === 'filled') return 'filling'
  if (s === 'root' || s === 'rootcanal') return 'root_canal'
  if (TOOTH_STATUSES.includes(s)) return s
  return 'healthy'
}

export function toStorageToothState(status) {
  const normalized = normalizeToothStatus(status)
  return normalized === 'filling' ? 'filled' : normalized
}

export function normalizeToothRecord(record = {}) {
  const status = normalizeToothStatus(record.state ?? record.status)
  const note = record.note ?? record.notes
  const normalized = {
    state: toStorageToothState(status),
    note: typeof note === 'string' ? note : '',
  }
  const serviceId = record.service_id ?? record.serviceId
  if (serviceId !== null && serviceId !== undefined && serviceId !== '') {
    normalized.service_id = serviceId
  }
  return normalized
}

export function teethForDentition(dentitionType = 'permanent') {
  if (dentitionType === 'primary') return [...PRIMARY_TEETH]
  if (dentitionType === 'mixed') return [...PERMANENT_TEETH, ...PRIMARY_TEETH]
  return [...PERMANENT_TEETH]
}

export function createEmptyOdontogramData(dentitionType = 'permanent') {
  const teeth = {}
  for (const id of teethForDentition(dentitionType)) {
    teeth[String(id)] = { state: 'healthy', note: '' }
  }
  return { teeth, dentition_type: dentitionType }
}

export function cloneTeethOnly(data, dentitionType = 'permanent') {
  const src = data?.teeth && typeof data.teeth === 'object' ? data.teeth : {}
  const teeth = {}
  for (const [id, value] of Object.entries(src)) {
    if (!isValidToothId(id, dentitionType)) continue
    teeth[String(id)] = normalizeToothRecord(value)
  }
  return { teeth, dentition_type: dentitionType }
}

export function isValidToothId(toothId, dentitionType = 'permanent') {
  const n = Number(toothId)
  return teethForDentition(dentitionType).includes(n)
}
