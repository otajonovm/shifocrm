<template>
  <form @submit.prevent="emit('submit', profile)" class="space-y-6">
    <!-- Shaxsiy ma'lumotlar -->
    <div v-if="showPersonal" class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.fullName') }} *
          </label>
          <input
            id="full_name"
            v-model="profile.full_name"
            type="text"
            required
            class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.phone') }} *
          </label>
          <input
            id="phone"
            v-model="profile.phone"
            type="tel"
            required
            class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.email') }}
          </label>
          <input
            id="email"
            v-model="profile.email"
            type="email"
            disabled
            class="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-gray-500">{{ t('doctorProfile.emailLocked') }}</p>
        </div>

        <div>
          <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.specialization') }}
          </label>
          <input
            id="specialization"
            v-model="profile.specialization"
            type="text"
            class="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            :placeholder="t('doctorProfile.specializationPlaceholder')"
          />
        </div>
      </div>

      <div class="mt-5 flex items-center space-x-2">
        <input
          id="is_active"
          v-model="profile.is_active"
          type="checkbox"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label for="is_active" class="text-sm font-medium text-gray-700">
          {{ t('doctorProfile.activeStatus') }}
        </label>
      </div>
    </div>

    <!-- Onlayn profil -->
    <div v-if="showOnline" class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 class="text-md font-semibold text-gray-900 mb-4">{{ t('doctorProfile.publicSettingsTitle') }}</h3>

      <div class="flex items-center space-x-2 mb-4">
        <input
          id="is_public"
          v-model="profile.is_public"
          type="checkbox"
          class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
        <label for="is_public" class="text-sm font-medium text-gray-700">
          {{ t('doctorProfile.publicSettingsToggle') }}
        </label>
      </div>

      <div v-if="profile.is_public" class="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label for="public_slug" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.publicSlugLabel') }}
          </label>
          <div class="flex">
            <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 sm:text-sm">
              {{ domainPath }}/d/
            </span>
            <input
              id="public_slug"
              v-model="profile.public_slug"
              type="text"
              class="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2.5 outline-none"
              placeholder="masalan: dr-ali-123"
            />
          </div>
          <p class="mt-2 text-xs text-gray-500">
            {{ t('doctorProfile.publicSlugHint') }}
          </p>
        </div>

        <div>
          <label for="public_bio" class="block text-sm font-medium text-gray-700 mb-2">
            {{ t('doctorProfile.publicBioLabel') }}
          </label>
          <textarea
            id="public_bio"
            v-model="profile.public_bio"
            rows="3"
            class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            :placeholder="t('doctorProfile.publicBioPlaceholder')"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="public_avatar_url" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctorProfile.publicAvatarLabel') }}
            </label>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                  <img
                    v-if="profile.public_avatar_url"
                    :src="profile.public_avatar_url"
                    alt="avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs text-gray-400">IMG</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <label class="inline-flex items-center px-3 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-medium cursor-pointer">
                    {{ t('doctorProfile.publicAvatarUpload') }}
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleAvatarUpload"
                    />
                  </label>
                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-medium"
                    @click="clearAvatar"
                  >
                    {{ t('doctorProfile.publicAvatarRemove') }}
                  </button>
                </div>
              </div>
              <input
                id="public_avatar_url"
                v-model="profile.public_avatar_url"
                type="url"
                class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                :placeholder="t('doctorProfile.publicAvatarPlaceholder')"
              />
              <p v-if="avatarUploadError" class="text-xs text-rose-600">{{ avatarUploadError }}</p>
            </div>
          </div>

          <div>
            <label for="public_phone" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctorProfile.publicPhoneLabel') }}
            </label>
            <input
              id="public_phone"
              v-model="profile.public_phone"
              type="tel"
              class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              :placeholder="t('doctorProfile.publicPhonePlaceholder')"
            />
          </div>

          <div>
            <label for="public_telegram" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctorProfile.publicTelegramLabel') }}
            </label>
            <input
              id="public_telegram"
              v-model="profile.public_telegram"
              type="text"
              class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              :placeholder="t('doctorProfile.publicTelegramPlaceholder')"
            />
          </div>

          <div>
            <label for="public_whatsapp" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctorProfile.publicWhatsAppLabel') }}
            </label>
            <input
              id="public_whatsapp"
              v-model="profile.public_whatsapp"
              type="tel"
              class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              :placeholder="t('doctorProfile.publicWhatsAppPlaceholder')"
            />
          </div>

          <div class="md:col-span-2">
            <label for="public_location_url" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t('doctorProfile.publicLocationLabel') }}
            </label>
            <input
              id="public_location_url"
              v-model="profile.public_location_url"
              type="url"
              class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              :placeholder="t('doctorProfile.publicLocationPlaceholder')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Ish jadvali -->
    <div v-if="showSchedule" class="space-y-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900">{{ t('doctorProfile.scheduleTitle') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('doctorProfile.scheduleSubtitle') }}</p>
      </div>

      <section class="rounded-3xl border border-violet-100 bg-violet-50 p-4">
        <p class="text-sm font-semibold text-violet-950">{{ t('doctorProfile.weekdayBulkTitle') }}</p>
        <p class="mt-0.5 text-xs text-violet-700/80">{{ t('doctorProfile.applyWeekdaysHint') }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-violet-800">{{ t('doctorProfile.startTime') }}</span>
            <input v-model="weekdayBulk.start" type="time" class="w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-violet-800">{{ t('doctorProfile.endTime') }}</span>
            <input v-model="weekdayBulk.end" type="time" class="w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm" />
          </label>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
          @click="applyWeekdayBulk"
        >
          {{ t('doctorProfile.applyWeekdays') }}
        </button>
      </section>

      <div class="space-y-2">
        <article
          v-for="day in dayOptions"
          :key="day.key"
          class="rounded-2xl border bg-white p-3.5"
          :class="profile.work_schedule.days[day.key].enabled
            ? 'border-emerald-200'
            : 'border-slate-200'"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-base font-bold text-slate-900">{{ day.label }}</p>
              <p class="text-xs text-slate-500">{{ getDaySummary(day.key) }}</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="profile.work_schedule.days[day.key].enabled"
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="profile.work_schedule.days[day.key].enabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'"
              @click="toggleDay(day.key)"
            >
              {{ profile.work_schedule.days[day.key].enabled ? t('doctorProfile.workday') : t('doctorProfile.dayOff') }}
            </button>
          </div>

          <div v-if="profile.work_schedule.days[day.key].enabled" class="mt-3 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-slate-500">{{ t('doctorProfile.startTime') }}</span>
                <input
                  v-model="profile.work_schedule.days[day.key].start"
                  type="time"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-slate-500">{{ t('doctorProfile.endTime') }}</span>
                <input
                  v-model="profile.work_schedule.days[day.key].end"
                  type="time"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                />
              </label>
            </div>

            <div v-if="hasLunch(day.key)" class="rounded-xl bg-amber-50 p-2.5">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs font-semibold text-amber-800">{{ t('doctorProfile.lunch') }}</p>
                <button type="button" class="text-xs font-medium text-amber-700" @click="clearLunch(day.key)">
                  {{ t('doctorProfile.removeLunch') }}
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="profile.work_schedule.days[day.key].break_start"
                  type="time"
                  class="w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm"
                />
                <input
                  v-model="profile.work_schedule.days[day.key].break_end"
                  type="time"
                  class="w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              v-else
              type="button"
              class="w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500"
              @click="addLunch(day.key)"
            >
              + {{ t('doctorProfile.addLunch') }}
            </button>
          </div>
        </article>
      </div>
    </div>

    <slot name="error" />
    <slot name="success" />

    <button
      v-if="showSubmit"
      type="submit"
      :disabled="isSubmitting"
      class="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {{ isSubmitting ? t('doctorProfile.saving') : t('doctorProfile.saveChanges') }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resizeLogoFile } from '@/lib/logoResize'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']

const domainPath = computed(() => window.location.origin)

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  section: {
    type: String,
    default: 'all',
    validator: (v) => ['all', 'personal', 'online', 'schedule'].includes(v),
  },
  compactSchedule: {
    type: Boolean,
    default: false,
  },
  showSubmit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['submit'])

