import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listPatients,
  getPatientById,
  getPatientsByDoctorId,
  createPatient,
  updatePatient,
  deletePatient
} from '@/api/patientsApi'
import { useToast } from '@/composables/useToast'

export const usePatientsStore = defineStore('patients', () => {
  const toast = useToast()

  // State
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentPatient = ref(null)

  // Getters
  const totalPatients = computed(() => items.value.length)
  const activePatients = computed(() => items.value.filter(p => p.status === 'active').length)
  const inactivePatients = computed(() => items.value.filter(p => p.status === 'inactive').length)

  // Actions
  const fetchPatients = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await listPatients()
      items.value = data
    } catch (err) {
      error.value = err.message || 'Bemorlarni yuklashda xatolik'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const fetchPatientsByDoctor = async (doctorId) => {
    loading.value = true
    error.value = null
    try {
      const data = await getPatientsByDoctorId(doctorId)
      items.value = data
    } catch (err) {
      error.value = err.message || 'Bemorlarni yuklashda xatolik'
      toast.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const fetchPatientById = async (id) => {
    loading.value = true
    error.value = null
    try {
      currentPatient.value = await getPatientById(id)
      return currentPatient.value
    } catch (err) {
      error.value = err.message || 'Bemorni yuklashda xatolik'
      toast.error(error.value)
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
      items.value.unshift(newPatient)
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
      const index = items.value.findIndex(p => p.id === id)
      if (index !== -1) {
        items.value[index] = updated
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
      items.value = items.value.filter(p => p.id !== id)
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

  return {
    // State
    items,
    loading,
    error,
    currentPatient,
    // Getters
    totalPatients,
    activePatients,
    inactivePatients,
    // Actions
    fetchPatients,
    fetchPatientsByDoctor,
    fetchPatientById,
    addPatient,
    editPatient,
    removePatient,
    clearCurrentPatient
  }
})
