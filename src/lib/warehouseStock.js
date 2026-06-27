/**
 * Ombor qoldig'i holati — badge va kritik ro'yxat uchun.
 */

export const STOCK_STATUS = {
  OK: 'ok',
  LOW: 'low',
  CRITICAL: 'critical',
}

/** @param {{ current_stock?: number, min_limit?: number }} item */
export function getStockStatus(item) {
  const stock = Number(item?.current_stock) || 0
  const min = Number(item?.min_limit) || 0
  if (min <= 0) return STOCK_STATUS.OK
  if (stock <= min) return STOCK_STATUS.CRITICAL
  if (stock <= min * 1.25) return STOCK_STATUS.LOW
  return STOCK_STATUS.OK
}

export function isCriticalStock(item) {
  return getStockStatus(item) === STOCK_STATUS.CRITICAL
}

export function filterCriticalItems(items = []) {
  return items.filter(isCriticalStock)
}
