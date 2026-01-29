<template>
  <MainLayout>
    <!-- Add Doctor Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('doctors.addTitle') }}</h2>

      <DoctorForm
        :initial-data="form"
        :is-submitting="isSubmitting"
        :disabled="limitReached"
        :button-text="t('doctors.addButton')"
        @submit="handleCreateDoctor"
      >
        <template #error>
          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>
          <p v-if="limitReached" class="text-sm text-amber-600 font-medium mt-2">
            {{ t('doctors.maxDoctorsWarningDynamic', { max: maxDoctors }) }}
          </p>
        </template>
      </DoctorForm>
    </div>

    <!-- Doctors List -->
    <DoctorsTable
      :doctors="doctorsStore.items"
      :is-loading="doctorsStore.isLoading"
      @refresh="doctorsStore.fetchAll()"
      @delete="handleDeleteDoctor"
    >
      <template #actions>
        <button
          @click="handleExportDbJson"
          class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          {{ t('doctors.exportDb') }}
        </button>
      </template>
    </DoctorsTable>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { downloadDbJson } from '@/api/doctorsApi'
import {
  getDefaultClinicId,
  getClinic,
  getDoctorCountByClinic,
  MAX_DOCTORS_ERROR,
} from '@/services/adminService'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/layouts/MainLayout.vue'
import DoctorForm from '@/components/admin/DoctorForm.vue'
import DoctorsTable from '@/components/admin/DoctorsTable.vue'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const toast = useToast()
const { t } = useI18n()

const form = ref({
  full_name: '',
  phone: '',
  email: '',
  password: '',
  specialization: '',
  is_active: true,
})

const isSubmitting = ref(false)
const showFormError = ref(false)
const maxDoctors = ref(4)
const doctorCount = ref(0)

const limitReached = computed(() => doctorCount.value >= maxDoctors.value)

async function fetchLimit() {
  try {
    const cid = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
      ? Number(authStore.userClinicId)
      : await getDefaultClinicId()
    if (!cid) return
    const [clinic, count] = await Promise.all([
      getClinic(cid),
      getDoctorCountByClinic(cid),
    ])
    if (clinic) maxDoctors.value = Math.max(1, Number(clinic.max_doctors) || 4)
    doctorCount.value = count
  } catch {
    doctorCount.value = doctorsStore.items.length
  }
}

onMounted(async () => {
  await doctorsStore.fetchAll()
  await fetchLimit()
})

const handleCreateDoctor = async (formData) => {
  if (limitReached.value) {
    showFormError.value = true
    toast.warning(MAX_DOCTORS_ERROR)
    return
  }

  isSubmitting.value = true
  showFormError.value = false

  try {
    const clinicId = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
      ? Number(authStore.userClinicId)
      : null
    await doctorsStore.create({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      is_active: formData.is_active,
      ...(clinicId != null && { clinic_id: clinicId }),
    })

    form.value = {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      specialization: '',
      is_active: true,
    }

    await fetchLimit()
    toast.success(t('doctors.toastCreated'))
  } catch {
    showFormError.value = true
    toast.error(doctorsStore.error || t('doctors.errorCreate'))
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (confirm(t('doctors.confirmDelete'))) {
    try {
      await doctorsStore.remove(id)
      await fetchLimit()
      toast.success(t('doctors.toastDeleted'))
    } catch {
      toast.error(t('doctors.errorDelete'))
    }
  }
}

const handleExportDbJson = () => {
  try {
    downloadDbJson()
    toast.success(t('doctors.toastExport'))
  } catch {
    toast.error(t('doctors.errorExport'))
  }
}
</script>
