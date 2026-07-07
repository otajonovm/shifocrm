<template>
  <div class="space-y-5 pb-6">
    <section class="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-violet-900 to-cyan-700 p-6 text-white shadow-2xl shadow-violet-200/60">
      <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">{{ t('soloFocus.reportsTitle') }}</p>
          <h1 class="mt-3 text-3xl font-black leading-tight">{{ t('soloFocus.reportsHeroTitle') }}</h1>
          <p class="mt-3 max-w-2xl text-sm text-white/75">{{ t('soloFocus.reportsSubtitle') }}</p>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="card in spotlightCards" :key="card.label" class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p class="text-xs text-white/70">{{ card.label }}</p>
              <p class="mt-2 text-2xl font-bold">{{ card.value }}</p>
              <p class="mt-1 text-xs text-cyan-100/80">{{ card.note }}</p>
            </div>
          </div>
        </div>

        <div class="grid gap-4">
          <div class="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p class="text-sm font-semibold">{{ t('soloFocus.energyTitle') }}</p>
            <ApexChart type="radialBar" height="240" :options="energyChartOptions" :series="energySeries" />
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mobile-card text-sm text-gray-500">{{ t('reports.loading') }}</div>

    <template v-else>
      <div class="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900">{{ t('soloFocus.weeklyRevenueChart') }}</h2>
              <p class="text-sm text-slate-500">{{ t('soloFocus.revenuePerDayHint') }}</p>
            </div>
            <div class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {{ formatCurrency(stats.weeklyRevenue) }}
            </div>
          </div>
          <ApexChart type="area" height="320" :options="revenueChartOptions" :series="revenueChartSeries" />
        </section>

        <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
          <div class="mb-4">
            <h2 class="text-base font-bold text-slate-900">{{ t('soloFocus.visitsSummary') }}</h2>
            <p class="text-sm text-slate-500">{{ t('soloFocus.patientsPerDayHint') }}</p>
          </div>
          <ApexChart type="bar" height="320" :options="patientChartOptions" :series="patientChartSeries" />
        </section>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <section class="rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-sm">
          <p class="text-sm font-semibold text-violet-900">{{ t('soloFocus.todayRevenueCard') }}</p>
          <p class="mt-3 text-3xl font-black text-violet-700">{{ formatCurrency(stats.dailyRevenue) }}</p>
          <p class="mt-2 text-xs text-violet-700/70">{{ t('soloFocus.todayRevenueNote') }}</p>
        </section>

        <section class="rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50 p-5 shadow-sm">
          <p class="text-sm font-semibold text-cyan-900">{{ t('soloFocus.weeklyPatients') }}</p>
          <p class="mt-3 text-3xl font-black text-cyan-700">{{ stats.weeklyPatients }}</p>
          <p class="mt-2 text-xs text-cyan-800/70">{{ t('soloFocus.weeklyPatientsNote') }}</p>
        </section>

        <section class="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-5 shadow-sm">
          <p class="text-sm font-semibold text-emerald-900">{{ t('soloDashboard.todayAppointmentsLabel') }}</p>
          <p class="mt-3 text-3xl font-black text-emerald-700">{{ stats.todayVisitsCount }}</p>
          <p class="mt-2 text-xs text-emerald-800/70">{{ t('soloFocus.todayVisitsNote') }}</p>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ApexChart from 'vue3-apexcharts'
import { useAuthStore } from '@/stores/auth'
import { getSoloDoctorStats } from '@/api/soloStatsApi'

const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const stats = ref({
  dailyPatients: 0,
  weeklyPatients: 0,
  dailyRevenue: 0,
  weeklyRevenue: 0,
  todayVisitsCount: 0,
  dailyBreakdown: [],
})

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0) + " so'm"

const spotlightCards = computed(() => [
  { label: t('soloFocus.dailyPatients'), value: stats.value.dailyPatients, note: t('soloFocus.today') },
  { label: t('soloFocus.weeklyPatients'), value: stats.value.weeklyPatients, note: t('soloFocus.last7days') },
  { label: t('soloDashboard.todayRevenue'), value: formatCurrency(stats.value.dailyRevenue), note: t('soloFocus.today') },
  { label: t('soloDashboard.weeklyRevenue'), value: formatCurrency(stats.value.weeklyRevenue), note: t('soloFocus.last7days') },
])

const energySeries = computed(() => {
  const patientPct = Math.min(100, stats.value.weeklyPatients * 10)
  const revenuePct = Math.min(100, Math.round((stats.value.weeklyRevenue || 0) / 100000))
  const visitsPct = Math.min(100, stats.value.todayVisitsCount * 15)
  return [patientPct, revenuePct, visitsPct]
})

const energyChartOptions = computed(() => ({
  chart: { sparkline: { enabled: true }, toolbar: { show: false } },
  labels: [t('soloFocus.weeklyPatients'), t('soloDashboard.weeklyRevenue'), t('soloDashboard.todayAppointmentsLabel')],
  colors: ['#22d3ee', '#a78bfa', '#34d399'],
  plotOptions: {
    radialBar: {
      hollow: { size: '32%' },
      track: { background: 'rgba(255,255,255,0.1)' },
      dataLabels: {
        name: { color: '#e2e8f0' },
        value: { color: '#ffffff', fontSize: '18px', fontWeight: 700 },
      },
    },
  },
  legend: {
    show: true,
    position: 'bottom',
    labels: { colors: '#e2e8f0' },
  },
}))

const revenueChartSeries = computed(() => [
  {
    name: t('soloDashboard.weeklyRevenue'),
    data: (stats.value.dailyBreakdown || []).map((d) => d.revenue),
  },
])

const revenueChartOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  colors: ['#10b981'],
  stroke: { curve: 'smooth', width: 4 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 },
  },
  grid: { borderColor: '#eef2ff' },
  xaxis: {
    categories: (stats.value.dailyBreakdown || []).map((d) => d.label),
    labels: { style: { colors: '#64748b' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b' },
      formatter: (val) => `${Math.round(val / 1000)}k`,
    },
  },
  dataLabels: { enabled: false },
  tooltip: {
    y: { formatter: (val) => formatCurrency(val) },
  },
}))

const patientChartSeries = computed(() => [
  {
    name: t('soloFocus.dailyPatients'),
    data: (stats.value.dailyBreakdown || []).map((d) => d.patients),
  },
])

const patientChartOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  colors: ['#6366f1'],
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: '42%',
      distributed: true,
    },
  },
  legend: { show: false },
  xaxis: {
    categories: (stats.value.dailyBreakdown || []).map((d) => d.label),
    labels: { style: { colors: '#64748b' } },
  },
  yaxis: {
    labels: { style: { colors: '#64748b' } },
  },
  dataLabels: { enabled: false },
  tooltip: {
    y: { formatter: (val) => `${val} ${t('soloFocus.patientUnit')}` },
  },
}))

onMounted(async () => {
  const doctorId = authStore.user?.id
  if (!doctorId) {
    loading.value = false
    return
  }
  try {
    stats.value = await getSoloDoctorStats(doctorId)
  } catch (err) {
    console.error('Solo reports:', err)
  } finally {
    loading.value = false
  }
})
</script>
