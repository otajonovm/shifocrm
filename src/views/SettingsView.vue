<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('settings.title') }}</h1>
        <p class="text-gray-500">{{ t('settings.subtitle') }}</p>
      </div>

      <!-- Clinic Profile (clinic admin only) -->
      <div v-if="isClinicAdmin" class="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div class="flex items-center gap-3">
          <PhotoIcon class="w-6 h-6 text-gray-400" />
          <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.logoTitle') }}</h2>
        </div>
        <p class="text-sm text-gray-500">{{ t('settings.logoHint') }}</p>

        <div class="flex flex-wrap items-start gap-6">
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="profile.logo_url"
                :src="profile.logo_url"
                alt="Logo"
                class="w-full h-full object-contain"
              />
              <PhotoIcon v-else class="w-10 h-10 text-gray-300" />
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors"
              >
                <ArrowUpTrayIcon class="w-4 h-4" />
                {{ t('settings.logoUpload') }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onLogoSelect"
                />
              </label>
              <button
                v-if="profile.logo_url"
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="removeLogo"
              >
                <TrashIcon class="w-4 h-4" />
                {{ t('settings.logoRemove') }}
              </button>
            </div>
          </div>
          <div class="flex-1 min-w-[200px] space-y-2">
            <label class="block text-sm font-medium text-gray-700">{{ t('settings.clinicNameLabel') }}</label>
            <input
              v-model="profile.name"
              type="text"
              :placeholder="t('settings.clinicNamePlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500">{{ t('settings.clinicNameHint') }}</p>
          </div>

          <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('settings.addressLabel') }}</label>
              <input
                v-model="profile.address"
                type="text"
                :placeholder="t('settings.addressPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('settings.locationUrlLabel') }}</label>
              <input
                v-model="profile.location_url"
                type="url"
                :placeholder="t('settings.locationUrlPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div class="w-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('settings.descriptionLabel') }}</label>
            <textarea
              v-model="profile.description"
              rows="3"
              :placeholder="t('settings.descriptionPlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div class="w-full border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 class="font-semibold text-gray-900">{{ t('settings.workingHoursTitle') }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="day in dayOptions"
                :key="day.key"
                class="rounded-lg border border-gray-200 p-3 space-y-2"
              >
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input v-model="profile.work_schedule.days[day.key].enabled" type="checkbox" class="rounded border-gray-300" />
                  {{ day.label }}
                </label>
                <input
                  v-model="profile.work_schedule.days[day.key].start"
                  type="time"
                  :disabled="!profile.work_schedule.days[day.key].enabled"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                />
                <input
                  v-model="profile.work_schedule.days[day.key].end"
                  type="time"
                  :disabled="!profile.work_schedule.days[day.key].enabled"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div class="w-full border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 class="font-semibold text-gray-900">{{ t('settings.websiteSectionTitle') }}</h3>
            <p class="text-sm text-gray-500">{{ t('settings.websiteSectionHint') }}</p>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('settings.websiteSlugLabel') }}</label>
              <input
                v-model="profile.slug"
                type="text"
                :placeholder="t('settings.websiteSlugPlaceholder')"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p class="mt-1 text-xs text-gray-500">{{ t('settings.websiteSlugHint') }}</p>
            </div>

            <div v-if="websiteUrl" class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input
                :value="websiteUrl"
                readonly
                class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700"
              />
              <button
                type="button"
                @click="copyWebsiteUrl"
                class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {{ t('settings.copyWebsiteLink') }}
              </button>
              <a
                :href="websiteUrl"
                target="_blank"
                rel="noopener"
                class="px-4 py-2 rounded-lg bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 text-center"
              >
                {{ t('settings.openWebsite') }}
              </a>
            </div>
          </div>

          <div class="w-full flex items-center justify-between">
            <p v-if="logoError" class="text-sm text-rose-600">{{ logoError }}</p>
            <button
              type="button"
              :disabled="savingProfile"
              @click="saveClinicProfile"
              class="ml-auto px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ savingProfile ? t('settings.saving') : t('settings.saveProfile') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Doctors in clinic profile -->
      <div v-if="isClinicAdmin" class="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-5">
        <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.doctorSectionTitle') }}</h2>

        <DoctorForm
          :initial-data="doctorForm"
          :is-submitting="creatingDoctor"
          :button-text="t('settings.addDoctorFromProfile')"
          @submit="handleCreateDoctor"
        >
          <template #error>
            <p v-if="doctorError" class="text-sm text-rose-600">{{ doctorError }}</p>
          </template>
        </DoctorForm>

        <div class="border-t border-gray-100 pt-4">
          <p class="text-sm font-medium text-gray-700 mb-2">{{ t('settings.currentDoctors') }}</p>
          <div v-if="doctorsStore.items.length === 0" class="text-sm text-gray-500">{{ t('settings.noDoctorsYet') }}</div>
          <ul v-else class="space-y-1 text-sm text-gray-700">
            <li v-for="doctor in doctorsStore.items" :key="doctor.id" class="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
              <span>{{ doctor.full_name }}</span>
              <span class="text-gray-500">{{ doctor.specialization || '—' }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Language -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div class="flex items-center gap-3">
          <Cog6ToothIcon class="w-6 h-6 text-gray-400" />
          <h2 class="text-lg font-semibold text-gray-900">{{ t('settings.languageTitle') }}</h2>
        </div>
        <div class="max-w-sm">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('language.label') }}</label>
          <select
            v-model="currentLocale"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="uz">O'zbekcha</option>
            <option value="ru">Русский</option>
          </select>
          <p class="mt-2 text-sm text-gray-500">
            {{ t('settings.languageHint') }}
          </p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { useClinicStore } from '@/stores/clinic'
