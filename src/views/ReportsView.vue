<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
          <p class="text-gray-500">{{ t('reports.subtitle') }}</p>
        </div>
        <button class="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowDownTrayIcon class="w-5 h-5" />
          {{ t('reports.export') }}
        </button>
      </div>

      <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-card space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">{{ t('reports.filtersTitle') }}</h2>
          <button class="text-sm text-gray-500 hover:text-gray-700" @click="resetFilters">
            {{ t('reports.clearFilters') }}
          </button>
        </div>
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('reports.startDate') }}</label>
            <input v-model="filters.startDate" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('reports.endDate') }}</label>
            <input v-model="filters.endDate" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div class="flex items-end">
            <button class="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" @click="loadReports">
              {{ t('reports.applyFilters') }}
            </button>
          </div>
          <div class="flex items-end">
            <button class="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700" @click="loadReports">
              {{ t('reports.refresh') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('reports.totalPayments') }}</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(summary.totalPayments) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('reports.totalRefunds') }}</p>
          <p class="mt-2 text-lg font-semibold text-rose-600">{{ formatCurrency(summary.totalRefunds) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('reports.netIncome') }}</p>
          <p class="mt-2 text-lg font-semibold text-emerald-600">{{ formatCurrency(summary.netIncome) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('reports.totalDebt') }}</p>
          <p class="mt-2 text-lg font-semibold text-amber-600">{{ formatCurrency(summary.totalDebt) }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.paymentMethods') }}</h3>
          </div>
          <div v-if="paymentMethods.length" class="px-4 py-4">
            <ApexChart type="donut" height="240" :options="paymentMethodsOptions" :series="paymentMethodsSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.method') }}</th>
                  <th class="px-6 py-3">{{ t('reports.count') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.payments">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="paymentMethods.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in paymentMethods" :key="row.method" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.label }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ row.count }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.doctorRevenue') }}</h3>
          </div>
          <div v-if="doctorRevenue.length" class="px-4 py-4">
            <ApexChart type="bar" height="240" :options="doctorRevenueOptions" :series="doctorRevenueSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.doctor') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.payments">
                  <td class="px-6 py-4 text-gray-500" colspan="2">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="doctorRevenue.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="2">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in doctorRevenue" :key="row.doctor_id" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.label }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.debtors') }}</h3>
          </div>
          <div v-if="debtors.length" class="px-4 py-4">
            <ApexChart type="bar" height="240" :options="debtorsOptions" :series="debtorsSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.patient') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.debts">
                  <td class="px-6 py-4 text-gray-500" colspan="2">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="debtors.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="2">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in debtors" :key="row.patient_id" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.label }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.topServices') }}</h3>
          </div>
          <div v-if="topServices.length" class="px-4 py-4">
            <ApexChart type="bar" height="240" :options="topServicesOptions" :series="topServicesSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.service') }}</th>
                  <th class="px-6 py-3">{{ t('reports.count') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.services">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="topServices.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in topServices" :key="row.service_name" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.service_name }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ row.total_count }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total_revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.monthlyServiceRevenue') }}</h3>
        </div>
        <div v-if="monthlyServiceRevenue.length" class="px-4 py-4">
          <ApexChart type="bar" height="260" :options="monthlyServiceRevenueOptions" :series="monthlyServiceRevenueSeries" />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-6 py-3">{{ t('reports.month') }}</th>
                <th class="px-6 py-3">{{ t('reports.service') }}</th>
                <th class="px-6 py-3">{{ t('reports.count') }}</th>
                <th class="px-6 py-3">{{ t('reports.total') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading.services">
                <td class="px-6 py-4 text-gray-500" colspan="4">{{ t('reports.loading') }}</td>
              </tr>
              <tr v-else-if="monthlyServiceRevenue.length === 0">
                <td class="px-6 py-4 text-gray-500" colspan="4">{{ t('reports.noData') }}</td>
              </tr>
              <tr v-for="row in monthlyServiceRevenue" :key="`${row.month}-${row.service_name}`" class="bg-white">
                <td class="px-6 py-4 text-gray-700">{{ row.month }}</td>
                <td class="px-6 py-4 text-gray-700">{{ row.service_name }}</td>
                <td class="px-6 py-4 text-gray-700">{{ row.total_count }}</td>
                <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total_revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.dailyIncome') }}</h3>
          </div>
          <div v-if="dailyIncome.length" class="px-4 py-4">
            <ApexChart type="line" height="240" :options="dailyIncomeOptions" :series="dailyIncomeSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.date') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                  <th class="px-6 py-3">{{ t('reports.netIncome') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.income">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="dailyIncome.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in dailyIncome" :key="row.day" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.day }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total_payments) }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.net_income) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white shadow-card">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('reports.monthlyIncome') }}</h3>
          </div>
          <div v-if="monthlyIncome.length" class="px-4 py-4">
            <ApexChart type="bar" height="240" :options="monthlyIncomeOptions" :series="monthlyIncomeSeries" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-6 py-3">{{ t('reports.month') }}</th>
                  <th class="px-6 py-3">{{ t('reports.total') }}</th>
                  <th class="px-6 py-3">{{ t('reports.netIncome') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="loading.income">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
                </tr>
                <tr v-else-if="monthlyIncome.length === 0">
                  <td class="px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
                </tr>
                <tr v-for="row in monthlyIncome" :key="row.month" class="bg-white">
                  <td class="px-6 py-4 text-gray-700">{{ row.month }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.total_payments) }}</td>
                  <td class="px-6 py-4 text-gray-700">{{ formatCurrency(row.net_income) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import ApexChart from 'vue3-apexcharts'
import { useToast } from '@/composables/useToast'
import { listDoctors } from '@/api/doctorsApi'
import { listPatients } from '@/api/patientsApi'
import * as paymentsApi from '@/api/paymentsApi'
import * as visitsApi from '@/api/visitsApi'
import { getTopServices, getServiceRevenueMonthly } from '@/api/servicesApi'

const { t } = useI18n()
const toast = useToast()

const filters = ref({
  startDate: '',
  endDate: ''
})

const loading = ref({
  payments: false,
  income: false,
  debts: false,
  services: false
})

const summary = ref({
  totalPayments: 0,
  totalRefunds: 0,
  netIncome: 0,
  totalDebt: 0
})

const payments = ref([])
const paymentMethods = ref([])
const doctorRevenue = ref([])
const debtors = ref([])
const dailyIncome = ref([])
const monthlyIncome = ref([])
const topServices = ref([])
const monthlyServiceRevenue = ref([])
const doctors = ref([])
const patients = ref([])

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const resetFilters = () => {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  const start = new Date(today)
  start.setDate(today.getDate() - 30)
  filters.value = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end
  }
}

const applySummary = () => {
  const totals = payments.value.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount) || 0
      if (entry.payment_type === 'payment') acc.totalPayments += amount
      if (entry.payment_type === 'refund') acc.totalRefunds += amount
      if (entry.payment_type === 'refund') acc.netIncome -= amount
      else acc.netIncome += amount
      return acc
    },
    { totalPayments: 0, totalRefunds: 0, netIncome: 0 }
  )
  summary.value.totalPayments = totals.totalPayments
  summary.value.totalRefunds = totals.totalRefunds
  summary.value.netIncome = totals.netIncome
}

