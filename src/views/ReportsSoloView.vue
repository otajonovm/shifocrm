<template>
  <div class="mx-auto max-w-4xl space-y-4 pb-8">
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{{ t('soloFocus.reportsTitle') }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ t('soloBilling.reportsSubtitle') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          :disabled="loading || !finance"
          @click="exportCsv"
        >
          {{ t('soloBilling.exportExcel') }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          :disabled="loading || !finance"
          @click="exportPdf"
        >
          {{ t('soloBilling.exportPdf') }}
        </button>
      </div>
    </header>

    <!-- Sana filtri -->
    <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <div class="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('soloBilling.dateFrom') }}</label>
            <input
              v-model="range.start"
              type="date"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('soloBilling.dateTo') }}</label>
            <input
              v-model="range.end"
              type="date"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            @click="setPreset('week')"
          >
            {{ t('soloBilling.presetWeek') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            @click="setPreset('month')"
          >
            {{ t('soloBilling.presetMonth') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            :disabled="loading"
            @click="loadAll"
          >
            {{ t('soloBilling.applyFilter') }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="loading" class="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
      {{ t('reports.loading') }}
    </div>

    <template v-else>
      <!-- Moliyaviy sarhisob -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-medium text-slate-500">{{ t('soloBilling.grossRevenue') }}</p>
          <p class="mt-2 text-xl font-bold text-slate-900 truncate">{{ formatCurrency(summary.grossRevenue) }}</p>
        </div>
        <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-medium text-slate-500">{{ t('soloBilling.totalExpenses') }}</p>
          <p class="mt-2 text-xl font-bold text-amber-700 truncate">{{ formatCurrency(summary.expensesTotal) }}</p>
        </div>
        <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-medium text-slate-500">{{ t('soloBilling.clinicOrRent') }}</p>
          <p class="mt-2 text-xl font-bold text-sky-700 truncate">{{ formatCurrency(summary.paidRentOrClinicShare) }}</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-sm text-white">
          <p class="text-xs font-medium text-emerald-100">{{ t('soloBilling.doctorNet') }}</p>
          <p class="mt-2 text-xl font-black truncate">{{ formatCurrency(summary.doctorNet) }}</p>
        </div>
      </section>

      <p v-if="modelLabel" class="text-xs text-slate-500">
        {{ t('soloBilling.activeModel') }}: <span class="font-semibold text-slate-700">{{ modelLabel }}</span>
        <span v-if="finance?.settings?.model === 'percentage' || finance?.settings?.model === 'hybrid'">
          · {{ finance.settings.doctor_percentage }}%
        </span>
      </p>

      <!-- Tezkor bugun/hafta (eski KPI) -->
      <section class="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p class="text-sm font-medium text-slate-500">{{ t('soloFocus.todayMoney') }}</p>
        <p class="mt-2 text-3xl font-black tracking-tight text-emerald-600">{{ formatCurrency(stats.dailyRevenue) }}</p>
        <p class="mt-2 text-sm text-slate-500">
          {{ t('soloFocus.todaySummary', { patients: stats.dailyPatients, visits: stats.todayVisitsCount }) }}
        </p>
      </section>

      <div class="grid grid-cols-2 gap-3">
        <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-medium text-slate-500">{{ t('soloFocus.weekMoney') }}</p>
          <p class="mt-2 text-xl font-bold text-slate-900">{{ formatCurrency(stats.weeklyRevenue) }}</p>
        </section>
        <section class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-medium text-slate-500">{{ t('soloFocus.weekPatientsShort') }}</p>
          <p class="mt-2 text-xl font-bold text-slate-900">{{ stats.weeklyPatients }}</p>
        </section>
      </div>

      <ReportsWeekTable
        :rows="weekRows"
        :unique-patients="stats.weeklyPatients"
        :total-revenue="stats.weeklyRevenue"
      />

      <!-- Settlement qatorlari -->
      <section class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-100">
          <h2 class="text-sm font-semibold text-slate-900">{{ t('soloBilling.settlementsTitle') }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-3 py-2 text-left">{{ t('soloBilling.colVisit') }}</th>
                <th class="px-3 py-2 text-right">{{ t('soloBilling.grossRevenue') }}</th>
                <th class="px-3 py-2 text-right">{{ t('soloBilling.totalExpenses') }}</th>
                <th class="px-3 py-2 text-right">{{ t('soloBilling.clinicOrRent') }}</th>
                <th class="px-3 py-2 text-right">{{ t('soloBilling.doctorNet') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="!(finance?.rows || []).length">
                <td colspan="5" class="px-3 py-6 text-center text-slate-400">{{ t('soloBilling.noSettlements') }}</td>
              </tr>
              <tr v-for="row in finance?.rows || []" :key="row.id || row.visit_id || row.calculated_at">
                <td class="px-3 py-2 text-slate-700">{{ row.visit_id ? `#${row.visit_id}` : '—' }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ formatCurrency(row.gross_revenue) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-amber-700">{{ formatCurrency(row.expenses_total) }}</td>
                <td class="px-3 py-2 text-right tabular-nums text-sky-700">{{ formatCurrency(row.clinic_share) }}</td>
                <td class="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700">{{ formatCurrency(row.doctor_share) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useClinicStore } from '@/stores/clinic'
import { isSolo } from '@/lib/roles'
import { findDoctorForSoloClinic } from '@/services/adminService'
import { getSoloWeekReport } from '@/services/reportsService'
import { getSoloFinanceReport } from '@/services/soloBillingService'
import { exportToCsv, exportToPdf } from '@/lib/exportData'
import ReportsWeekTable from '@/components/reports/ReportsWeekTable.vue'
import { useToast } from '@/composables/useToast'

defineOptions({ name: 'ReportsSoloView' })

const { t } = useI18n()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const toast = useToast()

const loading = ref(true)
const doctorId = ref(null)
const finance = ref(null)
const stats = ref({
  dailyPatients: 0,
  weeklyPatients: 0,
  dailyRevenue: 0,
  weeklyRevenue: 0,
  todayVisitsCount: 0,
  dailyBreakdown: [],
})

const pad = (n) => String(n).padStart(2, '0')
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const today = new Date()
const weekAgo = new Date(today)
weekAgo.setDate(today.getDate() - 6)

const range = reactive({
  start: toYmd(weekAgo),
  end: toYmd(today),
})

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0) + " so'm"

const weekRows = computed(() => stats.value.dailyBreakdown || [])
const summary = computed(() => finance.value?.summary || {
  grossRevenue: 0,
  expensesTotal: 0,
  paidRentOrClinicShare: 0,
  doctorNet: 0,
})

const modelLabel = computed(() => {
  const model = finance.value?.settings?.model
  if (model === 'percentage') return t('soloBilling.modelPercentage')
  if (model === 'rent') return t('soloBilling.modelRent')
  if (model === 'hybrid') return t('soloBilling.modelHybrid')
  return ''
})

const setPreset = (kind) => {
  const end = new Date()
  const start = new Date()
  if (kind === 'month') {
    start.setDate(1)
  } else {
    start.setDate(end.getDate() - 6)
  }
  range.start = toYmd(start)
  range.end = toYmd(end)
}

const resolveDoctorId = async () => {
  const direct = Number(authStore.user?.id)
  if (Number.isFinite(direct) && direct > 0) return direct

  const clinicId = Number(authStore.userClinicId ?? authStore.user?.clinic_id)
  if (isSolo(authStore) && Number.isFinite(clinicId)) {
    const doctor = await findDoctorForSoloClinic(clinicId, authStore.user?.login || authStore.userEmail || '')
    if (doctor?.id) return Number(doctor.id)
  }
  return null
}

const loadAll = async () => {
  loading.value = true
  try {
    if (!doctorId.value) {
      doctorId.value = await resolveDoctorId()
    }
    if (!doctorId.value) return

    const [weekStats, financeResult] = await Promise.all([
      getSoloWeekReport(doctorId.value, {
        startDate: range.start,
        endDate: range.end,
      }),
      getSoloFinanceReport({
        doctorId: doctorId.value,
        startDate: range.start,
        endDate: range.end,
      }),
    ])
    stats.value = weekStats
    if (financeResult.error) {
      toast.error(financeResult.error.message)
      finance.value = null
    } else {
      finance.value = financeResult.data
    }
  } catch (err) {
    console.error('Solo reports:', err)
    toast.error(t('soloBilling.reportError'))
  } finally {
    loading.value = false
  }
}

const exportColumns = computed(() => [
  { key: 'visit_id', label: t('soloBilling.colVisit') },
  { key: 'gross_revenue', label: t('soloBilling.grossRevenue'), type: 'number' },
  { key: 'expenses_total', label: t('soloBilling.totalExpenses'), type: 'number' },
  { key: 'clinic_share', label: t('soloBilling.clinicOrRent'), type: 'number' },
  { key: 'doctor_share', label: t('soloBilling.doctorNet'), type: 'number' },
  { key: 'model', label: t('soloBilling.activeModel') },
])

const exportCsv = () => {
  try {
    exportToCsv('solo_finance', exportColumns.value, finance.value?.rows || [])
  } catch (error) {
    toast.error(error?.message || t('soloBilling.exportError'))
  }
}

const exportPdf = () => {
  try {
    exportToPdf({
      title: t('soloBilling.exportTitle'),
      subtitle: `${range.start} — ${range.end}`,
      columns: exportColumns.value,
      rows: finance.value?.rows || [],
      clinicName: clinicStore.clinicName || 'ShifoCRM',
      summary: [
        { label: t('soloBilling.grossRevenue'), value: formatCurrency(summary.value.grossRevenue) },
        { label: t('soloBilling.totalExpenses'), value: formatCurrency(summary.value.expensesTotal) },
        { label: t('soloBilling.clinicOrRent'), value: formatCurrency(summary.value.paidRentOrClinicShare) },
        { label: t('soloBilling.doctorNet'), value: formatCurrency(summary.value.doctorNet) },
      ],
    })
  } catch (error) {
    toast.error(error?.message || t('soloBilling.exportError'))
  }
}

onMounted(loadAll)
</script>
