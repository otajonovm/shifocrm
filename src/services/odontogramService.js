import * as odontogramApi from '@/api/odontogramApi'
import * as visitsApi from '@/api/visitsApi'
import * as visitServicesApi from '@/api/visitServicesApi'
import { listServices } from '@/api/servicesApi'
import {
  listClinicInventoryItems,
  listVisitConsumptions,
  createVisitConsumption,
  deleteVisitConsumption,
} from '@/lib/inventoryBridge'
import { consumeServiceMaterialsForVisit } from '@/api/serviceMaterialsApi'
import { getPaymentsByVisitId } from '@/api/paymentsApi'
import { postVisitPayment } from '@/services/paymentService'
import { updatePatient } from '@/api/patientsApi'
import { sendVisitCompleted, schedulePatientFollowUps } from '@/api/telegramApi'

const clone = (value) => JSON.parse(JSON.stringify(value))

export const isVersionConflictError = (error) => {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('odontogram_version_conflict') || message.includes('version conflict')
}

const unwrapRpcRow = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

export const getPatientVisits = visitsApi.getVisitsByPatientId
export const getVisit = visitsApi.getVisitById
export const createVisit = visitsApi.createVisit
export const updateVisit = visitsApi.updateVisit
export const getOrCreateOdontogram = odontogramApi.getOrCreateOdontogram
export const getVisitServices = visitServicesApi.getVisitServicesByVisitId
export const getClinicServices = listServices
export const getClinicInventoryItems = listClinicInventoryItems
export const getVisitConsumptions = listVisitConsumptions
export const addVisitConsumption = createVisitConsumption
export const removeVisitConsumption = deleteVisitConsumption
export const getVisitPayments = getPaymentsByVisitId
export const recordVisitPayment = postVisitPayment
export const notifyVisitCompleted = sendVisitCompleted
export const scheduleVisitFollowUps = schedulePatientFollowUps
export const updatePatientStatus = updatePatient

export async function saveSnapshot(record, data) {
  if (!record?.id) throw new Error('Odontogramma tanlanmagan')
  const options = record.version == null
    ? {}
    : {
        expectedVersion: Number(record.version),
        dentitionType: record.dentition_type || data?.dentition_type || 'permanent',
      }
  const response = unwrapRpcRow(
    await odontogramApi.updateOdontogramSnapshot(record.id, data, options),
  )
  return {
    ...record,
    ...(response || {}),
    data: clone(response?.data || data),
    version: response?.version ?? (record.version == null ? null : Number(record.version) + 1),
  }
}

export function createSaveQueue({
  getRecord,
  onSaved,
  onState,
  delay = 500,
}) {
  let timer = null
  let queuedData = null
  let inFlight = null
  let stopped = false

  const setState = (state, error = null) => onState?.(state, error)

  const flush = async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (inFlight) {
      await inFlight
      if (!queuedData) return getRecord()
    }
    if (!queuedData || stopped) return getRecord()

    const payload = queuedData
    queuedData = null
    setState('saving')
    inFlight = saveSnapshot(getRecord(), payload)
      .then((saved) => {
        onSaved?.(saved)
        setState('saved')
        return saved
      })
      .catch((error) => {
        queuedData = payload
        setState('error', error)
        throw error
      })
      .finally(() => {
        inFlight = null
      })

    const result = await inFlight
    if (queuedData && !stopped) return flush()
    return result
  }

  const schedule = (data) => {
    if (stopped) return
    queuedData = clone(data)
    setState('pending')
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      flush().catch(() => {})
    }, delay)
  }

  const retry = () => flush()

  const discard = () => {
    if (timer) clearTimeout(timer)
    timer = null
    queuedData = null
  }

  const stop = async ({ flushPending = true } = {}) => {
    if (flushPending && queuedData) {
      try {
        await flush()
      } catch {
        // The UI already has the recoverable payload and error state.
      }
    }
    stopped = true
    if (timer) clearTimeout(timer)
    timer = null
  }

  return { schedule, flush, retry, discard, stop }
}

export async function clearToothService(visitId, toothId) {
  await visitServicesApi.deleteVisitServicesByVisitAndTooth(visitId, toothId)
  return getVisitServices(visitId)
}

export async function replaceToothService({
  visitId,
  patientId,
  doctorId,
  toothId,
  serviceId,
  serviceName,
  price,
  performedBy,
  authStore,
  inventoryItems,
}) {
  const previousServices = ((await getVisitServices(visitId)) || [])
    .filter((entry) => Number(entry.tooth_id) === Number(toothId))
  await visitServicesApi.deleteVisitServicesByVisitAndTooth(visitId, toothId)
  let entry
  try {
    entry = await visitServicesApi.createVisitService({
      visit_id: visitId,
      patient_id: patientId,
      doctor_id: doctorId,
      tooth_id: toothId,
      service_name: serviceName,
      price,
      performed_by: performedBy,
    })
  } catch (error) {
    const previous = previousServices[0]
    if (previous) {
      try {
        await visitServicesApi.createVisitService({
          visit_id: visitId,
          patient_id: previous.patient_id ?? patientId,
          doctor_id: previous.doctor_id ?? doctorId,
          tooth_id: toothId,
          service_name: previous.service_name,
          price: previous.price,
          performed_by: previous.performed_by ?? performedBy,
        })
      } catch (rollbackError) {
        error.rollbackError = rollbackError
      }
    }
    throw error
  }

  let consumed = []
  let materialError = null
  try {
    consumed = await consumeServiceMaterialsForVisit({
      serviceId: Number(serviceId),
      visitId,
      patientId,
      doctorId,
      toothId,
      authStore,
      inventoryItems,
    })
  } catch (error) {
    materialError = error
  }

  return {
    entry,
    consumed,
    materialError,
    services: await getVisitServices(visitId),
  }
}
