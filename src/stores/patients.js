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
    
    console.log('🔍 Searching for patient ID:', id, 'Type:', typeof id)
    console.log('📦 Store items count:', items.value.length)
    console.log('📦 Store IDs:', items.value.map(p => ({ id: p.id, name: p.full_name, type: typeof p.id })))
    
    try {
      // Avval store'dagi items dan qidirish
      const numId = Number(id)
      const strId = String(id)
      
      console.log('🔍 Store search - Looking for:', { id, numId, strId, idType: typeof id })
      
      const foundInStore = items.value.find(p => {
        // Barcha mumkin bo'lgan formatlarni tekshirish
        const match1 = p.id === id
        const match2 = p.id === numId
        const match3 = Number(p.id) === numId
        const match4 = String(p.id) === strId
        const match5 = p.id === Number(id)
        
        const match = match1 || match2 || match3 || match4 || match5
        
        if (match) {
          console.log('✅ Found in store!', {
            patientId: p.id,
            patientIdType: typeof p.id,
            searchedId: id,
            searchedIdType: typeof id,
            matches: { match1, match2, match3, match4, match5 }
          })
        }
        return match
      })
      
      if (foundInStore) {
        currentPatient.value = foundInStore
        loading.value = false
        return currentPatient.value
      }

      console.log('⚠️ Not found in store, trying API...')
      
      // Agar store'da topilmasa, API'dan olishga harakat qilish
      const patient = await getPatientById(id)
      if (patient) {
        console.log('✅ Found via API:', patient)
        console.log('API patient ID:', patient.id, 'Type:', typeof patient.id)
        currentPatient.value = patient
        // Store'ga qo'shish (agar yo'q bo'lsa)
        const exists = items.value.find(p => {
          const match = p.id === patient.id || 
                 String(p.id) === String(patient.id) ||
                 Number(p.id) === Number(patient.id)
          return match
        })
        if (!exists) {
          console.log('➕ Adding patient to store')
          items.value.push(patient)
        }
        loading.value = false
        return currentPatient.value
      } else {
        console.warn('⚠️ API returned null or undefined')
      }

      console.error('❌ Patient not found anywhere')
      loading.value = false
      return null
    } catch (err) {
      error.value = err.message || 'Bemorni yuklashda xatolik'
      console.error('❌ Failed to fetch patient:', err)
      
      // Xatolik bo'lsa ham store'dan qidirish
      const numId = Number(id)
      const strId = String(id)
      const foundInStore = items.value.find(p => {
        return p.id === id || 
               p.id === numId || 
               String(p.id) === strId ||
               Number(p.id) === numId
      })
      
      if (foundInStore) {
        console.log('✅ Found in store after error:', foundInStore)
        currentPatient.value = foundInStore
        loading.value = false
        return currentPatient.value
      }
      
      loading.value = false
      return null
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

  // Alias for compatibility
  const getPatientById = async (id) => {
    return fetchPatientById(id)
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
    getPatientById,
    addPatient,
    editPatient,
    removePatient,
    clearCurrentPatient
  }
})
