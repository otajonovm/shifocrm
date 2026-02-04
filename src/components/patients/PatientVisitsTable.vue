<template>
  <div class="space-y-4">
    <!-- Header with Filter — mobile: stack vertically, full-width filter -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ t('patientVisits.title') }}</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ t('patientVisits.total') }}: {{ filteredVisits.length }} / {{ visits.length }}
        </p>
      </div>
      
      <!-- Status Filter — full width on mobile, touch-friendly -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
        <label class="text-sm text-gray-600">{{ t('patientVisits.filterLabel') }}</label>
        <select
          v-model="statusFilter"
          class="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm border border-gray-300 rounded-xl sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px]"
        >
          <option value="all">{{ t('patientVisits.filterAll') }}</option>
          <option value="active">{{ t('patientVisits.filterActive') }}</option>
          <option value="debt">{{ t('patientVisits.filterDebt') }}</option>
          <option value="completed">{{ t('patientVisits.filterCompleted') }}</option>
          <option value="pending">{{ t('patientVisits.statusPending') }}</option>
          <option value="arrived">{{ t('patientVisits.statusArrived') }}</option>
          <option value="in_progress">{{ t('patientVisits.statusInProgress') }}</option>
          <option value="completed_debt">{{ t('patientVisits.statusDebt') }}</option>
          <option value="completed_paid">{{ t('patientVisits.statusCompleted') }}</option>
          <option value="cancelled">{{ t('patientVisits.statusCancelled') }}</option>
          <option value="no_show">{{ t('patientVisits.statusNoShow') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredVisits.length === 0" class="bg-gray-50 rounded-xl p-8 text-center">
      <CalendarDaysIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">
        {{ statusFilter === 'all' ? t('patientVisits.noVisits') : t('patientVisits.noFiltered') }}
      </p>
    </div>

    <!-- Mobile: Card list | Desktop: Table -->
    <div v-else class="space-y-3 md:space-y-0">
      <!-- Mobile Card List (md:hidden) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="visit in filteredVisits"
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
          <div v-if="canEdit" class="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            <template v-if="isActiveVisit(visit.status)">
              <button
                v-if="visit.status === 'pending' || visit.status === 'arrived'"
                @click="startVisit(visit)"
                :disabled="updatingVisitId === visit.id"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 rounded-xl transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
              >
                <PlayIcon class="w-4 h-4" />
                {{ t('patientVisits.started') }}
              </button>
            </template>
            <button
              @click="openStatusModal(visit)"
              class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-xl transition-colors touch-manipulation min-h-[44px]"
            >
              {{ t('patientVisits.changeStatus') }}
            </button>
            <router-link
              :to="`/patients/${props.patientId}?tab=odontogram&visit=${visit.id}`"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl transition-colors touch-manipulation min-h-[44px]"
            >
              <DocumentTextIcon class="w-4 h-4" />
              Odontogramma
            </router-link>
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
                v-for="visit in filteredVisits"
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
                  <div class="flex items-center gap-2">
                    <template v-if="isActiveVisit(visit.status)">
                      <button
                        v-if="visit.status === 'pending' || visit.status === 'arrived'"
                        @click="startVisit(visit)"
                        :disabled="updatingVisitId === visit.id"
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlayIcon class="w-3.5 h-3.5" />
                        {{ t('patientVisits.started') }}
                      </button>
                    </template>
                    <button
                      @click="openStatusModal(visit)"
                      class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {{ t('patientVisits.changeStatus') }}
                    </button>
                    <router-link
                      :to="`/patients/${props.patientId}?tab=odontogram&visit=${visit.id}`"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      <DocumentTextIcon class="w-3.5 h-3.5" />
                      Odontogramma
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Status Change Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showStatusModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeStatusModal"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Statusni o'zgartirish</h3>
                <button
                  @click="closeStatusModal"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon class="w-6 h-6" />
                </button>
              </div>

              <div class="space-y-4">
                <!-- Current Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Hozirgi status:</label>
                  <VisitStatusBadge v-if="selectedVisit" :status="selectedVisit.status" :visit="selectedVisit" />
                </div>

                <!-- New Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Yangi status:</label>
                  <select
                    v-model="newStatus"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{{ t('patientVisits.select') }}</option>
                    <option
                      v-for="status in allowedStatuses"
                      :key="status"
                      :value="status"
                    >
                      {{ getVisitStatusLabel(status) }}
                    </option>
                  </select>
                </div>

                <!-- Debt Amount (if completed_debt) -->
                <div v-if="newStatus === 'completed_debt'">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ t('patientVisits.debtAmount') }}
                  </label>
                  <input
                    v-model.number="debtAmount"
                    type="number"
                    min="0"
                    step="1000"
                    :placeholder="t('patientVisits.debtPlaceholder')"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Error Message -->
                <div v-if="statusError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-600">{{ statusError }}</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                @click="saveStatusChange"
                :disabled="!newStatus || saving"
                class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? t('patientVisits.saving') : t('patientVisits.save') }}
              </button>
              <button
                @click="closeStatusModal"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {{ t('patientVisits.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { CalendarDaysIcon, XMarkIcon, PlayIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import {
  getVisitStatusLabel,
  getAllowedNextStatuses,
  canChangeStatus,
  getActiveVisitStatuses,
  getDebtStatuses,
  getCompletedStatuses,
  VISIT_STATUSES
} from '@/constants/visitStatus'
import * as visitsApi from '@/api/visitsApi'

const { t } = useI18n()

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return `0 ${t('common.currencySuffix')}`
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

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

const emit = defineEmits(['visit-updated'])

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const visits = ref([])
const statusFilter = ref('all')
const showStatusModal = ref(false)
const selectedVisit = ref(null)
const newStatus = ref('')
const debtAmount = ref(null)
const statusError = ref('')
const saving = ref(false)
const updatingVisitId = ref(null)

// Computed
const filteredVisits = computed(() => {
  if (statusFilter.value === 'all') return visits.value
  
  if (statusFilter.value === 'active') {
    return visits.value.filter(v => getActiveVisitStatuses().includes(v.status))
  }
  
  if (statusFilter.value === 'debt') {
    return visits.value.filter(v => getDebtStatuses().includes(v.status))
  }
  
  if (statusFilter.value === 'completed') {
    return visits.value.filter(v => getCompletedStatuses().includes(v.status))
  }
  
  return visits.value.filter(v => v.status === statusFilter.value)
})

// Doktor "Qarzdor" dan "To'liq to'langan" ga o'tkaza olmaydi — faqat admin to'lov qilgach
const allowedStatuses = computed(() => {
  if (!selectedVisit.value) return []
  const next = getAllowedNextStatuses(selectedVisit.value.status)
  if (!isAdmin.value && selectedVisit.value.status === VISIT_STATUSES.COMPLETED_DEBT) {
    return next.filter(s => s !== VISIT_STATUSES.COMPLETED_PAID)
  }
  return next
})

// To'lovni faqat administrator kiritadi; doktor faqat narx va status belgilaydi
const isAdmin = computed(() => authStore.userRole === 'admin')

// Methods
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

// Faol visit tekshiruvi
const isActiveVisit = (status) => {
  return ['pending', 'arrived', 'in_progress'].includes(status)
}

// Visitni boshlash (pending/arrived → in_progress)
const startVisit = async (visit) => {
  if (!confirm('Davolanishni boshlashni tasdiqlaysizmi?')) return
  
  updatingVisitId.value = visit.id
  try {
    await visitsApi.updateVisit(visit.id, { status: 'in_progress' })
    toast.success('Davolanish boshlandi')
    await loadVisits()
    emit('visit-updated')
  } catch (error) {
    console.error('Failed to start visit:', error)
    toast.error('Xatolik yuz berdi')
  } finally {
    updatingVisitId.value = null
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

const openStatusModal = (visit) => {
  selectedVisit.value = visit
  newStatus.value = ''
  debtAmount.value = visit.debt_amount || null
  statusError.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  selectedVisit.value = null
  newStatus.value = ''
  debtAmount.value = null
  statusError.value = ''
}

const saveStatusChange = async () => {
  if (!newStatus.value || !selectedVisit.value) return
  
  statusError.value = ''
  
  // Validation
  if (newStatus.value === VISIT_STATUSES.COMPLETED_DEBT) {
    if (!debtAmount.value || debtAmount.value <= 0) {
      statusError.value = t('patientVisits.errorDebtRequired')
      return
    }
  }
  
  // Check if status change is allowed
  const currentDebt = selectedVisit.value.debt_amount || null
  if (!canChangeStatus(selectedVisit.value.status, newStatus.value, currentDebt)) {
    statusError.value = t('patientVisits.errorDebtBeforeComplete')
    return
  }
  
  saving.value = true
  
  try {
    const updateData = {
      status: newStatus.value
    }
    
    if (newStatus.value === VISIT_STATUSES.COMPLETED_DEBT) {
      updateData.debt_amount = Number(debtAmount.value)
    } else if (newStatus.value === VISIT_STATUSES.COMPLETED_PAID) {
      updateData.debt_amount = null
    }
    
    await visitsApi.updateVisit(selectedVisit.value.id, updateData)
    
    toast.success('Status muvaffaqiyatli o\'zgartirildi')
    await loadVisits()
    emit('visit-updated')
    closeStatusModal()
  } catch (error) {
    console.error('Failed to update visit status:', error)
    statusError.value = error.message || 'Statusni o\'zgartirishda xatolik'
    toast.error('Statusni o\'zgartirishda xatolik')
  } finally {
    saving.value = false
  }
}

onMounted(loadVisits)
watch(() => props.patientId, loadVisits)
</script>
