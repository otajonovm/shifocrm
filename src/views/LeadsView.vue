<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('leads.title') }}</h1>
          <p class="text-sm text-gray-500">{{ t('leads.subtitle') }}</p>
        </div>
        <button
          type="button"
          class="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          @click="loadLeads"
        >
          {{ t('leads.refresh') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th class="px-4 py-3 text-left">{{ t('leads.colName') }}</th>
                <th class="px-4 py-3 text-left">{{ t('leads.colPhone') }}</th>
                <th class="px-4 py-3 text-left">{{ t('leads.colWhen') }}</th>
                <th class="px-4 py-3 text-left">{{ t('leads.colNote') }}</th>
                <th class="px-4 py-3 text-left">{{ t('leads.colStatus') }}</th>
                <th class="px-4 py-3 text-right">{{ t('leads.colAction') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td colspan="6" class="px-4 py-6 text-center text-gray-500">{{ t('leads.loading') }}</td>
              </tr>
              <tr v-else-if="leads.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-gray-500">{{ t('leads.empty') }}</td>
              </tr>
              <tr v-for="lead in leads" :key="lead.id">
                <td class="px-4 py-3 font-medium text-gray-900">{{ lead.patient_name || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">{{ lead.phone || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">
                  {{ formatVisitDateTime(lead.preferred_date, lead.preferred_time) }}
                </td>
                <td class="px-4 py-3 text-gray-700 max-w-[280px] truncate" :title="lead.note || ''">
                  {{ lead.note || '-' }}
                </td>
                <td class="px-4 py-3">
                  <span :class="getLeadStatusBadgeClass(lead.status)" class="inline-flex px-2 py-1 rounded-full text-xs font-semibold">
                    {{ leadStatusLabel(lead.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <select
                    class="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    :value="normalizeLeadStatus(lead.status)"
                    @change="onChangeStatus(lead, $event.target.value)"
                  >
                    <option
                      v-for="statusOption in leadStatusOptions"
                      :key="statusOption.value"
                      :value="statusOption.value"
                    >
                      {{ statusOption.label }}
                    </option>
                    <option v-if="isLegacyBooked(lead.status)" value="booked">
                      {{ t('leads.statusBooked') }}
                    </option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import {
  listLeadsByClinic,
  listLeadsByDoctor,
  updateLeadStatus,
  convertLeadToBooked,
  convertLeadToQabulda,
} from '@/api/leadsApi'
import {
  LEAD_STATUS_DROPDOWN,
  LEAD_STATUSES,
  normalizeLeadStatus,
  getLeadStatusLabelKey,
  getLeadStatusBadgeClass,
} from '@/constants/leadStatus'

const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const leads = ref([])
const loading = ref(false)

const leadStatusOptions = computed(() =>
  LEAD_STATUS_DROPDOWN.map((value) => ({
    value,
    label: t(getLeadStatusLabelKey(value)),
  })),
)

const leadStatusLabel = (status) => t(getLeadStatusLabelKey(status))

const isLegacyBooked = (status) => String(status || '').toLowerCase() === LEAD_STATUSES.BOOKED

const formatVisitDateTime = (date, time) => {
  if (!date && !time) return '-'
  if (date && time) return `${date} ${String(time).slice(0, 5)}`
  return date || String(time || '').slice(0, 5)
}

const loadLeads = async () => {
  loading.value = true
  try {
    if (authStore.userRole === 'doctor' || authStore.userRole === 'solo') {
      const doctorId = Number(authStore.user?.id)
      leads.value = Number.isFinite(doctorId) ? await listLeadsByDoctor(doctorId) : []
    } else {
      const clinicId = Number(authStore.userClinicId || authStore.user?.clinic_id)
      leads.value = Number.isFinite(clinicId) ? await listLeadsByClinic(clinicId) : []
    }
  } catch (error) {
    console.error('Failed to load leads:', error)
    toast.error(t('leads.errorLoad'))
  } finally {
    loading.value = false
  }
}

const onChangeStatus = async (lead, status) => {
  const leadId = Number(lead?.id)
  if (!Number.isFinite(leadId)) return
  try {
    let updated = null
    if (status === LEAD_STATUSES.BOOKED || status === 'booked') {
      const result = await convertLeadToBooked(lead)
      if (result?.duplicateResolved) {
        toast.info(t('leads.toastDuplicateSlot'))
        await loadLeads()
        return
      }
      if (result?.alreadyBooked) {
        toast.info(t('leads.toastAlreadyBooked'))
        await loadLeads()
        return
      }
      updated = result?.lead || null
    } else if (status === LEAD_STATUSES.QABULDA) {
      const result = await convertLeadToQabulda(lead)
      updated = result?.lead || null
    } else {
      updated = await updateLeadStatus(leadId, status)
    }

    const index = leads.value.findIndex((item) => Number(item.id) === leadId)
    if (index >= 0) {
      leads.value[index] = { ...leads.value[index], ...(updated || {}), status: updated?.status || status }
    }
    if (status === LEAD_STATUSES.BOOKED || status === 'booked') {
      toast.success(t('leads.toastBooked'))
    } else if (status === LEAD_STATUSES.QABULDA) {
      toast.success(t('leads.toastQabulda'))
    } else {
      toast.success(t('leads.toastUpdated'))
    }
  } catch (error) {
    console.error('Failed to update lead status:', error)
    toast.error(error?.message || t('leads.errorLoad'))
    await loadLeads()
  }
}

onMounted(loadLeads)
</script>
