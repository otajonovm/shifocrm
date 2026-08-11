<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ t('patientVisits.title') }}</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ t('patientVisits.total') }}: {{ visits.length }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="visits.length === 0" class="bg-gray-50 rounded-xl p-8 text-center">
      <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">
        {{ t('patientVisits.noVisits') }}
      </p>
    </div>

    <!-- Mobile: Card list | Desktop: Table -->
    <div v-else class="space-y-3 md:space-y-0">
      <!-- Mobile Card List (md:hidden) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="visit in visits"
          :key="visit.id"
          class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ formatDate(visit.date || visit.created_at) }}</p>
              <p class="text-xs text-gray-500">{{ formatTime(visit.created_at) }}</p>
            </div>
            <VisitStatusBadge :status="visit.status" :visit="visit" />
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t('patientVisits.doctor') }}:</span>
              <span class="text-gray-900 font-medium">{{ visit.doctor_name || t('patientVisits.noDoctor') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t('patientVisits.service') }}:</span>
              <span class="text-gray-900">{{ visit.service_name || '-' }}</span>
            </div>
            <p v-if="visit.notes" class="text-gray-600 text-xs mt-2 line-clamp-2">{{ visit.notes }}</p>
          </div>
          <div v-if="canEdit" class="mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              :disabled="updatingVisitId === visit.id"
              class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              @click="openOdontogram(visit)"
            >
              <DocumentTextIcon class="w-4 h-4" />
              Odontogramma
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop Table (hidden md:block) -->
      <div class="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.dateTime') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.doctor') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.service') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.status') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.notes') }}
                </th>
                <th v-if="canEdit" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patientVisits.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="visit in visits"
                :key="visit.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">{{ formatDate(visit.date || visit.created_at) }}</span>
                  <p class="text-xs text-gray-500 mt-0.5">{{ formatTime(visit.created_at) }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ visit.doctor_name || t('patientVisits.noDoctor') }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ visit.service_name || '-' }}</span>
                </td>
                <td class="px-6 py-4">
                  <VisitStatusBadge :status="visit.status" :visit="visit" />
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600 line-clamp-2 max-w-xs">{{ visit.notes || '-' }}</span>
                </td>
                <td v-if="canEdit" class="px-6 py-4">
                  <button
                    type="button"
                    :disabled="updatingVisitId === visit.id"
                    class="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    @click="openOdontogram(visit)"
                  >
                    <DocumentTextIcon class="w-3.5 h-3.5" />
                    Odontogramma
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDaysIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import * as visitsApi from '@/api/visitsApi'

const { t } = useI18n()
const router = useRouter()

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['visit-updated', 'open-odontogram'])

const toast = useToast()

const loading = ref(false)
const visits = ref([])
const updatingVisitId = ref(null)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openOdontogram = (visit) => {
  emit('open-odontogram', visit.id)
  router.replace({
    query: { tab: 'odontogram', visit: String(visit.id) },
  }).catch(() => {})
  if (visit.status === 'pending' || visit.status === 'arrived') {
    updatingVisitId.value = visit.id
    visitsApi.updateVisit(visit.id, { status: 'in_progress' })
      .then(() => {
        visit.status = 'in_progress'
        emit('visit-updated')
      })
      .catch((error) => {
        console.warn('Visitni avtomatik boshlash:', error)
      })
      .finally(() => {
        updatingVisitId.value = null
      })
  }
}

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visits:', error)
    toast.error(t('patientVisits.errorLoad'))
    visits.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadVisits)
watch(() => props.patientId, loadVisits)
</script>
