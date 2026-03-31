<template>
  <form @submit.prevent="$emit('submit', profile)" class="space-y-6">
    <div class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
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
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div class="flex items-center space-x-2">
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

    <!-- Ommaviy sahifa sozlamalari -->
    <div class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
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
      </div>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-gray-900">{{ t('doctorProfile.scheduleTitle') }}</p>
          <p class="text-xs text-gray-500">{{ t('doctorProfile.scheduleSubtitle') }}</p>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div
          v-for="day in dayOptions"
          :key="day.key"
          class="rounded-xl border p-4 transition-colors"
          :class="profile.work_schedule.days[day.key].enabled
            ? 'border-blue-200 bg-blue-50/40'
            : 'border-gray-200 bg-gray-50/70'"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <input
                :id="`day-${day.key}`"
                v-model="profile.work_schedule.days[day.key].enabled"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label :for="`day-${day.key}`" class="text-sm font-semibold text-gray-800">
                {{ day.label }}
              </label>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="profile.work_schedule.days[day.key].enabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-200 text-gray-600'"
            >
              {{ profile.work_schedule.days[day.key].enabled ? t('doctorProfile.workday') : t('doctorProfile.dayOff') }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ t('doctorProfile.startTime') }}</label>
              <input
                v-model="profile.work_schedule.days[day.key].start"
                type="time"
                :disabled="!profile.work_schedule.days[day.key].enabled"
                class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ t('doctorProfile.endTime') }}</label>
              <input
                v-model="profile.work_schedule.days[day.key].end"
                type="time"
                :disabled="!profile.work_schedule.days[day.key].enabled"
                class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ t('doctorProfile.breakStart') }}</label>
              <input
                v-model="profile.work_schedule.days[day.key].break_start"
                type="time"
                :placeholder="t('doctorProfile.breakStart')"
                :disabled="!profile.work_schedule.days[day.key].enabled"
                class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-600">{{ t('doctorProfile.breakEnd') }}</label>
              <input
                v-model="profile.work_schedule.days[day.key].break_end"
                type="time"
                :placeholder="t('doctorProfile.breakEnd')"
                :disabled="!profile.work_schedule.days[day.key].enabled"
                class="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <slot name="error" />
    <slot name="success" />

    <button
      type="submit"
      :disabled="isSubmitting"
      class="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isSubmitting ? t('doctorProfile.saving') : t('doctorProfile.saveChanges') }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const domainPath = computed(() => {
  return window.location.origin
})

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
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
  }
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

watch(() => props.initialData, (newData) => {
  profile.value = normalizeProfile(newData)
}, { deep: true })

const dayOptions = [
  { key: 'mon', label: t('doctorProfile.dayMon') },
  { key: 'tue', label: t('doctorProfile.dayTue') },
  { key: 'wed', label: t('doctorProfile.dayWed') },
  { key: 'thu', label: t('doctorProfile.dayThu') },
  { key: 'fri', label: t('doctorProfile.dayFri') },
  { key: 'sat', label: t('doctorProfile.daySat') },
  { key: 'sun', label: t('doctorProfile.daySun') },
]
</script>
