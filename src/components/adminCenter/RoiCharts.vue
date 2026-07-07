<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <h3 class="text-sm font-semibold text-gray-900">{{ t('managementCenter.chartAttributedTitle') }}</h3>
      <p class="text-xs text-gray-500 mt-0.5 mb-4">{{ t('managementCenter.chartAttributedSubtitle') }}</p>
      <ApexChart
        v-if="attributedSeries.length"
        type="area"
        height="280"
        :options="attributedChartOptions"
        :series="attributedSeries"
      />
      <p v-else class="py-16 text-center text-sm text-gray-400">{{ t('managementCenter.noChartData') }}</p>
    </div>

    <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <h3 class="text-sm font-semibold text-gray-900">{{ t('managementCenter.chartBreakdownTitle') }}</h3>
      <p class="text-xs text-gray-500 mt-0.5 mb-4">{{ t('managementCenter.chartBreakdownSubtitle') }}</p>
      <ApexChart
        v-if="breakdownSeries[0]?.data?.some((v) => v > 0)"
        type="bar"
        height="280"
        :options="breakdownChartOptions"
        :series="breakdownSeries"
      />
      <p v-else class="py-16 text-center text-sm text-gray-400">{{ t('managementCenter.noChartData') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ApexChart from 'vue3-apexcharts'

const props = defineProps({
  report: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()

const EVENT_TYPE_LABELS = {
  appointment_24h: '24 soat',
  appointment_1h: '1 soat',
  lead_2h_recall: 'Lead recall',
  follow_up_1d: 'Follow-up 1d',
  follow_up_3d: 'Follow-up 3d',
  follow_up_7d: 'Follow-up 7d',
  treatment_plan: 'Davolash rejasi',
  appointment_reminder: 'Qabul eslatma',
  follow_up: 'Follow-up',
}

const attributedSeries = computed(() => {
  const monthly = props.report?.monthlyAttributed || []
  return [{
    name: t('managementCenter.chartAttributedSeries'),
    data: monthly.map((row) => row.amount),
  }]
})

const attributedChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
  },
  colors: ['#2563eb'],
  dataLabels: { enabled: false },
  xaxis: {
    categories: (props.report?.monthlyAttributed || []).map((row) => row.label),
    labels: { style: { fontSize: '11px' } },
  },
  yaxis: {
    labels: {
      formatter: (v) => {
        if (v >= 1_000_000) return `${Math.round(v / 1_000_000)}M`
        if (v >= 1_000) return `${Math.round(v / 1_000)}K`
        return String(Math.round(v))
      },
    },
  },
  grid: { borderColor: '#f3f4f6' },
  tooltip: {
    y: {
      formatter: (v) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(v),
    },
  },
}))

const breakdownSeries = computed(() => {
  const byType = props.report?.attributedByType || {}
  const entries = Object.entries(byType).filter(([, amount]) => Number(amount) > 0)
  return [{
    name: t('managementCenter.chartBreakdownSeries'),
    data: entries.map(([, amount]) => Number(amount)),
  }]
})

const breakdownChartOptions = computed(() => {
  const byType = props.report?.attributedByType || {}
  const entries = Object.entries(byType).filter(([, amount]) => Number(amount) > 0)
  return {
    chart: { toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    colors: ['#0d9488', '#2563eb', '#7c3aed', '#ea580c'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: entries.map(([key]) => EVENT_TYPE_LABELS[key] || key),
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (v) => {
          if (v >= 1_000_000) return `${Math.round(v / 1_000_000)}M`
          return String(Math.round(v))
        },
      },
    },
    grid: { borderColor: '#f3f4f6' },
  }
})
</script>
