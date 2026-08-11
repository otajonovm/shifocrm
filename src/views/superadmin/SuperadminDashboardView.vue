<template>
  <MainLayout>
    <div class="space-y-6 pb-6">
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-400">
              {{ t('superadminDashboard.eyebrow') }}
            </p>
            <h1 class="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {{ t('superadminDashboard.title') }}
            </h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              {{ t('superadminDashboard.subtitle') }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              v-for="item in headlineStats"
              :key="item.label"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ item.label }}</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Moliyaviy ko'rsatkichlar: klinikalar + yakka stomlar -->
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-5">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ t('superadminDashboard.mrrTitle') }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('superadminDashboard.mrrSubtitle') }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <p class="text-xs text-slate-500">{{ t('superadminDashboard.mrrCurrent') }}</p>
            <p class="mt-2 text-2xl font-black text-emerald-700">{{ formatSom(mrrPanel.currentMrr) }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ t('superadminDashboard.mrrUnitPrice', { price: formatSom(mrrPanel.unitPrice) }) }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <p class="text-xs text-slate-500">{{ t('superadminDashboard.clinics') }}</p>
            <p class="mt-2 text-2xl font-black text-indigo-700">{{ formatSom(mrrPanel.clinicsMrr) }}</p>
            <p class="mt-1 text-xs text-slate-500">
              {{ t('superadminDashboard.mrrClinicsHint', { paid: mrrPanel.paidClinicsCount, trial: mrrPanel.trialClinicsCount, seats: mrrPanel.paidClinicSeats }) }}
            </p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <p class="text-xs text-slate-500">{{ t('superadminDashboard.soloDoctors') }}</p>
            <p class="mt-2 text-2xl font-black text-teal-700">{{ formatSom(mrrPanel.soloMrr) }}</p>
            <p class="mt-1 text-xs text-slate-500">
              {{ t('superadminDashboard.mrrSoloHint', { paid: mrrPanel.soloPaid, total: mrrPanel.soloTotal }) }}
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <ApexChart type="donut" height="280" :options="mrrChartOptions" :series="mrrChartSeries" />
          </div>

          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.entity') }}</th>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.mrrSeats') }}</th>
                  <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.subscriptionStatus') }}</th>
                  <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.mrrAmount') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr v-for="row in mrrPanel.clinics" :key="row.id">
                  <td class="px-3 py-2.5 font-medium text-slate-900">{{ row.name }}</td>
                  <td class="px-3 py-2.5 text-slate-600">
                    {{ row.status === 'paid' ? row.seats : '—' }}
                  </td>
                  <td class="px-3 py-2.5">
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="row.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'"
                    >
                      {{ row.status === 'paid' ? t('superadminDashboard.statusActive') : t('superadminDashboard.mrrTrial') }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-semibold text-slate-900">
                    {{ row.status === 'paid' ? formatSom(row.mrr) : '—' }}
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2.5 font-medium text-slate-900">{{ t('superadminDashboard.soloDoctors') }}</td>
                  <td class="px-3 py-2.5 text-slate-600">{{ mrrPanel.soloPaid }} / {{ mrrPanel.soloTotal }}</td>
                  <td class="px-3 py-2.5">
                    <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {{ t('superadminDashboard.statusActive') }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-semibold text-slate-900">{{ formatSom(mrrPanel.soloMrr) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div v-if="loading" class="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        {{ t('superadminDashboard.loading') }}
      </div>

      <template v-else>
        <div class="grid gap-5 xl:grid-cols-2">
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ t('superadminDashboard.totalEngagement') }}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.totalEngagementHint') }}</p>
              </div>
              <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                {{ dashboard.engagement.totalLogins }}
              </span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.totalRegistered') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ dashboard.engagement.totalRegistered }}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.loginCount') }}</p>
                <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ dashboard.engagement.totalLogins }}</p>
              </div>
            </div>

            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead class="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.user') }}</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.loginCount') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.lastSeen') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                  <tr v-if="dashboard.engagement.userSessions.length === 0">
                    <td colspan="3" class="px-4 py-4 text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.noData') }}</td>
                  </tr>
                  <tr v-for="session in dashboard.engagement.userSessions" :key="session.userId">
                    <td class="px-4 py-4 font-medium text-slate-900 dark:text-white">{{ session.userId }}</td>
                    <td class="px-4 py-4 text-right text-slate-600 dark:text-slate-300">{{ session.loginCount }}</td>
                    <td class="px-4 py-4 text-slate-600 dark:text-slate-300">{{ formatDateTime(session.lastSeenAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ t('superadminDashboard.systemHealth') }}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.systemHealthHint') }}</p>
              </div>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {{ dashboard.systemHealth.activeEntities }}
              </span>
            </div>
            <ApexChart type="pie" height="320" :options="systemHealthChartOptions" :series="systemHealthChartSeries" />
          </section>
        </div>

        <div class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ t('superadminDashboard.subscriptionTrends') }}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.subscriptionTrendsHint') }}</p>
              </div>
              <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                {{ dashboard.subscriptionTrends.totalActivations }}
              </span>
            </div>
            <ApexChart type="line" height="340" :options="subscriptionTrendChartOptions" :series="subscriptionTrendChartSeries" />
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ t('superadminDashboard.recentSubscriptions') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.recentSubscriptionsHint') }}</p>
            </div>
            <div class="space-y-3">
              <div
                v-for="item in dashboard.recentSubscriptions"
                :key="item.id"
                class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ item.clinicName }}</p>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ featureLabel(item.featureKey) }}</p>
                  </div>
                  <span :class="statusBadgeClass(item.status)" class="rounded-full px-2.5 py-1 text-xs font-semibold">
                    {{ statusLabel(item.status) }}
                  </span>
                </div>
                <div class="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ formatDateTime(item.updatedAt) }}</span>
                  <span class="text-slate-600 dark:text-slate-300">{{ formatExpiry(item.expiresAt) }}</span>
                </div>
              </div>
              <p v-if="dashboard.recentSubscriptions.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
                {{ t('superadminDashboard.noData') }}
              </p>
            </div>
          </section>
        </div>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ t('superadminDashboard.subscriptionOverview') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.subscriptionOverviewHint') }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="module in moduleSummaryCards"
                :key="module.key"
                class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {{ module.label }}: {{ module.count }}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead class="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.entity') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.entityType') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.activeModules') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.subscriptionStatus') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.lastSubscriptionChange') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('superadminDashboard.expiresAt') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                <tr v-if="dashboard.subscriptions.rows.length === 0">
                  <td colspan="6" class="px-4 py-4 text-slate-500 dark:text-slate-400">{{ t('superadminDashboard.noData') }}</td>
                </tr>
                <tr
                  v-for="row in dashboard.subscriptions.rows"
                  :key="row.clinicId"
                  class="hover:bg-slate-50 dark:hover:bg-slate-900/70"
                >
                  <td class="px-4 py-4 font-medium text-slate-900 dark:text-white">{{ row.clinicName }}</td>
                  <td class="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {{ row.entityType === 'solo_doctor' ? t('superadminDashboard.soloDoctors') : t('superadminDashboard.clinics') }}
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="featureKey in row.activeModuleKeys"
                        :key="featureKey"
                        class="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                      >
                        {{ featureLabel(featureKey) }}
                      </span>
                      <span v-if="row.activeModuleKeys.length === 0" class="text-xs text-slate-400">{{ t('superadminDashboard.noSubscription') }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span :class="statusBadgeClass(row.subscriptionStatus)" class="rounded-full px-2.5 py-1 text-xs font-semibold">
                      {{ statusLabel(row.subscriptionStatus) }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-slate-600 dark:text-slate-300">{{ formatDateTime(row.lastChangeAt) }}</td>
                  <td class="px-4 py-4 text-slate-600 dark:text-slate-300">{{ formatExpiry(row.nextExpiry) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ApexChart from 'vue3-apexcharts'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { PREMIUM_FEATURE_KEYS } from '@/lib/subscriptionFeatures'
import { buildMrrPanel, formatSom } from '@/lib/superadminMrrStatic'
import { getSuperadminDashboardData } from '@/services/superadminService'

const { t } = useI18n()

const loading = ref(true)
const dashboard = ref({
  engagement: { totalRegistered: 0, totalLogins: 0, userSessions: [] },
  subscriptions: {
    totalActiveSubscriptions: 0,
    clinicsWithSubscription: 0,
    expiringSoonCount: 0,
    moduleStats: {},
    rows: [],
  },
  subscriptionTrends: { totalActivations: 0, rows: [] },
  systemHealth: { soloDoctors: 0, clinics: 0, activeEntities: 0 },
  recentSubscriptions: [],
})

const mrrPanel = computed(() => buildMrrPanel())

const mrrChartSeries = computed(() => [
  mrrPanel.value.clinicsMrr,
  mrrPanel.value.soloMrr,
])

const mrrChartOptions = computed(() => ({
  labels: [t('superadminDashboard.clinics'), t('superadminDashboard.soloDoctors')],
  colors: ['#6366f1', '#14b8a6'],
  legend: { position: 'bottom' },
  chart: {
    background: 'transparent',
    foreColor: '#334155',
  },
  theme: { mode: 'light' },
  dataLabels: {
    formatter: (value) => `${Number(value).toFixed(0)}%`,
  },
  tooltip: {
    theme: 'light',
    y: {
      formatter: (value) => formatSom(value),
    },
  },
}))

const formatDateTime = (value) => {
  if (!value) return t('superadminDashboard.noActivity')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
}

const formatExpiry = (value) => {
  if (!value) return t('superadminDashboard.lifetime')
  return formatDateTime(value)
}

const featureLabel = (featureKey) => {
  const key = `subscription.features.${featureKey}`
  const translated = t(key)
  return translated === key ? featureKey : translated
}

const headlineStats = computed(() => [
  { label: t('superadminDashboard.totalRegistered'), value: dashboard.value.engagement.totalRegistered },
  { label: t('superadminDashboard.activeSubscriptions'), value: dashboard.value.subscriptions.totalActiveSubscriptions },
  { label: t('superadminDashboard.clinicsWithSubscription'), value: dashboard.value.subscriptions.clinicsWithSubscription },
  { label: t('superadminDashboard.expiringSoon'), value: dashboard.value.subscriptions.expiringSoonCount },
])

const moduleSummaryCards = computed(() =>
  PREMIUM_FEATURE_KEYS.map((key) => ({
    key,
    label: featureLabel(key),
    count: dashboard.value.subscriptions.moduleStats?.[key] || 0,
  })),
)

const subscriptionTrendChartSeries = computed(() => [
  {
    name: t('superadminDashboard.subscriptionActivations'),
    data: dashboard.value.subscriptionTrends.rows.map((row) => row.total),
  },
])

const subscriptionTrendChartOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  colors: ['#7c3aed'],
  stroke: { curve: 'smooth', width: 3 },
  xaxis: {
    categories: dashboard.value.subscriptionTrends.rows.map((row) => row.day),
    labels: { style: { colors: '#64748b' } },
  },
  yaxis: {
    labels: { style: { colors: '#64748b' } },
  },
  legend: { position: 'top' },
  grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
}))

const systemHealthChartSeries = computed(() => [
  dashboard.value.systemHealth.soloDoctors,
  dashboard.value.systemHealth.clinics,
])

const systemHealthChartOptions = computed(() => ({
  labels: [t('superadminDashboard.soloDoctors'), t('superadminDashboard.clinics')],
  legend: { position: 'bottom' },
  colors: ['#14b8a6', '#6366f1'],
  dataLabels: {
    formatter: (value) => `${value.toFixed(1)}%`,
  },
}))

const statusLabel = (status) => {
  const map = {
    active: t('superadminDashboard.statusActive'),
    attention: t('superadminDashboard.statusAttention'),
    inactive: t('superadminDashboard.statusInactive'),
    expiring_soon: t('superadminDashboard.statusExpiringSoon'),
    expired: t('superadminDashboard.statusExpired'),
  }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    attention: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    expiring_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    expired: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  }
  return map[status] || map.inactive
}

onMounted(async () => {
  try {
    dashboard.value = await getSuperadminDashboardData()
  } catch (error) {
    console.error('Superadmin dashboard load failed:', error)
  } finally {
    loading.value = false
  }
})
</script>
