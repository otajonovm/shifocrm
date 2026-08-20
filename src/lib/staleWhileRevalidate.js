/**
 * Pinia ro'yxatlari uchun cache-first + stale-while-revalidate.
 * Kesh bo'lsa UI bloklanmaydi; yangilanish fonda ketadi.
 */
export function createCachedListLoader({ items, loading, error }) {
  let inflight = null
  let epoch = 0
  let scopeKey = ''

  const bumpEpoch = () => {
    epoch += 1
    inflight = null
  }

  const reset = () => {
    bumpEpoch()
    scopeKey = ''
    items.value = []
    if (loading) loading.value = false
    if (error) error.value = null
  }

  const revalidate = (loader, nextScope) => {
    const myEpoch = epoch
    if (inflight) return inflight

    inflight = Promise.resolve()
      .then(loader)
      .then((data) => {
        if (myEpoch !== epoch) return
        items.value = Array.isArray(data) ? data : []
        scopeKey = nextScope
      })
      .catch((err) => {
        if (myEpoch === epoch && error) {
          error.value = err?.message || String(err)
        }
        throw err
      })
      .finally(() => {
        if (myEpoch === epoch) inflight = null
        if (loading && myEpoch === epoch) loading.value = false
      })

    return inflight
  }

  const fetchCached = async (loader, { force = false, scope = 'default' } = {}) => {
    const scopeChanged = Boolean(scopeKey) && scopeKey !== scope
    const hasCache = !scopeChanged && Array.isArray(items.value) && items.value.length > 0

    if (error) error.value = null

    if (hasCache && !force) {
      revalidate(loader, scope).catch(() => {})
      return items.value
    }

    if (scopeChanged) {
      bumpEpoch()
      items.value = []
    }

    if (loading) loading.value = true
    try {
      await revalidate(loader, scope)
    } catch {
      // Kesh bo'sh bo'lsa ham UI xatoni store.error orqali ko'rsatadi
    } finally {
      if (loading) loading.value = false
    }
    return items.value
  }

  return { fetchCached, bumpEpoch, reset }
}

export function upsertById(items, record) {
  if (!record || record.id == null) return
  const index = items.value.findIndex((row) => Number(row.id) === Number(record.id))
  if (index === -1) {
    items.value.unshift(record)
    return
  }
  items.value[index] = { ...items.value[index], ...record }
}
