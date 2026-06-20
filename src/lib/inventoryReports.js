/**
 * Ombor: minimal qoldiq ogohlantirish va sarf hisoboti
 */

export const findLowStockItems = (items = []) => {
  return items
    .filter((item) => {
      if (!item || item.is_active === false) return false
      const current = Number(item.current_stock)
      const min = Number(item.min_stock)
      if (!Number.isFinite(current) || !Number.isFinite(min)) return false
      return current <= min
    })
    .map((item) => ({
      id: item.id,
      name: item.name || item.title || `Material #${item.id}`,
      sku: item.sku || '',
      unit: item.unit || 'dona',
      currentStock: Number(item.current_stock) || 0,
      minStock: Number(item.min_stock) || 0,
      deficit: Math.max(0, (Number(item.min_stock) || 0) - (Number(item.current_stock) || 0)),
      category: item.category || '',
    }))
    .sort((a, b) => b.deficit - a.deficit)
}

export const buildConsumptionReport = (consumptions = [], items = []) => {
  const itemMap = new Map()
  for (const item of items) {
    itemMap.set(Number(item.id), item)
  }

  const byItem = new Map()
  const byVisit = new Map()

  for (const row of consumptions) {
    if (!row) continue
    const itemId = Number(row.item_id)
    const qty = Number(row.quantity) || 0
    const item = itemMap.get(itemId)
    const unitCost = Number(item?.cost_price) || 0
    const lineCost = qty * unitCost

    if (!byItem.has(itemId)) {
      byItem.set(itemId, {
        itemId,
        itemName: item?.name || row.item_name || `Material #${itemId}`,
        unit: item?.unit || 'dona',
        totalQty: 0,
        totalCost: 0,
        visitIds: new Set(),
      })
    }

    const bucket = byItem.get(itemId)
    bucket.totalQty += qty
    bucket.totalCost += lineCost
    if (row.visit_id) bucket.visitIds.add(Number(row.visit_id))

    const visitId = Number(row.visit_id)
    if (visitId) {
      if (!byVisit.has(visitId)) {
        byVisit.set(visitId, { visitId, totalQty: 0, totalCost: 0, lines: [] })
      }
      const visitBucket = byVisit.get(visitId)
      visitBucket.totalQty += qty
      visitBucket.totalCost += lineCost
      visitBucket.lines.push({
        itemId,
        itemName: bucket.itemName,
        quantity: qty,
        cost: lineCost,
      })
    }
  }

  const itemRows = Array.from(byItem.values())
    .map((entry) => ({
      ...entry,
      visitCount: entry.visitIds.size,
      visitIds: undefined,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)

  const visitRows = Array.from(byVisit.values())
    .sort((a, b) => b.totalCost - a.totalCost)

  const grandTotalQty = itemRows.reduce((sum, r) => sum + r.totalQty, 0)
  const grandTotalCost = itemRows.reduce((sum, r) => sum + r.totalCost, 0)

  return {
    byItem: itemRows,
    byVisit: visitRows,
    grandTotalQty,
    grandTotalCost,
  }
}
