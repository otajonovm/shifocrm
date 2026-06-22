<template>
  <div class="space-y-5 animate-fade-in">
    <template v-if="props.form.ui_role === 'doctor'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.generalPercentage') }} (%)
          </label>
          <input
            v-model="props.form.general_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="wizard-input"
            placeholder="30"
          />
          <p class="mt-1 text-xs text-slate-500">{{ t('staffWizard.generalPercentageHint') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('staffWizard.fields.orthodonticPercentage') }} (%)
          </label>
          <input
            v-model="props.form.orthodontic_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="wizard-input"
            placeholder="15"
          />
          <p class="mt-1 text-xs text-slate-500">{{ t('staffWizard.orthodonticPercentageHint') }}</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          {{ t('staffWizard.fields.fixedSalary') }}
        </label>
        <input
          v-model="props.form.fixed_salary_amount"
          type="number"
          min="0"
          step="1000"
          class="wizard-input max-w-md"
          placeholder="5000000"
        />
      </div>
    </template>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">
        {{ t('staffWizard.fields.cashRegister') }}
      </label>
      <select v-model="props.form.allowed_cash_register_id" class="wizard-input max-w-md">
        <option value="">{{ t('staffWizard.selectCashRegister') }}</option>
        <option v-for="reg in cashRegisters" :key="reg.id" :value="reg.id">
          {{ reg.name }}
        </option>
      </select>
      <p class="mt-1 text-xs text-slate-500">{{ t('staffWizard.cashRegisterHint') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  form: { type: Object, required: true },
  cashRegisters: { type: Array, default: () => [] },
})

const { t } = useI18n()
</script>

<style scoped>
.wizard-input {
  @apply w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20;
}
</style>
