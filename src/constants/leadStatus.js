/**
 * Onlayn yozilish (lead) statuslari — yagona manba
 */

export const LEAD_STATUSES = {
  HOLD: 'hold',
  CONTACTED: 'contacted',
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
  QABULDA: 'qabulda',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  BOOKED: 'booked',
  NEW: 'new',
}

/** UI dropdown uchun ruxsat etilgan statuslar */
export const LEAD_STATUS_DROPDOWN = [
  LEAD_STATUSES.HOLD,
  LEAD_STATUSES.CONTACTED,
  LEAD_STATUSES.CONFIRMED,
  LEAD_STATUSES.QABULDA,
  LEAD_STATUSES.CANCELED,
  LEAD_STATUSES.REJECTED,
]

/** Eski `booked` / `new` → hold deb ko'rsatish */
export function normalizeLeadStatus(status) {
  const key = String(status || LEAD_STATUSES.HOLD).toLowerCase()
  if (key === LEAD_STATUSES.BOOKED || key === LEAD_STATUSES.NEW) return LEAD_STATUSES.HOLD
  if (key === 'cancelled') return LEAD_STATUSES.CANCELED
  return key
}

export function getLeadStatusLabelKey(status) {
  const key = normalizeLeadStatus(status)
  const map = {
    hold: 'leads.statusHold',
    contacted: 'leads.statusContacted',
    confirmed: 'leads.statusConfirmed',
    canceled: 'leads.statusCanceled',
    qabulda: 'leads.statusQabulda',
    expired: 'leads.statusExpired',
    rejected: 'leads.statusRejected',
  }
  return map[key] || 'leads.statusHold'
}

export function getLeadStatusBadgeClass(status) {
  const key = normalizeLeadStatus(status)
  if (key === LEAD_STATUSES.QABULDA) return 'bg-cyan-100 text-cyan-700'
  if (key === LEAD_STATUSES.CONFIRMED) return 'bg-emerald-100 text-emerald-700'
  if (key === LEAD_STATUSES.CONTACTED) return 'bg-blue-100 text-blue-700'
  if (key === LEAD_STATUSES.CANCELED || key === LEAD_STATUSES.REJECTED) return 'bg-rose-100 text-rose-700'
  if (key === LEAD_STATUSES.EXPIRED) return 'bg-slate-100 text-slate-600'
  return 'bg-amber-100 text-amber-700'
}

/** Lead status → kutiladigan visit status */
export function visitStatusForLeadStatus(leadStatus) {
  const key = normalizeLeadStatus(leadStatus)
  if (key === LEAD_STATUSES.CONFIRMED) return 'arrived'
  if (key === LEAD_STATUSES.QABULDA) return 'in_progress'
  if (key === LEAD_STATUSES.CANCELED || key === LEAD_STATUSES.REJECTED || key === LEAD_STATUSES.EXPIRED) {
    return 'cancelled'
  }
  return 'pending'
}
