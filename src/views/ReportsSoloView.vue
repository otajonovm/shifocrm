<template>
  <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-gray-900">{{ t('reports.title') }}</h1>
        <p class="text-sm text-gray-500">{{ t('reports.subtitle') }}</p>
      </div>
    </div>

    <div v-if="loading" class="p-4 bg-white rounded-lg border border-gray-100">{{ t('common.loading') }}</div>

    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
        <div class="mobile-card flex items-center gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7V3M16 7V3M3 11H21M5 21H19C20.1046 21 21 20.1046 21 19V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayAppointmentsLabel') }}</p>
            <p class="text-base sm:text-lg font-bold text-gray-900">{{ summary.todayVisitsCount }}</p>
          </div>
        </div>

        <div class="mobile-card flex items-center gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 16V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.todayRevenue') }}</p>
            <p class="text-base sm:text-lg font-bold text-gray-900">{{ formatCurrency(summary.dailyRevenue) }}</p>
          </div>
        </div>

        <div class="mobile-card flex items-center gap-3">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.8954 16.1046 17 15 17H9C7.89543 17 7 17.8954 7 19V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-500">{{ t('soloDashboard.newPatientsCount') }}</p>
            <p class="text-base sm:text-lg font-bold text-gray-900">{{ summary.newPatientsCount }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <div class="mobile-card">
          <h3 class="text-sm font-medium text-gray-700 mb-2">{{ t('doctorDashboard.nextPatientTitle') }}</h3>
          <div v-if="summary.nextPatient" class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">{{ summary.nextPatient.name }}</p>
              <p class="text-xs text-gray-500">{{ summary.nextPatient.time }}</p>
            </div>
            <router-link :to="`/patients/${summary.nextPatient.id}`" class="text-primary-600">{{ t('reports.view') || t('soloDashboard.viewAll') }}</router-link>
          </div>
          <div v-else class="text-sm text-gray-500">{{ t('doctorDashboard.nextPatientEmpty') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import reportsApi from '@/api/reportsApi'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const summary = ref({ todayVisitsCount: 0, todayVisits: [], dailyRevenue: 0, nextPatient: null, newPatientsCount: 0 })

const formatCurrency = (amount) => new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

const load = async () => {
  if (!authStore.user || authStore.userRole !== 'solo') {
    // Only accessible for solo doctors — redirect others
    router.replace({ name: 'dashboard' })
    return
  }
  loading.value = true
  try {
    const res = await reportsApi.getSoloSummary(authStore.user.id)
    summary.value = res
  } catch (err) {
    console.error('Failed to load solo summary', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped></style>
