<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <LoadingSpinner :message="t('doctorProfile.loading')" />
      </div>

      <!-- Profile Form -->
      <div v-else class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('doctorProfile.personalInfo') }}</h2>

        <DoctorProfileForm
          :initial-data="profile"
          :is-submitting="isSubmitting"
          @submit="handleUpdateProfile"
        >
          <template #error>
            <ErrorMessage v-if="updateError" :message="updateError" />
          </template>
          <template #success>
            <SuccessMessage v-if="updateSuccess" :message="t('doctorProfile.profileUpdated')" />
          </template>
        </DoctorProfileForm>

        <!-- Password Change Section -->
        <div class="border-t pt-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('doctorProfile.changePassword') }}</h2>
          <PasswordChangeForm
            ref="passwordFormRef"
            :is-changing-password="isChangingPassword"
            :reset-trigger="passwordResetTrigger"
            @submit="handleChangePassword"
          >
            <template #error>
              <ErrorMessage v-if="passwordError" :message="passwordError" />
            </template>
            <template #success>
              <SuccessMessage v-if="passwordSuccess" :message="t('doctorProfile.passwordUpdated')" />
            </template>
          </PasswordChangeForm>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import MainLayout from '@/layouts/MainLayout.vue'
import DoctorProfileForm from '@/components/doctor/DoctorProfileForm.vue'
import PasswordChangeForm from '@/components/doctor/PasswordChangeForm.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import SuccessMessage from '@/components/shared/SuccessMessage.vue'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const { t } = useI18n()

const profile = ref({
  full_name: '',
  phone: '',
  email: '',
  specialization: '',
  is_active: true,
})

const existingDoctor = ref(null)
const passwordFormRef = ref(null)

const isLoading = ref(true)
const isSubmitting = ref(false)
const isChangingPassword = ref(false)
const updateError = ref(null)
const updateSuccess = ref(false)
const passwordError = ref(null)
const passwordSuccess = ref(false)
const passwordResetTrigger = ref(0)

onMounted(async () => {
  await loadProfile()
})

const loadProfile = async () => {
  isLoading.value = true
  try {
    const doctor = await doctorsStore.getById(authStore.userId)
    if (!doctor) throw new Error('Doctor profile not found')
    existingDoctor.value = doctor
    profile.value = {
      full_name: doctor.full_name || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      specialization: doctor.specialization || '',
      is_active: doctor.is_active ?? true,
    }
  } catch (err) {
    updateError.value = err.message || 'Failed to load profile'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleUpdateProfile = async (profileData) => {
  isSubmitting.value = true
  updateError.value = null
  updateSuccess.value = false

  try {
    const updated = await doctorsStore.update(authStore.userId, {
      full_name: profileData.full_name,
      phone: profileData.phone,
      specialization: profileData.specialization,
      is_active: profileData.is_active,
    })
    existingDoctor.value = updated
    profile.value = {
      ...profile.value,
      ...profileData,
    }
    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)
  } catch (err) {
    updateError.value = err.message || 'Failed to update profile'
  } finally {
    isSubmitting.value = false
  }
}

const handleChangePassword = async (passwordData) => {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    passwordError.value = t('doctorProfile.errorPasswordMismatch')
    return
  }

  if (passwordData.newPassword.length < 6) {
    passwordError.value = t('doctorProfile.errorPasswordLength')
    return
  }

  if (!existingDoctor.value) {
    passwordError.value = t('doctorProfile.errorProfileNotLoaded')
    return
  }

  if (existingDoctor.value.password !== passwordData.oldPassword) {
    passwordError.value = t('doctorProfile.errorPasswordIncorrect')
    return
  }

  isChangingPassword.value = true
  passwordError.value = null
  passwordSuccess.value = false

  try {
    const updated = await doctorsStore.update(authStore.userId, {
      password: passwordData.newPassword,
    })
    existingDoctor.value = updated

    passwordSuccess.value = true
    passwordResetTrigger.value++
    if (passwordFormRef.value) {
      passwordFormRef.value.resetForm()
    }
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (err) {
    passwordError.value = err.message || t('doctorProfile.errorPasswordChange')
  } finally {
    isChangingPassword.value = false
  }
}
</script>