import { useDoctorsStore } from '@/stores/doctors'
import { useAuthStore } from '@/stores/auth'
import { resizeLogoFile } from '@/lib/logoResize'
import { Cog6ToothIcon, PhotoIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { setLocale } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { getClinic, updateClinic } from '@/services/adminService'
import DoctorForm from '@/components/admin/DoctorForm.vue'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const doctorsStore = useDoctorsStore()
const toast = useToast()

const isClinicAdmin = computed(() => authStore.userRole === 'admin')

const currentLocale = ref(locale.value)
const logoError = ref('')
const savingProfile = ref(false)
const creatingDoctor = ref(false)
const doctorError = ref('')
const currentClinicId = ref(null)

const buildDefaultSchedule = () => ({
  timezone: 'Asia/Tashkent',
  days: {
    mon: { enabled: true, start: '09:00', end: '18:00' },
    tue: { enabled: true, start: '09:00', end: '18:00' },
    wed: { enabled: true, start: '09:00', end: '18:00' },
    thu: { enabled: true, start: '09:00', end: '18:00' },
    fri: { enabled: true, start: '09:00', end: '18:00' },
    sat: { enabled: false, start: '09:00', end: '14:00' },
    sun: { enabled: false, start: '09:00', end: '14:00' },
  }
})

const normalizeSchedule = (input) => {
  const fallback = buildDefaultSchedule()
  if (!input || typeof input !== 'object') return fallback
  const merged = { ...fallback, ...input }
  merged.days = { ...fallback.days, ...(input.days || {}) }
  Object.keys(merged.days).forEach((day) => {
    merged.days[day] = { ...fallback.days[day], ...merged.days[day] }
  })
  return merged
}

const profile = ref({
  name: '',
  slug: '',
  logo_url: clinicStore.logoUrl || '',
  address: '',
  location_url: '',
  description: '',
  work_schedule: buildDefaultSchedule(),
})

const doctorForm = ref({
  full_name: '',
  phone: '',
  email: '',
  password: '',
  specialization: '',
  is_active: true,
})

const dayOptions = [
  { key: 'mon', label: t('doctorProfile.dayMon') },
  { key: 'tue', label: t('doctorProfile.dayTue') },
  { key: 'wed', label: t('doctorProfile.dayWed') },
  { key: 'thu', label: t('doctorProfile.dayThu') },
  { key: 'fri', label: t('doctorProfile.dayFri') },
  { key: 'sat', label: t('doctorProfile.daySat') },
  { key: 'sun', label: t('doctorProfile.daySun') },
]

const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const websiteUrl = computed(() => {
  const slug = normalizeSlug(profile.value.slug)
  if (!slug) return ''
  return `${window.location.origin}/c/${slug}`
})

watch(currentLocale, (newLocale) => {
  setLocale(newLocale)
})

const loadClinicProfile = async () => {
  try {
    currentClinicId.value = await getCurrentClinicId()
    if (!currentClinicId.value) return

    const clinic = await getClinic(currentClinicId.value)
    if (!clinic) return

    profile.value = {
      name: clinic.name || clinicStore.getClinicName() || '',
      slug: clinic.slug || '',
      logo_url: clinic.logo_url || clinicStore.logoUrl || '',
      address: clinic.address || '',
      location_url: clinic.location_url || '',
      description: clinic.description || '',
      work_schedule: normalizeSchedule(clinic.work_schedule),
    }

    clinicStore.setClinicName(profile.value.name)
    if (profile.value.logo_url) {
      clinicStore.setLogo(profile.value.logo_url)
    }
  } catch (error) {
    console.error('Failed to load clinic profile:', error)
    toast.error(t('settings.profileLoadError'))
  }
}

const saveClinicProfile = async () => {
  if (!currentClinicId.value) {
    toast.error(t('settings.profileSaveError'))
    return
  }

  savingProfile.value = true
  try {
    const safeSlug = normalizeSlug(profile.value.slug)
    await updateClinic(currentClinicId.value, {
      name: profile.value.name,
      ...(safeSlug ? { slug: safeSlug } : {}),
      logo_url: profile.value.logo_url || null,
      address: profile.value.address || null,
      location_url: profile.value.location_url || null,
      description: profile.value.description || null,
      work_schedule: profile.value.work_schedule,
    })

    clinicStore.setClinicName(profile.value.name)
    if (profile.value.logo_url) {
      clinicStore.setLogo(profile.value.logo_url)
    } else {
      clinicStore.clearLogo()
    }
    toast.success(t('settings.profileSaved'))
  } catch (error) {
    console.error('Failed to save clinic profile:', error)
    toast.error(error?.message || t('settings.profileSaveError'))
  } finally {
    savingProfile.value = false
  }
}

const handleCreateDoctor = async (formData) => {
  doctorError.value = ''
  creatingDoctor.value = true
  try {
    const payload = {
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      is_active: formData.is_active,
      ...(currentClinicId.value != null ? { clinic_id: Number(currentClinicId.value) } : {})
    }
    await doctorsStore.create(payload)
    doctorForm.value = {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      specialization: '',
      is_active: true,
    }
    toast.success(t('doctors.toastCreated'))
  } catch (error) {
    doctorError.value = doctorsStore.error || error?.message || t('doctors.errorCreate')
    toast.error(doctorError.value)
  } finally {
    creatingDoctor.value = false
  }
}

async function onLogoSelect(e) {
  logoError.value = ''
  const file = e.target?.files?.[0]
  if (!file) return
  try {
    const dataUrl = await resizeLogoFile(file)
    profile.value.logo_url = dataUrl
    toast.success(t('settings.logoUploaded'))
  } catch (err) {
    logoError.value = err.message || t('settings.logoError')
    toast.error(logoError.value)
  }
  e.target.value = ''
}

function removeLogo() {
  profile.value.logo_url = ''
  logoError.value = ''
  toast.success(t('settings.logoRemoved'))
}

async function copyWebsiteUrl() {
  if (!websiteUrl.value) return
  try {
    await navigator.clipboard.writeText(websiteUrl.value)
    toast.success(t('settings.websiteCopied'))
  } catch {
    toast.error(t('settings.websiteCopyError'))
  }
}

onMounted(async () => {
  if (isClinicAdmin.value) {
    await Promise.all([
      loadClinicProfile(),
      doctorsStore.fetchAll(),
    ])
  }
})
</script>
