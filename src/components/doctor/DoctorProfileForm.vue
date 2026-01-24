<template>
  <form @submit.prevent="$emit('submit', profile)" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('doctorProfile.fullName') }} *
        </label>
        <input
          id="full_name"
          v-model="profile.full_name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
          class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
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
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          :placeholder="t('doctorProfile.specializationPlaceholder')"
        />
      </div>
    </div>

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

    <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
          class="grid grid-cols-1 gap-3 md:grid-cols-6 md:items-center"
        >
          <div class="flex items-center gap-2 md:col-span-2">
            <input
              :id="`day-${day.key}`"
              v-model="profile.work_schedule.days[day.key].enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label :for="`day-${day.key}`" class="text-sm font-medium text-gray-700">
              {{ day.label }}
            </label>
          </div>
          <div class="md:col-span-4 grid grid-cols-2 gap-2">
            <input
              v-model="profile.work_schedule.days[day.key].start"
              type="time"
              :disabled="!profile.work_schedule.days[day.key].enabled"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
            <input
              v-model="profile.work_schedule.days[day.key].end"
              type="time"
              :disabled="!profile.work_schedule.days[day.key].enabled"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
            <input
              v-model="profile.work_schedule.days[day.key].break_start"
              type="time"
              :placeholder="t('doctorProfile.breakStart')"
              :disabled="!profile.work_schedule.days[day.key].enabled"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
            <input
              v-model="profile.work_schedule.days[day.key].break_end"
              type="time"
              :placeholder="t('doctorProfile.breakEnd')"
              :disabled="!profile.work_schedule.days[day.key].enabled"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>

    <slot name="error" />
    <slot name="success" />

    <button
      type="submit"
      :disabled="isSubmitting"
      class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {{ isSubmitting ? t('doctorProfile.saving') : t('doctorProfile.saveChanges') }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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
