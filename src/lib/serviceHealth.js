/**
 * Xizmatlar "salomatligi" — kritik holatlar ro'yxati.
 */

const STALE_MONTHS = 6

export function parseServicePrice(v) {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

function monthsAgo(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

/**
 * @param {object[]} services
 * @param {object[]} topServices — getTopServices natijasi
 * @param {object[]} auditRows — service_price_audit
 * @param {Map<number, number>} [marginByServiceId] — service_id → material tannarxi
 */
export function computeServiceHealthIssues(services = [], topServices = [], auditRows = [], marginByServiceId = new Map()) {
  const issues = []
  const now = new Date()
  const staleCutoff = monthsAgo(now, STALE_MONTHS)

  const topNames = new Set(
    topServices.slice(0, 5).map((r) => String(r.service_name || '').toLowerCase()),
  )

  const lastAuditByService = new Map()
  for (const row of auditRows) {
    const sid = Number(row.service_id)
    if (!Number.isFinite(sid)) continue
    const at = new Date(row.changed_at || row.created_at || 0)
    const prev = lastAuditByService.get(sid)
    if (!prev || at > prev) lastAuditByService.set(sid, at)
  }

  for (const svc of services) {
    const id = Number(svc.id)
    const name = svc.name || `#${id}`
    const price = parseServicePrice(svc.base_price)
    const materialCost = marginByServiceId.get(id) || 0

    if (price <= 0) {
      issues.push({
        type: 'zero_price',
        serviceId: id,
        name,
        detail: 'zero_price',
      })
      continue
    }

    if (materialCost > 0 && price < materialCost) {
      issues.push({
        type: 'low_margin',
        serviceId: id,
        name,
        detail: 'low_margin',
        price,
        materialCost,
        margin: price - materialCost,
      })
    }

    if (svc.is_active === false && topNames.has(String(name).toLowerCase())) {
      issues.push({
        type: 'inactive_popular',
        serviceId: id,
        name,
        detail: 'inactive_popular',
      })
    }

    const lastAudit = lastAuditByService.get(id)
    const updatedAt = svc.updated_at ? new Date(svc.updated_at) : null
    const lastChange = lastAudit || updatedAt
    if (!lastChange || lastChange < staleCutoff) {
      issues.push({
        type: 'stale_price',
        serviceId: id,
        name,
        detail: 'stale_price',
        lastChange: lastChange ? lastChange.toISOString() : null,
      })
    }
  }

  const seen = new Set()
  return issues.filter((item) => {
    const key = `${item.type}:${item.serviceId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getServiceMarginStatus(basePrice, materialCost) {
  const price = parseServicePrice(basePrice)
  const cost = parseServicePrice(materialCost)
  if (cost <= 0) return 'ok'
  const margin = price - cost
  const ratio = price > 0 ? margin / price : 0
  if (margin < 0) return 'critical'
  if (ratio < 0.15) return 'low'
  return 'ok'
}
