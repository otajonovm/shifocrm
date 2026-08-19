/**
 * Yagona moliya formulalari: to'lov, chegirma, qarz, kassa.
 *
 * due = max(0, servicesDeduped || visitPrice − discount)
 * remaining = max(0, due − cashNet)
 * cashNet = payments − true refunds (chegirma kirmaydi)
 */

export const DISCOUNT_NOTE_PREFIX = '[DISCOUNT]'
export const DISCOUNT_PERCENT_PREFIX = '[DISCOUNT_PERCENT:'
export const CASHBACK_USED_PREFIX = '[CASHBACK_USED:'

export function parsePrice(value) {
  if (value == null) return 0
  const n = typeof value === 'string'
    ? parseFloat(String(value).replace(/\s|,/g, ''))
    : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function roundSom(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

export function isDiscountEntry(entry) {
  if (!entry) return false
  if (entry.payment_type === 'discount') return true
  if (entry.payment_type === 'refund' && String(entry.note || '').includes(DISCOUNT_NOTE_PREFIX)) {
    return true
  }
  if (entry.payment_type === 'adjustment' && Number(entry.amount) < 0) return true
  return false
}

export function isTrueRefund(entry) {
  if (!entry) return false
  return entry.payment_type === 'refund' && !isDiscountEntry(entry)
}

export function discountTotal(entries = []) {
  return (entries || []).reduce((sum, entry) => {
    if (!isDiscountEntry(entry)) return sum
    return sum + Math.abs(parsePrice(entry.amount))
  }, 0)
}

export function cashNetPaid(entries = []) {
  return (entries || []).reduce((sum, entry) => {
    const amount = parsePrice(entry.amount)
    if (isDiscountEntry(entry)) return sum
    if (entry.payment_type === 'refund') return sum - amount
    if (entry.payment_type === 'adjustment') return sum + amount
    return sum + amount
  }, 0)
}

/** Kassa / hisobot daromadi: naqd/karta (keshbek ayirilgan) − haqiqiy refund. Chegirma kirmaydi. */
export function cashIncome(entries = []) {
  return (entries || []).reduce((sum, entry) => {
    const amount = parsePrice(entry.amount)
    if (isDiscountEntry(entry)) return sum
    if (isTrueRefund(entry)) return sum - amount
    if (entry.payment_type === 'payment') {
      return sum + Math.max(0, amount - parseCashbackUsed(entry))
    }
    return sum
  }, 0)
}

export function cashbackUsedTotal(entries = []) {
  return (entries || []).reduce((sum, entry) => {
    if (!entry || isDiscountEntry(entry) || entry.payment_type !== 'payment') return sum
    const amount = parsePrice(entry.amount)
    return sum + Math.min(parseCashbackUsed(entry), amount)
  }, 0)
}

/** Bemor oynasi / kassa: to'lov − keshbek − refund. Tashrif qarzida keshbek ham to'langan hisoblanadi. */
export function cashCollected(entries = []) {
  return Math.max(0, cashNetPaid(entries) - cashbackUsedTotal(entries))
}

export function paymentDisplayAmount(entry) {
  const amount = parsePrice(entry?.amount)
  if (!entry) return 0
  if (isDiscountEntry(entry) || entry.payment_type === 'refund' || (entry.payment_type === 'adjustment' && amount < 0)) {
    return -Math.abs(amount)
  }
  if (entry.payment_type === 'payment') {
    return Math.max(0, amount - parseCashbackUsed(entry))
  }
  return amount
}

export function servicesTotalDeduped(services = []) {
  const list = Array.isArray(services) ? services : []
  const withTooth = list.filter((row) => row?.tooth_id != null)
  if (!withTooth.length) {
    return list.reduce((sum, row) => sum + parsePrice(row?.total_price ?? row?.totalPrice ?? row?.price), 0)
  }
  const seen = new Set()
  let sum = 0
  const sorted = [...withTooth].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  )
  for (const entry of sorted) {
    const key = `t${entry.tooth_id}`
    if (seen.has(key)) continue
    seen.add(key)
    sum += parsePrice(entry.total_price ?? entry.totalPrice ?? entry.price)
  }
  return sum
}

export function visitDueFrom({ services = [], visitPrice = 0, payments = [] } = {}) {
  const fromServices = servicesTotalDeduped(services)
  const price = fromServices > 0 ? fromServices : Math.max(0, parsePrice(visitPrice))
  const discount = discountTotal(payments)
  const paid = cashNetPaid(payments)
  const due = Math.max(0, price - discount)
  const remaining = Math.max(0, due - paid)
  return {
    servicesTotal: fromServices,
    price,
    discount,
    paid,
    due,
    remaining,
  }
}

export function parseCashbackUsed(entry) {
  if (!entry) return 0
  const fromCol = parsePrice(entry.cashback_used)
  if (fromCol > 0) return roundSom(fromCol)
  const note = String(entry.note || '')
  const match = note.match(/\[CASHBACK_USED:(\d+(?:\.\d+)?)\]/i)
  if (!match) return 0
  return roundSom(match[1])
}

export function withCashbackUsedNote(note, cashbackUsed) {
  const used = roundSom(cashbackUsed)
  const cleaned = String(note || '').replace(/\s*\[CASHBACK_USED:\d+(?:\.\d+)?\]\s*/gi, ' ').trim()
  if (used <= 0) return cleaned || null
  return cleaned ? `${cleaned} ${CASHBACK_USED_PREFIX}${used}]` : `${CASHBACK_USED_PREFIX}${used}]`
}

export function earnBaseFromPayment(entry) {
  const amount = parsePrice(entry?.amount)
  const used = Math.min(parseCashbackUsed(entry), amount)
  return Math.max(0, amount - used)
}

/**
 * Oxirgi to'lovdan keshbek yechilganda qolgan naqd/karta.
 * alreadyUsed va additionalUsed alohida — ikkalasini bir xil 20 000 deb qo'shib 360 000 chiqarmaslik.
 */
export function lastPaymentAfterCashback({
  amount = 0,
  alreadyUsed = 0,
  additionalUsed = 0,
} = {}) {
  const total = Math.max(0, parsePrice(amount))
  const already = Math.min(total, Math.max(0, parsePrice(alreadyUsed)))
  const extra = Math.min(total - already, Math.max(0, parsePrice(additionalUsed)))
  const cashback = already + extra
  return {
    cashback,
    remaining: Math.max(0, total - cashback),
  }
}
