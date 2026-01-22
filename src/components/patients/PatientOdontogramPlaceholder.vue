<template>
  <PatientOdontogram
    :patient="patient"
    :doctor-id="doctorId"
    :doctor-name="doctorName"
  />
</template>

<script setup>
import { computed } from 'vue'
import { usePatientsStore } from '@/stores/patients'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import PatientOdontogram from './PatientOdontogram.vue'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
})

const patientsStore = usePatientsStore()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()

const patient = computed(() => {
  return patientsStore.items.find(p => p.id === Number(props.patientId)) || 
         patientsStore.currentPatient
})

const doctorId = computed(() => {
  return authStore.userId
})

const doctorName = computed(() => {
  if (authStore.userRole === 'admin') return 'Admin'
  const doctor = doctorsStore.items.find(d => d.id === authStore.userId)
  return doctor?.full_name || ''
})
</script>
