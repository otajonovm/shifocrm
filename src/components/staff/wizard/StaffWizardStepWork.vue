<template>
  <div class="space-y-5 animate-fade-in">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.role') }} *
        </label>
        <select v-model="props.form.ui_role" class="wizard-input" @change="onRoleChange">
          <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
            {{ opt.labelUz }}
          </option>
        </select>
      </div>

      <div v-if="props.form.ui_role === 'doctor'">
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.specialty') }} *
        </label>
        <select v-model="props.form.specialty" class="wizard-input">
          <option v-for="spec in specialtyOptions" :key="spec" :value="spec">
            {{ spec }}
          </option>
        </select>
      </div>

      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.branch') }}
        </label>
        <div class="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-800">
          <BuildingOffice2Icon class="h-5 w-5 text-primary-500" />
          {{ props.clinicName }}
          <span class="text-xs text-primary-600/80">({{ t('staffWizard.branchMvpHint') }})</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.email') }}
        </label>
        <input v-model="props.form.email" type="email" class="wizard-input" placeholder="email@klinika.uz" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ isEdit ? t('staffWizard.fields.newPassword') : t('staffWizard.fields.password') }}
          {{ isEdit ? '' : '*' }}
        </label>
        <input
          v-model="props.form.password"
          type="password"
          class="wizard-input"
          :required="!isEdit"
          minlength="6"
          autocomplete="new-password"
          :placeholder="t('staffWizard.placeholders.password')"
        />
      </div>

      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.telegramChatId') }}
        </label>
        <input
          v-model="props.form.telegram_chat_id"
          type="text"
          class="wizard-input"
          placeholder="123456789"
        />
        <p class="mt-1 text-xs text-slate-500">{{ t('staffWizard.telegramHint') }}</p>
      </div>

      <div class="sm:col-span-2">
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input
            v-model="props.form.is_active"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm font-medium text-slate-700">{{ t('staffWizard.fields.active') }}</span>
        </label>
      </div>
    </div>

    <!-- Shifokor ish jadvali -->
    <div v-if="props.form.ui_role === 'doctor'" class="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h3 class="text-sm font-semibold text-slate-900 mb-3">{{ t('staffWizard.workScheduleTitle') }}</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.chair') }} *
        </label>
        <select v-model="props.form.chair" class="wizard-input max-w-xs">
          <option value="">{{ t('staffWizard.selectChair') }}</option>
          <option v-for="opt in chairOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="space-y-2">
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
        >
          <label class="flex items-center gap-2 min-w-[120px] cursor-pointer">
            <input
              v-model="props.form.work_schedule.days[day.key].enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-primary-600"
            />
            <span class="text-sm font-medium text-slate-800">{{ day.label }}</span>
          </label>
          <template v-if="props.form.work_schedule.days[day.key].enabled">
            <input v-model="props.form.work_schedule.days[day.key].start" type="time" class="wizard-input !py-1.5 !w-auto" />
            <span class="text-slate-400">—</span>
            <input v-model="props.form.work_schedule.days[day.key].end" type="time" class="wizard-input !py-1.5 !w-auto" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { BuildingOffice2Icon } from '@heroicons/vue/24/outline'
import {
  UI_ROLE_OPTIONS,
  DOCTOR_SPECIALTY_OPTIONS,
  CHAIR_OPTIONS,
  WEEK_FORM_DAYS_FIXED,
  buildDefaultWorkSchedule,
} from '@/lib/staffHelpers'

const props = defineProps({
  form: { type: Object, required: true },
  clinicName: { type: String, default: '' },
  isEdit: { type: Boolean, default: false },
})

const { t } = useI18n()
const roleOptions = UI_ROLE_OPTIONS
const specialtyOptions = DOCTOR_SPECIALTY_OPTIONS
const chairOptions = CHAIR_OPTIONS
const weekDays = WEEK_FORM_DAYS_FIXED

const onRoleChange = () => {
  if (props.form.ui_role !== 'doctor') {
    props.form.chair = ''
    const { days } = buildDefaultWorkSchedule()
    Object.keys(days).forEach((key) => { days[key].enabled = false })
    props.form.work_schedule = { days }
    props.form.general_percentage = ''
    props.form.orthodontic_percentage = ''
  } else if (!props.form.specialty) {
    props.form.specialty = 'Terapevt'
  }
}
</script>

<style scoped>
.wizard-input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
}
</style>
