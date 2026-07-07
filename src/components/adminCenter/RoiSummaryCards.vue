<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('managementCenter.cardAttributedRevenue') }}</p>
      <p class="mt-2 text-2xl font-bold text-primary-600">{{ formatCurrency(report?.attributedRevenue) }}</p>
      <p class="mt-1 text-xs text-gray-500">{{ t('managementCenter.cardAttributedHint') }}</p>
    </div>

    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('managementCenter.cardAutoKpi') }}</p>
      <p class="mt-2 text-2xl font-bold text-gray-900">{{ formatCurrency(report?.autoKpiTotal) }}</p>
      <p class="mt-1 text-xs text-gray-500">{{ t('managementCenter.cardAutoKpiHint') }}</p>
    </div>

    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('managementCenter.cardNoShow') }}</p>
      <p class="mt-2 text-2xl font-bold text-gray-900">{{ report?.currentNoShow ?? 0 }}%</p>
      <p
        class="mt-1 text-xs"
        :class="(report?.noShowImprovement || 0) > 0 ? 'text-emerald-600' : 'text-gray-500'"
      >
        {{ noShowDeltaLabel }}
      </p>
    </div>

    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('managementCenter.cardDebtRecovery') }}</p>
      <p class="mt-2 text-2xl font-bold text-gray-900">{{ report?.debtRecovery?.rate ?? 0 }}%</p>
      <p class="mt-1 text-xs text-gray-500">
        {{ t('managementCenter.cardDebtRecoveryHint', {
          recovered: report?.debtRecovery?.recovered ?? 0,
          total: report?.debtRecovery?.total ?? 0,
        }) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  report: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()

const formatCurrency = (value) => {
  const n = Number(value) || 0
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(n)
}

const noShowDeltaLabel = computed(() => {
  const delta = props.report?.noShowImprovement || 0
  if (delta > 0) {
    return t('managementCenter.noShowImproved', { delta })
  }
  if (delta < 0) {
    return t('managementCenter.noShowWorsened', { delta: Math.abs(delta) })
  }
  return t('managementCenter.noShowStable')
})
</script>
