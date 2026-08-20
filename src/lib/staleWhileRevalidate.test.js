import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { createCachedListLoader, upsertById } from './staleWhileRevalidate'

describe('createCachedListLoader', () => {
  it('returns cache immediately and refreshes in the background', async () => {
    const items = ref([{ id: 1 }])
    const loading = ref(false)
    const error = ref(null)
    const { fetchCached } = createCachedListLoader({ items, loading, error })

    let resolveFresh
    const loader = vi.fn(() => new Promise((resolve) => {
      resolveFresh = resolve
    }))

    const result = await fetchCached(loader)
    expect(result).toEqual([{ id: 1 }])
    expect(loading.value).toBe(false)
    expect(loader).toHaveBeenCalledTimes(1)

    resolveFresh([{ id: 2 }])
    await vi.waitFor(() => {
      expect(items.value).toEqual([{ id: 2 }])
    })
  })

  it('blocks on first load when cache is empty', async () => {
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)
    const { fetchCached } = createCachedListLoader({ items, loading, error })

    const loader = vi.fn(async () => [{ id: 9 }])
    const result = await fetchCached(loader)

    expect(result).toEqual([{ id: 9 }])
    expect(items.value).toEqual([{ id: 9 }])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('ignores stale background results after bumpEpoch', async () => {
    const items = ref([{ id: 1 }])
    const loading = ref(false)
    const error = ref(null)
    const { fetchCached, bumpEpoch } = createCachedListLoader({ items, loading, error })

    let resolveFresh
    await fetchCached(() => new Promise((resolve) => {
      resolveFresh = resolve
    }))
    bumpEpoch()
    items.value = [{ id: 1 }, { id: 99 }]
    resolveFresh([{ id: 2 }])
    await Promise.resolve()
    await Promise.resolve()
    expect(items.value).toEqual([{ id: 1 }, { id: 99 }])
  })
})

describe('upsertById', () => {
  it('unshifts a new record and patches an existing one', () => {
    const items = ref([{ id: 2, name: 'old' }])
    upsertById(items, { id: 1, name: 'new' })
    expect(items.value[0]).toMatchObject({ id: 1, name: 'new' })
    upsertById(items, { id: 2, name: 'updated' })
    expect(items.value.find((row) => row.id === 2).name).toBe('updated')
  })
})
