<template>
  <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
    <!-- Tezkor amallar -->
    <div class="grid grid-cols-2 gap-3">
      <router-link
        to="/appointments?action=add"
        class="mobile-card flex items-center gap-3 p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white active:scale-[0.98] transition-transform"
      >
        <CalendarDaysIcon class="w-6 h-6 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-semibold">{{ t('soloDashboard.addAppointment') }}</p>
          <p class="text-xs text-white/80">{{ t('soloDashboard.newAppointmentHint') }}</p>
        </div>
      </router-link>
      <router-link
        to="/patients?action=add"
        class="mobile-card flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white active:scale-[0.98] transition-transform"
      >
        <UserPlusIcon class="w-6 h-6 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-semibold">{{ t('soloDashboard.addPatient') }}</p>
          <p class="text-xs text-white/80">{{ t('soloDashboard.newPatientHint') }}</p>
        </div>
      </router-link>
    </div>

    <!-- Asosiy KPI -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="mobile-card">
        <p class="text-xs font-medium text-gray-500">{{ t('soloFocus.dailyPatients') }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.dailyPatients }}</p>
        <p class="mt-0.5 text-xs text-gray-400">{{ t('soloFocus.today') }}</p>
      </div>
      <div class="mobile-card">
        <p class="text-xs font-medium text-gray-500">{{ t('soloFocus.weeklyPatients') }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.weeklyPatients }}</p>
        <p class="mt-0.5 text-xs text-gray-400">{{ t('soloFocus.last7days') }}</p>
      </div>
      <div class="mobile-card">
        <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayRevenue') }}</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600 truncate">{{ formatCurrency(stats.dailyRevenue) }}</p>
        <p class="mt-0.5 text-xs text-gray-400">{{ t('soloFocus.today') }}</p>
      </div>
      <div class="mobile-card">
        <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.weeklyRevenue') }}</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600 truncate">{{ formatCurrency(stats.weeklyRevenue) }}</p>
        <p class="mt-0.5 text-xs text-gray-400">{{ t('soloFocus.last7days') }}</p>
      </div>
    </div>

    <!-- Haftalik trend -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="mobile-card">
        <h3 class="text-sm font-semibold text-gray-900">{{ t('soloFocus.weeklyPatientsChart') }}</h3>
        <p class="text-xs text-gray-500 mt-0.5 mb-4">{{ t('soloFocus.last7days') }}</p>
        <SoloStatBars
          :items="patientChartItems"
          value-key="patients"
          variant="primary"
        />
      </div>
      <div class="mobile-card">
        <h3 class="text-sm font-semibold text-gray-900">{{ t('soloFocus.weeklyRevenueChart') }}</h3>
        <p class="text-xs text-gray-500 mt-0.5 mb-4">{{ t('soloFocus.last7days') }}</p>
        <SoloStatBars
          :items="revenueChartItems"
          value-key="revenue"
          variant="revenue"
          :format-value="formatCurrency"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { getSoloDoctorStats } from '@/api/soloStatsApi'
import SoloStatBars from '@/components/solo/SoloStatBars.vue'
import { CalendarDaysIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const authStore = useAuthStore()

const stats = ref({
  dailyPatients: 0,
  weeklyPatients: 0,
  dailyRevenue: 0,
  weeklyRevenue: 0,
  dailyBreakdown: [],
})

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0) + " so'm"

const patientChartItems = computed(() =>
  (stats.value.dailyBreakdown || []).map((d) => ({
    label: d.label,
    date: d.date,
    patients: d.patients,
  }))
)

const revenueChartItems = computed(() =>
  (stats.value.dailyBreakdown || []).map((d) => ({
    label: d.label,
    date: d.date,
    revenue: d.revenue,
  }))
)

const load = async () => {
  const doctorId = authStore.user?.id
  if (!doctorId) return
  try {
    stats.value = await getSoloDoctorStats(doctorId)
  } catch (err) {
    console.error('Solo dashboard stats:', err)
  }
}

onMounted(load)
</script>
