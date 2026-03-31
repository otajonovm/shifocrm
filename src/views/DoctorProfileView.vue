<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <LoadingSpinner :message="t('doctorProfile.loading')" />
      </div>

      <template v-else>
        <section class="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-xl font-bold text-sky-900">{{ t('doctorProfile.linkCardTitle') }}</h2>
              <p class="text-sm text-sky-700 mt-1">{{ t('doctorProfile.linkCardSubtitle') }}</p>
            </div>
            <span
              :class="profile.is_public ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'"
              class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
            >
              {{ profile.is_public ? t('doctorProfile.profileStatusOpen') : t('doctorProfile.profileStatusClosed') }}
            </span>
          </div>

          <div class="mb-4">
            <div
              v-if="hasSlug"
              class="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 font-mono text-sm sm:text-base text-sky-900 break-all"
            >
              {{ publicProfileUrl }}
            </div>
            <div
              v-else
              class="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs sm:text-sm font-medium text-amber-800"
            >
              {{ t('doctorProfile.slugRequiredBadge') }}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
            <button
              type="button"
              @click="copyPublicLink"
              :disabled="!hasSlug"
              class="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ t('doctorProfile.copyLink') }}
            </button>
            <a
              :href="hasSlug ? publicProfileUrl : undefined"
              :aria-disabled="!hasSlug"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {{ t('doctorProfile.openPage') }}
            </a>
            <a
              :href="telegramShareUrl"
              :aria-disabled="!hasSlug"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-sky-600 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Telegram
            </a>
            <a
              :href="whatsAppShareUrl"
              :aria-disabled="!hasSlug"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              WhatsApp
            </a>
            <button
              type="button"
              @click="sharePublicLink"
              :disabled="!hasSlug"
              class="rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ t('doctorProfile.shareNative') }}
            </button>
          </div>

          <div class="rounded-2xl border border-sky-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ t('doctorProfile.qrTitle') }}</p>
                <p class="text-xs text-gray-500">{{ t('doctorProfile.qrSubtitle') }}</p>
              </div>
              <button
                type="button"
                @click="downloadQrPng"
                :disabled="!canDownloadQr"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ t('doctorProfile.downloadQr') }}
              </button>
            </div>

            <div class="relative inline-block rounded-xl border border-gray-200 overflow-hidden bg-white">
              <canvas ref="qrCanvasRef" class="block h-52 w-52 sm:h-60 sm:w-60" />
              <div
                v-if="!profile.is_public"
                class="absolute inset-0 flex items-center justify-center bg-black/40 px-4"
              >
                <span class="text-center text-sm font-semibold text-white">{{ t('doctorProfile.qrClosedWatermark') }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
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

          <div class="border-t border-gray-200 pt-6 mt-6">
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
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import QRCode from 'qrcode'
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
const toast = useToast()

const profile = ref({
  full_name: '',
  phone: '',
  email: '',
  specialization: '',
  is_active: true,
  work_schedule: null,
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
const qrCanvasRef = ref(null)

const hasSlug = computed(() => Boolean(String(profile.value.public_slug || '').trim()))
const publicProfileUrl = computed(() => {
  if (!hasSlug.value) return ''
  return `${window.location.origin}/d/${profile.value.public_slug}`
})
const canDownloadQr = computed(() => Boolean(profile.value.is_public && hasSlug.value))
const shareTitle = computed(() => {
  const fullName = String(profile.value.full_name || '').trim()
  return fullName ? `Dr. ${fullName}` : t('doctorProfile.shareTitleFallback')
})
const shareText = computed(() => t('doctorProfile.shareText'))
const telegramShareUrl = computed(() => {
  if (!hasSlug.value) return undefined
  return `https://t.me/share/url?url=${encodeURIComponent(publicProfileUrl.value)}&text=${encodeURIComponent(shareText.value)}`
})
const whatsAppShareUrl = computed(() => {
  if (!hasSlug.value) return undefined
  const text = `${shareText.value}\n${publicProfileUrl.value}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
})

const renderQr = async () => {
  if (!qrCanvasRef.value) return
  const text = hasSlug.value ? publicProfileUrl.value : 'https://example.com'
  await QRCode.toCanvas(qrCanvasRef.value, text, {
    width: 480,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff'
    }
  })
}

const copyPublicLink = async () => {
  if (!hasSlug.value) {
    toast.error(t('doctorProfile.slugRequiredBadge'))
    return
  }
  try {
    await navigator.clipboard.writeText(publicProfileUrl.value)
    toast.success(t('doctorProfile.copied'))
  } catch {
    toast.error(t('doctorProfile.copyFailed'))
  }
}

const sharePublicLink = async () => {
  if (!hasSlug.value) {
    toast.error(t('doctorProfile.slugRequiredBadge'))
    return
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle.value,
        text: shareText.value,
        url: publicProfileUrl.value,
      })
      return
    } catch {
      // user cancelled or native share unavailable
    }
  }

  await copyPublicLink()
}

const downloadQrPng = async () => {
  if (!canDownloadQr.value || !qrCanvasRef.value) return

  const sourceCanvas = qrCanvasRef.value
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = sourceCanvas.width * 2
  exportCanvas.height = sourceCanvas.height * 2

  const exportContext = exportCanvas.getContext('2d')
  if (!exportContext) return
  exportContext.imageSmoothingEnabled = false
  exportContext.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height)

  const safeSlug = String(profile.value.public_slug || 'doctor').trim() || 'doctor'
  const link = document.createElement('a')
  link.href = exportCanvas.toDataURL('image/png')
  link.download = `${safeSlug}-qr@2x.png`
  link.click()
}

onMounted(async () => {
  await loadProfile()
})

watch(
  [publicProfileUrl, () => profile.value.is_public],
  async () => {
    await nextTick()
    await renderQr()
  },
  { immediate: true }
)

const resolveDoctorId = async () => {
  if (authStore.user?.id) return authStore.user.id
  if (!authStore.userEmail) return null
  if (doctorsStore.items.length === 0) {
    await doctorsStore.fetchAll()
  }
  const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail)
  return doctor?.id || null
}

const loadProfile = async () => {
  isLoading.value = true
  try {
    const doctorId = await resolveDoctorId()
    if (!doctorId) {
      throw new Error(t('doctorProfile.errorProfileNotLoaded'))
    }
    const doctor = await doctorsStore.getById(doctorId)
    if (!doctor) throw new Error('Doctor profile not found')
    existingDoctor.value = doctor
    profile.value = {
      full_name: doctor.full_name || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      specialization: doctor.specialization || '',
      is_active: doctor.is_active ?? true,
      work_schedule: doctor.work_schedule || null,
      is_public: doctor.is_public ?? false,
      public_slug: doctor.public_slug || '',
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
    const doctorId = await resolveDoctorId()
    if (!doctorId) {
      throw new Error(t('doctorProfile.errorProfileNotLoaded'))
    }

    const safeSlug = profileData.public_slug
      ? profileData.public_slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : ''

    const updated = await doctorsStore.update(doctorId, {
      full_name: profileData.full_name,
      phone: profileData.phone,
      specialization: profileData.specialization,
      is_active: profileData.is_active,
      work_schedule: profileData.work_schedule,
      is_public: profileData.is_public,
      public_slug: safeSlug
    })
    existingDoctor.value = updated
    profile.value = {
      ...profile.value,
      ...profileData,
      public_slug: safeSlug,
    }

    await nextTick()
    await renderQr()

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
    const doctorId = await resolveDoctorId()
    if (!doctorId) {
      throw new Error(t('doctorProfile.errorProfileNotLoaded'))
    }
    const updated = await doctorsStore.update(doctorId, {
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
