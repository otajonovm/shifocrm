/**
 * Bemor klinik timeline — visits, odontogram, payments birlashtirish
 */

const parseMs = (value, fallback = 0) => {
  if (!value) return fallback
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? fallback : ms
}

const countOdontogramChanges = (data) => {
  if (!data || typeof data !== 'object') return 0
  const teeth = data.teeth || data
  if (!teeth || typeof teeth !== 'object') return 0
  return Object.keys(teeth).filter((key) => teeth[key] && teeth[key].state).length
}

export const buildPatientClinicalTimeline = ({
  visits = [],
  payments = [],
  odontograms = [],
  patientName = '',
} = {}) => {
  const events = []

  for (const visit of visits) {
    const ts = parseMs(
      visit.date && visit.start_time
        ? `${String(visit.date).slice(0, 10)}T${String(visit.start_time).slice(0, 5)}:00`
        : visit.created_at,
      parseMs(visit.created_at)
    )

    events.push({
      id: `visit-${visit.id}`,
      type: 'visit',
      ts,
      title: visit.service_name || 'Qabul',
      subtitle: [visit.doctor_name, visit.status].filter(Boolean).join(' · '),
      meta: {
        visitId: visit.id,
        status: visit.status,
        debt: Number(visit.debt_amount) || 0,
        price: Number(visit.price) || 0,
      },
      icon: 'visit',
    })
  }

  for (const payment of payments) {
    const ts = parseMs(payment.paid_at, parseMs(payment.created_at))
    const type = String(payment.payment_type || 'payment')
    const isRefund = type === 'refund'

    events.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      ts,
      title: isRefund ? 'Qaytarim' : 'To\'lov',
      subtitle: [payment.method, payment.note].filter(Boolean).join(' · '),
      meta: {
        paymentId: payment.id,
        amount: Number(payment.amount) || 0,
        visitId: payment.visit_id,
        paymentType: type,
      },
      icon: isRefund ? 'refund' : 'payment',
    })
  }

  for (const odonto of odontograms) {
    const changes = countOdontogramChanges(odonto.data)
    const ts = parseMs(odonto.updated_at, parseMs(odonto.created_at))

    events.push({
      id: `odonto-${odonto.id}`,
      type: 'odontogram',
      ts,
      title: 'Tish xaritasi yangilandi',
      subtitle: changes
        ? `${changes} ta tish holati`
        : (patientName ? `${patientName} kartasi` : 'Odontogramma'),
      meta: {
        odontogramId: odonto.id,
        visitId: odonto.visit_id,
        changes,
        status: odonto.data?._status || odonto.status,
      },
      icon: 'odontogram',
    })
  }

  return events
    .filter((event) => event.ts > 0)
    .sort((a, b) => b.ts - a.ts)
}

export const groupTimelineByDate = (events = []) => {
  const groups = new Map()

  for (const event of events) {
    const dateKey = new Date(event.ts).toISOString().slice(0, 10)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey).push(event)
  }

  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }))
}

export const formatTimelineDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatTimelineTime = (ts) => {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}
