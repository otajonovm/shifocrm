<template>
  <MainLayout>
    <!-- Add Doctor Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
<<<<<<< HEAD
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('doctors.addNewDoctor') }}</h2>
=======
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('doctors.addTitle') }}</h2>
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18

      <DoctorForm
        :initial-data="form"
        :is-submitting="isSubmitting"
        :disabled="doctorsStore.items.length >= 4"
<<<<<<< HEAD
        :button-text="$t('doctors.buttonText')"
=======
        :button-text="t('doctors.addButton')"
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
        @submit="handleCreateDoctor"
      >
        <template #error>
          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>
          <p v-if="doctorsStore.items.length >= 4" class="text-sm text-amber-600 font-medium mt-2">
<<<<<<< HEAD
            {{ $t('doctors.maxDoctorsReached') }}
=======
            {{ t('doctors.maxDoctorsWarning') }}
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
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
<<<<<<< HEAD
          {{ $t('doctors.exportToDb') }}
=======
          {{ t('doctors.exportDb') }}
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
        </button>
      </template>
    </DoctorsTable>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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

onMounted(() => {
  doctorsStore.fetchAll()
})

const handleCreateDoctor = async (formData) => {
  if (doctorsStore.items.length >= 4) {
    showFormError.value = true
<<<<<<< HEAD
    toast.warning(t('doctors.maxDoctorsReached'))
=======
    toast.warning(t('doctors.maxDoctorsToast'))
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
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

<<<<<<< HEAD
    toast.success(t('success.saved'))
  } catch {
    showFormError.value = true
    toast.error(t('errors.saveError'))
=======
    toast.success(t('doctors.toastCreated'))
  } catch {
    showFormError.value = true
    toast.error(t('doctors.errorCreate'))
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
<<<<<<< HEAD
  if (confirm(t('common.confirm'))) {
    try {
      await doctorsStore.remove(id)
      toast.success(t('success.deleted'))
    } catch {
      toast.error(t('errors.deleteError'))
=======
  if (confirm(t('doctors.confirmDelete'))) {
    try {
      await doctorsStore.remove(id)
      toast.success(t('doctors.toastDeleted'))
    } catch {
      toast.error(t('doctors.errorDelete'))
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
    }
  }
}

const handleExportDbJson = () => {
  try {
    downloadDbJson()
<<<<<<< HEAD
    toast.success(t('success.saved'))
  } catch {
    toast.error(t('errors.saveError'))
=======
    toast.success(t('doctors.toastExport'))
  } catch {
    toast.error(t('doctors.errorExport'))
>>>>>>> 15c7b98d3af6412713edde1f137b3b8bc0c92b18
  }
}
</script>