const buildDefaultSchedule = () => ({
  timezone: 'Asia/Tashkent',
  days: {
    mon: { enabled: true, start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    tue: { enabled: true, start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    wed: { enabled: true, start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    thu: { enabled: true, start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    fri: { enabled: true, start: '09:00', end: '18:00', break_start: '13:00', break_end: '14:00' },
    sat: { enabled: false, start: '09:00', end: '14:00', break_start: '', break_end: '' },
    sun: { enabled: false, start: '09:00', end: '14:00', break_start: '', break_end: '' },
  },
})

const normalizeSchedule = (schedule) => {
  const fallback = buildDefaultSchedule()
  if (!schedule || typeof schedule !== 'object') {
    return fallback
  }
  const next = { ...fallback, ...schedule }
  next.days = { ...fallback.days, ...(schedule.days || {}) }
  Object.keys(next.days).forEach((key) => {
    next.days[key] = { ...fallback.days[key], ...next.days[key] }
  })
  return next
}

const normalizeProfile = (data) => ({
  ...data,
  work_schedule: normalizeSchedule(data.work_schedule),
})

const profile = ref(normalizeProfile(props.initialData))
const { t } = useI18n()
const avatarUploadError = ref('')
const weekdayBulk = ref({
  enabled: true,
  start: '09:00',
  end: '18:00',
  break_start: '13:00',
  break_end: '14:00',
})

const showPersonal = computed(() => props.section === 'all' || props.section === 'personal')
const showOnline = computed(() => props.section === 'all' || props.section === 'online')
const showSchedule = computed(() => props.section === 'all' || props.section === 'schedule')

watch(() => props.initialData, (newData) => {
  profile.value = normalizeProfile(newData)
}, { deep: true })

const dayOptions = computed(() => [
  { key: 'mon', label: t('doctorProfile.dayMon') },
  { key: 'tue', label: t('doctorProfile.dayTue') },
  { key: 'wed', label: t('doctorProfile.dayWed') },
  { key: 'thu', label: t('doctorProfile.dayThu') },
  { key: 'fri', label: t('doctorProfile.dayFri') },
  { key: 'sat', label: t('doctorProfile.daySat') },
  { key: 'sun', label: t('doctorProfile.daySun') },
])

const getDaySummary = (dayKey) => {
  const day = profile.value.work_schedule.days[dayKey]
  if (!day.enabled) return t('doctorProfile.dayOff')
  const breakPart = day.break_start && day.break_end
    ? ` · ${t('doctorProfile.lunch')} ${day.break_start}–${day.break_end}`
    : ''
  return `${day.start} – ${day.end}${breakPart}`
}

const toggleDay = (dayKey) => {
  const day = profile.value.work_schedule.days[dayKey]
  day.enabled = !day.enabled
}

const hasLunch = (dayKey) => {
  const day = profile.value.work_schedule.days[dayKey]
  return Boolean(day.break_start && day.break_end)
}

const addLunch = (dayKey) => {
  const day = profile.value.work_schedule.days[dayKey]
  day.break_start = day.break_start || '13:00'
  day.break_end = day.break_end || '14:00'
}

const clearLunch = (dayKey) => {
  const day = profile.value.work_schedule.days[dayKey]
  day.break_start = ''
  day.break_end = ''
}

const applyWeekdayBulk = () => {
  WEEKDAY_KEYS.forEach((key) => {
    profile.value.work_schedule.days[key] = {
      ...profile.value.work_schedule.days[key],
      enabled: weekdayBulk.value.enabled,
      start: weekdayBulk.value.start,
      end: weekdayBulk.value.end,
      break_start: weekdayBulk.value.break_start,
      break_end: weekdayBulk.value.break_end,
    }
  })
}

const handleAvatarUpload = async (event) => {
  avatarUploadError.value = ''
  const file = event?.target?.files?.[0]
  if (!file) return

  try {
    const dataUrl = await resizeLogoFile(file)
    profile.value.public_avatar_url = dataUrl
  } catch (error) {
    avatarUploadError.value = error?.message || t('doctorProfile.publicAvatarUploadError')
  } finally {
    if (event?.target) {
      event.target.value = ''
    }
  }
}

const clearAvatar = () => {
  profile.value.public_avatar_url = ''
  avatarUploadError.value = ''
}
</script>
