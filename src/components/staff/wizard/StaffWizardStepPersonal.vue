<template>
  <div class="space-y-5 animate-fade-in">
    <div class="flex flex-col sm:flex-row gap-6">
      <StaffAvatarUpload
        :model-value="props.form.avatar_url"
        @file-selected="onAvatarFile"
      />
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.lastName') }} *
          </label>
          <input
            v-model="props.form.last_name"
            type="text"
            class="wizard-input"
            :placeholder="t('staffWizard.placeholders.lastName')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.firstName') }} *
          </label>
          <input
            v-model="props.form.first_name"
            type="text"
            class="wizard-input"
            :placeholder="t('staffWizard.placeholders.firstName')"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.middleName') }}
          </label>
          <input
            v-model="props.form.middle_name"
            type="text"
            class="wizard-input"
            :placeholder="t('staffWizard.placeholders.middleName')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.phone') }} *
          </label>
          <input
            :value="props.form.phone"
            type="tel"
            autocomplete="tel"
            class="wizard-input"
            :placeholder="phonePlaceholder"
            @input="onPhoneInput"
            @focus="ensurePhonePrefix"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.additionalPhone') }}
          </label>
          <input
            :value="props.form.additional_phone"
            type="tel"
            class="wizard-input"
            :placeholder="phonePlaceholder"
            @input="onAdditionalPhoneInput"
            @focus="ensureAdditionalPhonePrefix"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.birthDate') }}
          </label>
          <input v-model="props.form.birth_date" type="date" class="wizard-input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.gender') }}
          </label>
          <select v-model="props.form.gender" class="wizard-input">
            <option value="">{{ t('staffWizard.gender.notSelected') }}</option>
            <option value="male">{{ t('staffWizard.gender.male') }}</option>
            <option value="female">{{ t('staffWizard.gender.female') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import StaffAvatarUpload from './StaffAvatarUpload.vue'
import {
  UZ_PHONE_PLACEHOLDER,
  formatPhoneUzDisplay,
} from '@/lib/phoneUz'

const props = defineProps({
  form: { type: Object, required: true },
})

const { t } = useI18n()
const phonePlaceholder = UZ_PHONE_PLACEHOLDER

const onPhoneInput = (event) => {
  props.form.phone = formatPhoneUzDisplay(event.target.value)
  event.target.value = props.form.phone
}

const onAdditionalPhoneInput = (event) => {
  props.form.additional_phone = formatPhoneUzDisplay(event.target.value)
  event.target.value = props.form.additional_phone
}

const ensurePhonePrefix = () => {
  if (!props.form.phone) props.form.phone = '+998'
}

const ensureAdditionalPhonePrefix = () => {
  if (!props.form.additional_phone) props.form.additional_phone = '+998'
}

const onAvatarFile = (file) => {
  props.form._avatarFile = file
}
</script>

<style scoped>
.wizard-input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
}
</style>
