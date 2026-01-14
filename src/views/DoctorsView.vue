<template>
  <AdminLayout>
    <!-- Add Doctor Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Add New Doctor</h2>

      <DoctorForm
        :initial-data="form"
        :is-submitting="isSubmitting"
        :disabled="doctorsStore.items.length >= 4"
        button-text="Add Doctor"
        @submit="handleCreateDoctor"
      >
        <template #error>
          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>
          <p v-if="doctorsStore.items.length >= 4" class="text-sm text-amber-600 font-medium mt-2">
            Maximum of 4 doctors reached. Please remove a doctor before adding a new one.
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
          Export to db.json
        </button>
      </template>
    </DoctorsTable>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDoctorsStore } from '@/stores/doctors'
import { downloadDbJson } from '@/api/doctorsApi'
import { useToast } from '@/composables/useToast'
import AdminLayout from '@/layouts/AdminLayout.vue'
import DoctorForm from '@/components/admin/DoctorForm.vue'
import DoctorsTable from '@/components/admin/DoctorsTable.vue'

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
    toast.warning('Maximum 4 ta doktor qo\'shish mumkin')
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

    toast.success('Doktor muvaffaqiyatli qo\'shildi!')
  } catch {
    showFormError.value = true
    toast.error('Doktor qo\'shishda xatolik yuz berdi')
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (confirm('Haqiqatan ham bu doktorni o\'chirmoqchimisiz?')) {
    try {
      await doctorsStore.remove(id)
      toast.success('Doktor muvaffaqiyatli o\'chirildi!')
    } catch {
      toast.error('Doktorni o\'chirishda xatolik yuz berdi')
    }
  }
}

const handleExportDbJson = () => {
  try {
    downloadDbJson()
    toast.success('Ma\'lumotlar muvaffaqiyatli yuklab olindi!')
  } catch {
    toast.error('Yuklab olishda xatolik yuz berdi')
  }
}
</script>
