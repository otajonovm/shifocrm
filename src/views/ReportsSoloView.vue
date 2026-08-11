<template>
  <div class="mx-auto max-w-3xl space-y-4 pb-8">
    <header>
      <h1 class="text-2xl font-bold text-slate-900">{{ t('soloFocus.reportsTitle') }}</h1>
      <p class="mt-1 text-sm text-slate-500">{{ t('soloFocus.reportsSubtitle') }}</p>
    </header>

    <div v-if="loading" class="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
      {{ t('reports.loading') }}
    </div>

    <template v-else>
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

      <ReportsWeekTable :rows="weekRows" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { isSolo } from '@/lib/roles'
import { findDoctorForSoloClinic } from '@/services/adminService'
import { getSoloWeekReport } from '@/services/reportsService'
import ReportsWeekTable from '@/components/reports/ReportsWeekTable.vue'

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

const weekRows = computed(() => stats.value.dailyBreakdown || [])

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

onMounted(async () => {
  try {
    const doctorId = await resolveDoctorId()
    if (doctorId) {
      stats.value = await getSoloWeekReport(doctorId)
    }
  } catch (err) {
    console.error('Solo reports:', err)
  } finally {
    loading.value = false
  }
})
</script>
