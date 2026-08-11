<template>
  <div class="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
    <div>
      <span class="text-xs text-slate-500">{{ t('odontogram.servicesTotal') }}</span>
      <p class="mt-1 font-semibold text-slate-800">{{ formatCurrency(servicesTotal) }}</p>
    </div>
    <div>
      <span class="text-xs text-slate-500">{{ t('odontogram.materialTotal') }}</span>
      <p class="mt-1 font-semibold text-slate-800">{{ formatCurrency(materialTotal) }}</p>
    </div>
    <div class="col-span-2 border-t border-slate-200 pt-3 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <span class="text-xs font-medium text-primary-600">{{ t('odontogram.total') }}</span>
      <p class="mt-1 font-bold text-primary-700">{{ formatCurrency(total) }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  servicesTotal: {
    type: Number,
    default: 0,
  },
  materialTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
</script>
