<template>
  <PatientOdontogram
    v-if="patient"
    :patient="patient"
    :doctor-id="doctorId"
    :doctor-name="doctorName"
    :initial-visit-id="visitId"
  />
  <div v-else class="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
    {{ t('patientDetail.notFound') }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePatientsStore } from '@/stores/patients'
import { useAuthStore } from '@/stores/auth'
import { isAdminLike } from '@/lib/roles'
import { useDoctorsStore } from '@/stores/doctors'
import PatientOdontogram from './PatientOdontogram.vue'

const props = defineProps({
  patientId: {
    type: [String, Number],
    default: null,
  },
  patient: {
    type: Object,
    default: null,
  },
  visitId: {
    type: [String, Number],
    default: null,
  },
})

const visitId = computed(() => {
  if (!props.visitId) return null
  return Number(props.visitId)
})

const patientsStore = usePatientsStore()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const isAdminLikeUser = computed(() => isAdminLike(authStore))

const patient = computed(() => {
  if (props.patient) return props.patient
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
  if (isAdminLikeUser.value) return t('role.administrator')
  const doctor = doctorsStore.items.find(d => d.id === doctorId.value)
  return doctor?.full_name || ''
})
</script>