const buildPaymentMethodStats = () => {
  const map = new Map()
  payments.value.forEach(entry => {
    const method = entry.method || 'unknown'
    if (!map.has(method)) {
      map.set(method, { method, total: 0, count: 0 })
    }
    const row = map.get(method)
    row.total += Number(entry.amount) || 0
    row.count += 1
  })
  paymentMethods.value = Array.from(map.values()).map(row => ({
    ...row,
    label: resolveMethodLabel(row.method)
  }))
}

const resolveMethodLabel = (method) => {
  const key = `reports.methodLabels.${method}`
  const translated = t(key)
  return translated === key ? method : translated
}

const paymentMethodsSeries = computed(() => paymentMethods.value.map(row => Number(row.total) || 0))
const paymentMethodsOptions = computed(() => ({
  labels: paymentMethods.value.map(row => row.label),
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const doctorRevenueSeries = computed(() => [
  { name: t('reports.total'), data: doctorRevenue.value.map(row => Number(row.total) || 0) }
])
const doctorRevenueOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  xaxis: { categories: doctorRevenue.value.map(row => row.label) },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const debtorsSeries = computed(() => [
  { name: t('reports.total'), data: debtors.value.map(row => Number(row.total) || 0) }
])
const debtorsOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  xaxis: { categories: debtors.value.map(row => row.label) },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const topServicesSeries = computed(() => [
  { name: t('reports.total'), data: topServices.value.map(row => Number(row.total_revenue) || 0) }
])
const topServicesOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  xaxis: { categories: topServices.value.map(row => row.service_name) },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const dailyIncomeSeries = computed(() => [
  { name: t('reports.netIncome'), data: dailyIncome.value.map(row => Number(row.net_income) || 0) }
])
const dailyIncomeOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: { categories: dailyIncome.value.map(row => row.day) },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const monthlyIncomeSeries = computed(() => [
  { name: t('reports.netIncome'), data: monthlyIncome.value.map(row => Number(row.net_income) || 0) }
])
const monthlyIncomeOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  xaxis: { categories: monthlyIncome.value.map(row => row.month) },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const monthlyServiceRevenueSeries = computed(() => [
  { name: t('reports.total'), data: monthlyServiceRevenue.value.map(row => Number(row.total_revenue) || 0) }
])
const monthlyServiceRevenueOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  xaxis: {
    categories: monthlyServiceRevenue.value.map(row => `${row.month} • ${row.service_name}`)
  },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (val) => formatCurrency(val) } }
}))

