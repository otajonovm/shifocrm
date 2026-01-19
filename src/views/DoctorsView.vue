<template>
  <MainLayout>
    <!-- Add Doctor Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('doctors.addNewDoctor') }}</h2>

      <DoctorForm
        :initial-data="form"
        :is-submitting="isSubmitting"
        :disabled="doctorsStore.items.length >= 4"
        :button-text="$t('doctors.buttonText')"
        @submit="handleCreateDoctor"
      >
        <template #error>
          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>
          <p v-if="doctorsStore.items.length >= 4" class="text-sm text-amber-600 font-medium mt-2">
            {{ $t('doctors.maxDoctorsReached') }}
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
          {{ $t('doctors.exportToDb') }}
        </button>
      </template>
    </DoctorsTable>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDoctorsStore } from '@/stores/doctors'
import { downloadDbJson } from '@/api/doctorsApi'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import DoctorForm from '@/components/admin/DoctorForm.vue'
import DoctorsTable from '@/components/admin/DoctorsTable.vue'

const { t } = useI18n()

const doctorsStore = useDoctorsStore()
const toast = useToast()

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

onMounted(() => {
  doctorsStore.fetchAll()
})

const handleCreateDoctor = async (formData) => {
  if (doctorsStore.items.length >= 4) {
    showFormError.value = true
    toast.warning(t('doctors.maxDoctorsReached'))
    return
  }

  isSubmitting.value = true
  showFormError.value = false

  try {
    await doctorsStore.create({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      is_active: formData.is_active,
    })

    form.value = {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      specialization: '',
      is_active: true,
    }

    toast.success(t('success.saved'))
  } catch {
    showFormError.value = true
    toast.error(t('errors.saveError'))
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (confirm(t('common.confirm'))) {
    try {
      await doctorsStore.remove(id)
      toast.success(t('success.deleted'))
    } catch {
      toast.error(t('errors.deleteError'))
    }
  }
}

const handleExportDbJson = () => {
  try {
    downloadDbJson()
    toast.success(t('success.saved'))
  } catch {
    toast.error(t('errors.saveError'))
  }
}
</script>
