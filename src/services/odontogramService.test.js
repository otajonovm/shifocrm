import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateOdontogramSnapshot } = vi.hoisted(() => ({
  updateOdontogramSnapshot: vi.fn(),
}))

vi.mock('@/api/odontogramApi', () => ({
  updateOdontogramSnapshot,
  getOrCreateOdontogram: vi.fn(),
}))
vi.mock('@/api/visitsApi', () => ({
  getVisitsByPatientId: vi.fn(),
  getVisitById: vi.fn(),
  createVisit: vi.fn(),
  updateVisit: vi.fn(),
}))
vi.mock('@/api/visitServicesApi', () => ({
  getVisitServicesByVisitId: vi.fn(),
  deleteVisitServicesByVisitAndTooth: vi.fn(),
  createVisitService: vi.fn(),
}))
vi.mock('@/api/servicesApi', () => ({ listServices: vi.fn() }))
vi.mock('@/lib/inventoryBridge', () => ({
  listClinicInventoryItems: vi.fn(),
  listVisitConsumptions: vi.fn(),
  createVisitConsumption: vi.fn(),
  deleteVisitConsumption: vi.fn(),
}))
vi.mock('@/api/serviceMaterialsApi', () => ({ consumeServiceMaterialsForVisit: vi.fn() }))
vi.mock('@/api/paymentsApi', () => ({ getPaymentsByVisitId: vi.fn() }))
vi.mock('@/api/telegramApi', () => ({
  sendVisitCompleted: vi.fn(),
  schedulePatientFollowUps: vi.fn(),
}))

import { createSaveQueue, isVersionConflictError, saveSnapshot } from './odontogramService'

describe('odontogramService save pipeline', () => {
  beforeEach(() => {
    updateOdontogramSnapshot.mockReset()
  })

  it('saves with the expected version and applies the returned version', async () => {
    updateOdontogramSnapshot.mockResolvedValue({
      id: 10,
      version: 4,
      data: { teeth: { 11: { state: 'caries' } } },
    })

    const saved = await saveSnapshot(
      { id: 10, version: 3, dentition_type: 'permanent' },
      { teeth: { 11: { state: 'caries' } } },
    )

    expect(updateOdontogramSnapshot).toHaveBeenCalledWith(
      10,
      { teeth: { 11: { state: 'caries' } } },
      { expectedVersion: 3, dentitionType: 'permanent' },
    )
    expect(saved.version).toBe(4)
  })

  it('keeps a failed payload and retries it', async () => {
    const record = { id: 10, version: 1, data: { teeth: {} } }
    const states = []
    updateOdontogramSnapshot
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ...record, version: 2, data: { teeth: { 12: { state: 'filled' } } } })

    const queue = createSaveQueue({
      getRecord: () => record,
      onState: (state) => states.push(state),
      onSaved: (saved) => Object.assign(record, saved),
      delay: 0,
    })

    queue.schedule({ teeth: { 12: { state: 'filled' } } })
    await expect(queue.flush()).rejects.toThrow('network')
    await queue.retry()

    expect(updateOdontogramSnapshot).toHaveBeenCalledTimes(2)
    expect(record.version).toBe(2)
    expect(states).toContain('error')
    expect(states.at(-1)).toBe('saved')
  })

  it('recognizes a version conflict and can discard its stale payload', async () => {
    updateOdontogramSnapshot.mockRejectedValue(new Error('odontogram_version_conflict'))
    const queue = createSaveQueue({
      getRecord: () => ({ id: 10, version: 1 }),
      delay: 0,
    })

    queue.schedule({ teeth: { 11: { state: 'caries' } } })
    const error = await queue.flush().catch((caught) => caught)
    expect(isVersionConflictError(error)).toBe(true)

    queue.discard()
    await expect(queue.retry()).resolves.toEqual({ id: 10, version: 1 })
    expect(updateOdontogramSnapshot).toHaveBeenCalledTimes(1)
  })
})
