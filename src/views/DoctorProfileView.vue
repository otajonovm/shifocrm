<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto space-y-5">
      <div v-if="isLoading" class="text-center py-8">
        <LoadingSpinner :message="t('doctorProfile.loading')" />
      </div>

      <template v-else>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('page.doctorProfile.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ t('page.doctorProfile.subtitle') }}</p>
        </div>

        <!-- Tab navigatsiya -->
        <nav class="flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
          <button
            v-for="tab in profileTabs"
            :key="tab.id"
            type="button"
            class="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            :class="activeTab === tab.id
              ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-100'
              : 'text-gray-600 hover:text-gray-900'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- Onlayn havola kartasi -->
        <section
          v-show="activeTab === 'online'"
          class="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 shadow-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="text-lg font-bold text-sky-900">{{ t('doctorProfile.linkCardTitle') }}</h2>
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
              class="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 font-mono text-sm text-sky-900 break-all"
            >
              {{ publicProfileUrl }}
            </div>
            <div
              v-else
              class="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800"
            >
              {{ t('doctorProfile.slugRequiredBadge') }}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="!hasSlug"
              class="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="copyPublicLink"
            >
              {{ t('doctorProfile.copyLink') }}
            </button>
            <a
              :href="hasSlug ? publicProfileUrl : undefined"
              :aria-disabled="!hasSlug"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {{ t('doctorProfile.openPage') }}
            </a>
            <button
              type="button"
              :disabled="!hasSlug"
              class="rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="openQrModal"
            >
              {{ t('doctorProfile.getQrCode') }}
            </button>
            <button
              type="button"
              :disabled="!hasSlug"
              class="rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              @click="sharePublicLink"
            >
              {{ t('doctorProfile.shareNative') }}
            </button>
          </div>
        </section>

        <!-- Asosiy forma (bitta instance — tablar orasida ma'lumot saqlanadi) -->
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <DoctorProfileForm
            :section="activeTab"
            :compact-schedule="activeTab === 'schedule'"
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

          <div v-show="activeTab === 'personal'" class="border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-1">{{ t('doctorProfile.languageTitle') }}</h2>
            <p class="text-sm text-gray-500 mb-4">{{ t('doctorProfile.languageHint') }}</p>
            <div class="grid grid-cols-2 gap-2 max-w-sm">
              <button
                type="button"
                class="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
                :class="currentLocale === 'uz'
                  ? 'border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-100'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'"
                @click="changeLocale('uz')"
              >
                🇺🇿 {{ t('language.uz') }}
              </button>
              <button
                type="button"
                class="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
                :class="currentLocale === 'ru'
                  ? 'border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-100'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'"
                @click="changeLocale('ru')"
              >
                🇷🇺 {{ t('language.ru') }}
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'personal'" class="border-t border-gray-200 pt-6">
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

    <!-- QR kod modali -->
    <div v-if="showQrModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeQrModal">
      <div class="fixed inset-0 bg-black/40" @click="closeQrModal" />
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <button
            type="button"
            class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            :aria-label="t('doctorProfile.collapseDay')"
            @click="closeQrModal"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 class="text-lg font-semibold text-gray-900">{{ t('doctorProfile.qrTitle') }}</h3>
          <p class="mt-1 text-sm text-gray-500">{{ t('doctorProfile.qrSubtitle') }}</p>

          <div class="mt-5 flex justify-center">
            <div class="relative w-full max-w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div class="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
                <canvas ref="qrCanvasRef" class="block h-full w-full" />
                <div
                  v-if="!profile.is_public"
                  class="absolute inset-0 flex items-center justify-center bg-black/40 px-4"
                >
                  <span class="text-center text-sm font-semibold text-white">{{ t('doctorProfile.qrClosedWatermark') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="!canDownloadQr"
              class="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              @click="downloadQrPng"
            >
              {{ t('doctorProfile.downloadQr') }}
            </button>
            <button
              type="button"
              :disabled="!hasSlug"
              class="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="copyPublicLink"
            >
              {{ t('doctorProfile.copyLink') }}
            </button>
          </div>
        </div>
      </div>
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
import { useI18nStore } from '@/stores/i18n'
import { findDoctorForSoloClinic, getDoctorByClinicId } from '@/services/adminService'
import { isSolo } from '@/lib/roles'
import { phoneAuthLookupVariants } from '@/lib/phoneUz'
import MainLayout from '@/layouts/MainLayout.vue'
import DoctorProfileForm from '@/components/doctor/DoctorProfileForm.vue'
import PasswordChangeForm from '@/components/doctor/PasswordChangeForm.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'
import SuccessMessage from '@/components/shared/SuccessMessage.vue'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const i18nStore = useI18nStore()
const { t, locale } = useI18n()
const toast = useToast()

const profile = ref({
  full_name: '',
  phone: '',
  email: '',
  specialization: '',
  is_active: true,
  work_schedule: null,
  is_public: false,
  public_slug: '',
  public_bio: '',
  public_avatar_url: '',
  public_phone: '',
  public_telegram: '',
  public_whatsapp: '',
  public_location_url: '',
})

const existingDoctor = ref(null)
const passwordFormRef = ref(null)
const activeTab = ref('personal')
const showQrModal = ref(false)

const isLoading = ref(true)
const isSubmitting = ref(false)
const isChangingPassword = ref(false)
const updateError = ref(null)
const updateSuccess = ref(false)
const passwordError = ref(null)
const passwordSuccess = ref(false)
const passwordResetTrigger = ref(0)
const qrCanvasRef = ref(null)

const profileTabs = computed(() => [
  { id: 'personal', label: t('doctorProfile.tabPersonal') },
  { id: 'online', label: t('doctorProfile.tabOnline') },
  { id: 'schedule', label: t('doctorProfile.tabSchedule') },
])

const hasSlug = computed(() => Boolean(String(profile.value.public_slug || '').trim()))
const publicProfileUrl = computed(() => {
  if (!hasSlug.value) return ''
  return `${window.location.origin}/d/${profile.value.public_slug}`
})
const canDownloadQr = computed(() => Boolean(profile.value.is_public && hasSlug.value))
const currentLocale = computed(() => locale.value)

const changeLocale = (nextLocale) => {
  if (nextLocale !== 'uz' && nextLocale !== 'ru') return
  i18nStore.setLocale(nextLocale)
}
const shareTitle = computed(() => {
  const fullName = String(profile.value.full_name || '').trim()
  return fullName ? `Dr. ${fullName}` : t('doctorProfile.shareTitleFallback')
})
const shareText = computed(() => t('doctorProfile.shareText'))

const openQrModal = async () => {
  showQrModal.value = true
  await nextTick()
  await renderQr()
}

const closeQrModal = () => {
  showQrModal.value = false
}

const renderQrOnCanvas = async (canvas) => {
  if (!canvas) return
  const container = canvas.parentElement
  const displaySize = Math.max(200, Math.floor(container?.getBoundingClientRect().width || 240))
  const dpr = window.devicePixelRatio || 1
  const pixelSize = Math.floor(displaySize * dpr)
  canvas.width = pixelSize
  canvas.height = pixelSize
  canvas.style.width = `${displaySize}px`
  canvas.style.height = `${displaySize}px`
  const text = hasSlug.value ? publicProfileUrl.value : 'https://example.com'
  await QRCode.toCanvas(canvas, text, {
    width: pixelSize,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })
}

const renderQr = async () => {
  await renderQrOnCanvas(qrCanvasRef.value)
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
  [publicProfileUrl, () => profile.value.is_public, showQrModal],
  async () => {
    if (!showQrModal.value) return
    await nextTick()
    await renderQr()
  },
)

const syncSessionDoctorId = (doctorId) => {
  const id = Number(doctorId)
  if (!Number.isFinite(id)) return
  const current = authStore.user
  if (!current || current.id) return
  const nextUser = { ...current, id }
  authStore.user = nextUser
  localStorage.setItem('user', JSON.stringify(nextUser))
}

const resolveDoctorId = async () => {
  const user = authStore.user
  if (user?.id && Number.isFinite(Number(user.id))) {
    return Number(user.id)
  }

  const clinicId = Number(authStore.userClinicId ?? user?.clinic_id)
  if (Number.isFinite(clinicId)) {
    const ownerLogin = user?.login || authStore.userEmail || ''
    const clinicDoctor = isSolo(authStore)
      ? await findDoctorForSoloClinic(clinicId, ownerLogin)
      : await getDoctorByClinicId(clinicId)
    if (clinicDoctor?.id) {
      syncSessionDoctorId(clinicDoctor.id)
      return Number(clinicDoctor.id)
    }
  }

  const lookupKeys = [user?.email, user?.phone, authStore.userEmail].filter(Boolean)
  if (doctorsStore.items.length === 0) {
    await doctorsStore.fetchAll()
  }

  for (const key of lookupKeys) {
    const doctor = doctorsStore.items.find((item) => {
      if (!item) return false
      if (item.email && String(item.email).toLowerCase() === String(key).toLowerCase()) return true
      if (item.phone && item.phone === key) return true
      const variants = phoneAuthLookupVariants(key)
      return variants.some((variant) => variant === item.phone)
    })
    if (doctor?.id) {
      syncSessionDoctorId(doctor.id)
      return Number(doctor.id)
    }
  }

  return null
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
      public_bio: doctor.public_bio || '',
      public_avatar_url: doctor.public_avatar_url || '',
      public_phone: doctor.public_phone || '',
      public_telegram: doctor.public_telegram || '',
      public_whatsapp: doctor.public_whatsapp || '',
      public_location_url: doctor.public_location_url || '',
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
      public_slug: safeSlug,
      public_bio: profileData.public_bio,
      public_avatar_url: profileData.public_avatar_url,
      public_phone: profileData.public_phone,
      public_telegram: profileData.public_telegram,
      public_whatsapp: profileData.public_whatsapp,
      public_location_url: profileData.public_location_url,
    })
    existingDoctor.value = updated
    profile.value = {
      ...profile.value,
      ...profileData,
      public_slug: safeSlug,
    }

    if (showQrModal.value) {
      await nextTick()
      await renderQr()
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
