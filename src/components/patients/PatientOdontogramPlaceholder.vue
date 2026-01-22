<template>
  <PatientOdontogram
    :patient="patient"
    :doctor-id="doctorId"
    :doctor-name="doctorName"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

const patient = computed(() => {
  return patientsStore.items.find(p => p.id === Number(props.patientId)) || 
         patientsStore.currentPatient
})

const doctorId = computed(() => {
  if (authStore.user?.id) return authStore.user.id
  if (!authStore.userEmail) return null
  const doctor = doctorsStore.items.find(d => d.email === authStore.userEmail)
  return doctor?.id || null
})

const doctorName = computed(() => {
  if (authStore.userRole === 'admin') return t('role.admin')
  const doctor = doctorsStore.items.find(d => d.id === doctorId.value)
  return doctor?.full_name || ''
})
</script>