const buildDoctorRevenue = () => {
  const map = new Map()
  payments.value.forEach(entry => {
    const doctorId = entry.doctor_id || 'unknown'
    if (!map.has(doctorId)) {
      map.set(doctorId, { doctor_id: doctorId, total: 0 })
    }
    const row = map.get(doctorId)
    const amount = Number(entry.amount) || 0
    row.total += entry.payment_type === 'refund' ? -amount : amount
  })
  doctorRevenue.value = Array.from(map.values())
    .map(row => ({
      ...row,
      label: doctorLabel(row.doctor_id)
    }))
    .sort((a, b) => b.total - a.total)
}

const buildDebtors = (debtVisits) => {
  const map = new Map()
  debtVisits.forEach(visit => {
    const patientId = visit.patient_id
    if (!map.has(patientId)) {
      map.set(patientId, { patient_id: patientId, total: 0 })
    }
    const row = map.get(patientId)
    row.total += Number(visit.debt_amount) || 0
  })
  debtors.value = Array.from(map.values())
    .map(row => ({
      ...row,
      label: patientLabel(row.patient_id)
    }))
    .sort((a, b) => b.total - a.total)

  summary.value.totalDebt = debtors.value.reduce((sum, row) => sum + row.total, 0)
}

const doctorLabel = (doctorId) => {
  const match = doctors.value.find(item => Number(item.id) === Number(doctorId))
  return match ? `${match.full_name} (#${match.id})` : doctorId === 'unknown' ? t('reports.unknownDoctor') : `#${doctorId}`
}

const patientLabel = (patientId) => {
  const match = patients.value.find(item => Number(item.id) === Number(patientId))
  return match ? `${match.full_name} (#${match.id})` : `#${patientId}`
}

const loadReports = async () => {
  loading.value.payments = true
  loading.value.income = true
  loading.value.debts = true
  loading.value.services = true
  try {
    const { startDate, endDate } = filters.value
    const [
      paymentsData,
      dailyIncomeData,
      monthlyIncomeData,
      debtVisits,
      doctorsData,
      patientsData,
      topServicesData,
      monthlyServiceRevenueData
    ] = await Promise.all([
      paymentsApi.getPaymentsByDateRange(startDate, endDate),
      paymentsApi.getIncomeDailyRange(startDate, endDate),
      paymentsApi.getMonthlyIncome('order=month.desc&limit=12'),
      visitsApi.getDebtVisits(),
      listDoctors(),
      listPatients(),
      getTopServices('order=total_revenue.desc&limit=10'),
      getServiceRevenueMonthly('order=month.desc&limit=6')
    ])

    payments.value = paymentsData || []
    dailyIncome.value = dailyIncomeData || []
    monthlyIncome.value = monthlyIncomeData || []
    doctors.value = doctorsData || []
    patients.value = patientsData || []
    topServices.value = topServicesData || []
    monthlyServiceRevenue.value = monthlyServiceRevenueData || []
    applySummary()
    buildPaymentMethodStats()
    buildDoctorRevenue()
    buildDebtors(debtVisits || [])
    monthlyIncome.value = monthlyIncomeData || []
    if (monthlyServiceRevenue && monthlyServiceRevenue.length) {
      // attach to topServices section if needed later
    }
  } catch (error) {
    console.error('Failed to load reports:', error)
    toast.error(t('reports.errorLoad'))
  } finally {
    loading.value.payments = false
    loading.value.income = false
    loading.value.debts = false
    loading.value.services = false
  }
}

onMounted(() => {
  resetFilters()
  loadReports()
})
</script>
