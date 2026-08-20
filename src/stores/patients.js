import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listPatients,
  getPatientsByDoctorId,
  getPatientById as fetchPatientByIdApi,
  createPatient,
  updatePatient,
  deletePatient
} from '@/api/patientsApi'
import { useToast } from '@/composables/useToast'
import { normalizePatientStatus, PATIENT_STATUSES } from '@/constants/patientStatus'
import { createCachedListLoader, upsertById } from '@/lib/staleWhileRevalidate'

const matchPatientId = (patient, id) => {
  const numId = Number(id)
  const strId = String(id)
  return patient.id === id
    || patient.id === numId
    || Number(patient.id) === numId
    || String(patient.id) === strId
}

export const usePatientsStore = defineStore('patients', () => {
  const toast = useToast()

  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentPatient = ref(null)
  const cache = createCachedListLoader({ items, loading, error })

  const totalPatients = computed(() => items.value.length)
  const activePatients = computed(() => items.value.filter((p) => {
    const status = normalizePatientStatus(p.status)
    return status === PATIENT_STATUSES.WAITING || status === PATIENT_STATUSES.IN_CONSULTATION
  }).length)
  const inactivePatients = computed(() => items.value.filter((p) => normalizePatientStatus(p.status) === PATIENT_STATUSES.COMPLETED).length)

  const fetchPatients = async (options = {}) => {
    return cache.fetchCached(() => listPatients(), { ...options, scope: 'all' })
  }

  const fetchPatientsByDoctor = async (doctorId, options = {}) => {
    return cache.fetchCached(
      () => getPatientsByDoctorId(doctorId),
      { ...options, scope: `doctor:${doctorId}` },
    )
  }

  const fetchPatientById = async (id) => {
    error.value = null
    const foundInStore = items.value.find((p) => matchPatientId(p, id))

    if (foundInStore) {
      currentPatient.value = foundInStore
      fetchPatientByIdApi(id).then((patient) => {
        if (!patient) return
        upsertById(items, patient)
        if (matchPatientId(currentPatient.value || {}, patient.id)) {
          currentPatient.value = { ...currentPatient.value, ...patient }
        }
      }).catch(() => {})
      return foundInStore
    }

    loading.value = true
    try {
      const patient = await fetchPatientByIdApi(id)
      if (patient) {
        currentPatient.value = patient
        upsertById(items, patient)
        return currentPatient.value
      }
      return null
    } catch (err) {
      error.value = err.message || 'Bemorni yuklashda xatolik'
      console.error('Failed to fetch patient:', err)
      const fallback = items.value.find((p) => matchPatientId(p, id))
      if (fallback) {
        currentPatient.value = fallback
        return fallback
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const addPatient = async (patientData) => {
    loading.value = true
    error.value = null
    try {
      const newPatient = await createPatient(patientData)
      cache.bumpEpoch()
      if (newPatient) upsertById(items, newPatient)
      toast.success('Bemor muvaffaqiyatli qo\'shildi!')
      return newPatient
    } catch (err) {
      error.value = err.message || 'Bemor qo\'shishda xatolik'
      toast.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const editPatient = async (id, patientData) => {
    loading.value = true
    error.value = null
    try {
      const updated = await updatePatient(id, patientData)
      cache.bumpEpoch()
      if (updated) {
        upsertById(items, updated)
        if (currentPatient.value && matchPatientId(currentPatient.value, id)) {
          currentPatient.value = { ...currentPatient.value, ...updated }
        }
      }
      toast.success('Bemor muvaffaqiyatli yangilandi!')
      return updated
    } catch (err) {
      error.value = err.message || 'Bemorni yangilashda xatolik'
      toast.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const removePatient = async (id) => {
    loading.value = true
    error.value = null
    try {
      await deletePatient(id)
      cache.bumpEpoch()
      items.value = items.value.filter((p) => !matchPatientId(p, id))
      if (currentPatient.value && matchPatientId(currentPatient.value, id)) {
        currentPatient.value = null
      }
      toast.success('Bemor muvaffaqiyatli o\'chirildi!')
      return true
    } catch (err) {
      error.value = err.message || 'Bemorni o\'chirishda xatolik'
      toast.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearCurrentPatient = () => {
    currentPatient.value = null
  }

  const reset = () => {
    cache.reset()
    currentPatient.value = null
  }

  const getPatientById = async (id) => fetchPatientById(id)

  return {
    items,
    loading,
    error,
    currentPatient,
    totalPatients,
    activePatients,
    inactivePatients,
    fetchPatients,
    fetchPatientsByDoctor,
    fetchPatientById,
    getPatientById,
    addPatient,
    editPatient,
    removePatient,
    clearCurrentPatient,
    reset,
  }
})
