import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listPatientsPage } from './patientsApi'

vi.mock('@/lib/clinicContext', () => ({
  getCurrentClinicId: vi.fn(async () => 7),
}))

vi.mock('@/lib/supabaseClinicFallback', () => ({
  supabaseGetWithClinicFallback: vi.fn(),
  mergeClinicQuery: (q, cid) => `clinic_id=eq.${cid}&${q}`,
}))

import { supabaseGetWithClinicFallback } from '@/lib/supabaseClinicFallback'

describe('listPatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    supabaseGetWithClinicFallback.mockResolvedValue({
      data: [{ id: 1 }],
      total: 41,
    })
  })

  it('requests page 2 as Range 20-39 with exact count', async () => {
    const result = await listPatientsPage({ page: 2, pageSize: 20 })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBe(41)
    expect(supabaseGetWithClinicFallback).toHaveBeenCalledTimes(1)

    const [, query, cid, options] = supabaseGetWithClinicFallback.mock.calls[0]
    expect(cid).toBe(7)
    expect(query).toContain('order=created_at.desc')
    expect(options.withMeta).toBe(true)
    expect(options.headers.Range).toBe('20-39')
    expect(options.headers.Prefer).toContain('count=exact')
  })

  it('sends name/phone ilike filters for search', async () => {
    await listPatientsPage({ search: 'Ali', page: 1, pageSize: 20 })

    const [, query] = supabaseGetWithClinicFallback.mock.calls[0]
    expect(query).toContain('or=')
    expect(query).toContain('full_name.ilike.')
    expect(query).toContain('phone.ilike.')
    expect(query).toContain('Ali')
  })
})
