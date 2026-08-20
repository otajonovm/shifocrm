import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPatientsDirectory } from './patientDirectoryService'

vi.mock('@/api/patientsApi', () => ({
  listPatientsPage: vi.fn(),
}))

vi.mock('@/api/visitsApi', () => ({
  getVisitsSummaryByPatientIds: vi.fn(),
}))

import { listPatientsPage } from '@/api/patientsApi'
import { getVisitsSummaryByPatientIds } from '@/api/visitsApi'

describe('loadPatientsDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps visit debt to a negative patient balance', async () => {
    listPatientsPage.mockResolvedValue({
      data: [{ id: 11, full_name: 'Ali' }],
      total: 1,
      page: 1,
      pageSize: 20,
    })
    getVisitsSummaryByPatientIds.mockResolvedValue({
      balanceByPatient: { 11: -150000 },
      latestByPatient: { 11: { paid_amount: 0, status: 'completed_debt' } },
    })

    const result = await loadPatientsDirectory({ page: 1, pageSize: 20 })

    expect(getVisitsSummaryByPatientIds).toHaveBeenCalledWith([11])
    expect(result.data[0].balance).toBe(-150000)
    expect(result.total).toBe(1)
    expect(result.latestByPatient[11].status).toBe('completed_debt')
  })

  it('defaults missing visit debt to zero balance', async () => {
    listPatientsPage.mockResolvedValue({
      data: [{ id: 22, full_name: 'Vali' }],
      total: 22,
      page: 2,
      pageSize: 20,
    })
    getVisitsSummaryByPatientIds.mockResolvedValue({
      balanceByPatient: {},
      latestByPatient: {},
    })

    const result = await loadPatientsDirectory({ page: 2 })

    expect(result.data[0].balance).toBe(0)
    expect(result.total).toBe(22)
  })
})
