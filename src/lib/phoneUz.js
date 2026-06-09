/** O'zbekiston telefon raqami: ko'rinish va saqlash */

export const UZ_PHONE_PLACEHOLDER = '+998 (90) 123-45-67'

export function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

/** UI: +998 (90) 123-45-67 */
export function formatPhoneUzDisplay(value) {
  let digits = normalizePhoneDigits(value)
  if (!digits.startsWith('998')) {
    digits = `998${digits}`
  }
  digits = digits.slice(0, 12)
  const local = digits.slice(3)

  if (!local.length) return '+998'

  let formatted = '+998'
  if (local.length > 0) formatted += ` (${local.slice(0, 2)}`
  if (local.length >= 2) formatted += ')'
  if (local.length > 2) formatted += ` ${local.slice(2, 5)}`
  if (local.length > 5) formatted += `-${local.slice(5, 7)}`
  if (local.length > 7) formatted += `-${local.slice(7, 9)}`
  return formatted
}

/** Bazaga: +998901234567 */
export function formatPhoneForStorage(value) {
  const digits = normalizePhoneDigits(value)
  if (digits.length < 12) return ''
  return `+${digits.slice(0, 12)}`
}

export function isValidUzPhone(value) {
  return normalizePhoneDigits(value).length === 12
}

/**
 * Login/qidiruv: bazada turli formatda saqlangan raqamlarni topish.
 * Masalan: +998901234567, 998901234567
 */
export function phoneAuthLookupVariants(value) {
  const digits = normalizePhoneDigits(value)
  const variants = new Set()

  const stored = formatPhoneForStorage(value)
  if (stored) variants.add(stored)

  if (digits.length >= 9) {
    let core = digits
    if (!core.startsWith('998')) {
      core = `998${core}`
    }
    core = core.slice(0, 12)
    if (core.length === 12) {
      variants.add(`+${core}`)
      variants.add(core)
    }
  }

  return [...variants].filter(Boolean)
}
