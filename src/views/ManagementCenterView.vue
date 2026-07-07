<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in pb-6 pb-safe">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('managementCenter.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t('managementCenter.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">{{ t('managementCenter.period') }}</label>
          <select
            v-model="selectedMonths"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="loadRoi"
          >
            <option :value="3">3 {{ t('managementCenter.months') }}</option>
            <option :value="6">6 {{ t('managementCenter.months') }}</option>
            <option :value="12">12 {{ t('managementCenter.months') }}</option>
          </select>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            :disabled="loadingStaff || loadingRoi"
            @click="refreshAll"
          >
            {{ t('managementCenter.refresh') }}
          </button>
        </div>
      </div>

      <InactiveStaffAlert :staff="inactiveStaff" />

      <div
        v-if="!loadingStaff && !clinicId"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p class="text-sm font-semibold text-amber-900">{{ t('managementCenter.clinicRequiredTitle') }}</p>
        <p class="mt-1 text-sm text-amber-800">{{ t('managementCenter.clinicRequiredHint') }}</p>
        <router-link
          v-if="isGlobalSuperAdminUser"
          to="/admin/clinics"
          class="mt-3 inline-flex text-sm font-medium text-amber-900 underline hover:text-amber-950"
        >
          {{ t('managementCenter.goSelectClinic') }}
        </router-link>
      </div>

      <StaffEngagementTable :rows="staffRows" :loading="loadingStaff" />

      <section class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ t('managementCenter.roiTitle') }}</h2>
          <p class="text-sm text-gray-500 mt-0.5">{{ t('managementCenter.roiSubtitle') }}</p>
        </div>

        <div v-if="loadingRoi" class="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          {{ t('managementCenter.loading') }}
        </div>
        <template v-else-if="roiReport">
          <RoiSummaryCards :report="roiReport" />
          <RoiCharts :report="roiReport" />
        </template>
        <div v-else class="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          {{ t('managementCenter.roiUnavailable') }}
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { isGlobalSuperAdmin as checkGlobalSuperAdmin } from '@/lib/roles'
import MainLayout from '@/layouts/MainLayout.vue'
import InactiveStaffAlert from '@/components/adminCenter/InactiveStaffAlert.vue'
import StaffEngagementTable from '@/components/adminCenter/StaffEngagementTable.vue'
import RoiSummaryCards from '@/components/adminCenter/RoiSummaryCards.vue'
import RoiCharts from '@/components/adminCenter/RoiCharts.vue'
import { getStaffEngagementReport } from '@/api/staffEngagementApi'
import { getRoiImpactReport } from '@/api/roiImpactApi'

const { t } = useI18n()
const authStore = useAuthStore()

const loadingStaff = ref(true)
const loadingRoi = ref(true)
const staffRows = ref([])
const inactiveStaff = ref([])
const roiReport = ref(null)
const clinicId = ref(null)
const selectedMonths = ref(6)

const isGlobalSuperAdminUser = computed(() => checkGlobalSuperAdmin(authStore))

const loadStaff = async () => {
  loadingStaff.value = true
  try {
    const report = await getStaffEngagementReport()
    clinicId.value = report.clinicId
    staffRows.value = report.rows || []
    inactiveStaff.value = report.inactive || []
  } catch (error) {
    console.error('Staff engagement load failed:', error)
    staffRows.value = []
    inactiveStaff.value = []
  } finally {
    loadingStaff.value = false
  }
}

const loadRoi = async () => {
  loadingRoi.value = true
  try {
    roiReport.value = await getRoiImpactReport({ months: selectedMonths.value })
  } catch (error) {
    console.error('ROI report load failed:', error)
    roiReport.value = null
  } finally {
    loadingRoi.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([loadStaff(), loadRoi()])
}

onMounted(() => {
  refreshAll()
})
</script>
