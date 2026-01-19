<template>
  <div class="space-y-4">
    <!-- Header with Filter -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Tashriflar Tarixi</h3>
        <p class="text-sm text-gray-500 mt-1">
          Jami: {{ filteredVisits.length }} / {{ visits.length }}
        </p>
      </div>
      
      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">Filtrlash:</label>
        <select
          v-model="statusFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Barchasi</option>
          <option value="active">Aktiv (Yozildi/Keldi/Davolanish)</option>
          <option value="debt">Qarzdor</option>
          <option value="completed">Tugallangan</option>
          <option value="pending">Yozildi</option>
          <option value="arrived">Keldi</option>
          <option value="in_progress">Davolanish boshlandi</option>
          <option value="completed_debt">Qarzdor</option>
          <option value="completed_paid">Yakunlandi</option>
          <option value="cancelled">Bekor qilingan</option>
          <option value="no_show">Kelmagan</option>
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
        {{ statusFilter === 'all' ? 'Hozircha tashriflar yo\'q' : 'Filtrlangan tashriflar topilmadi' }}
      </p>
    </div>

    <!-- Visits Table -->
    <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sana va Vaqt
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Doktor
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Xizmat
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Izoh
              </th>
              <th v-if="canEdit" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Harakatlar
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
                <span class="text-sm text-gray-600">{{ visit.doctor_name || 'Doktor belgilanmagan' }}</span>
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
                  <!-- Faol visitlar uchun tezkor tugmalar -->
                  <template v-if="isActiveVisit(visit.status)">
                    <!-- "Boshlandi" tugmasi (pending yoki arrived dan in_progress ga) -->
                    <button
                      v-if="visit.status === 'pending' || visit.status === 'arrived'"
                      @click="startVisit(visit)"
                      :disabled="updatingVisitId === visit.id"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlayIcon class="w-3.5 h-3.5" />
                      Boshlandi
                    </button>
                    
                    <!-- "Yakunlandi" tugmasi (in_progress dan completed ga) -->
                    <button
                      v-if="visit.status === 'in_progress'"
                      @click="openCompleteModal(visit)"
                      :disabled="updatingVisitId === visit.id"
                      class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircleIcon class="w-3.5 h-3.5" />
                      Yakunlandi
                    </button>
                  </template>
                  
                  <!-- Barcha visitlar uchun "O'zgartirish" tugmasi -->
                  <button
                    @click="openStatusModal(visit)"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    O'zgartirish
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
                    <option value="">Tanlang...</option>
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
                    Qarzdorlik summasi (so'm):
                  </label>
                  <input
                    v-model.number="debtAmount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Masalan: 220000"
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
                {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
              <button
                @click="closeStatusModal"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Complete Visit Modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCompleteModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeCompleteModal"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Tashrifni yakunlash</h3>
                <button
                  @click="closeCompleteModal"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon class="w-6 h-6" />
                </button>
              </div>

              <div class="space-y-4">
                <!-- Price -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Xizmat narxi (so'm):
                  </label>
                  <input
                    v-model.number="completePrice"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Masalan: 500000"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Paid Amount -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    To'langan summa (so'm):
                  </label>
                  <input
                    v-model.number="completePaidAmount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Masalan: 300000"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <!-- Calculated Debt -->
                <div v-if="completePrice && completePrice > 0" class="bg-gray-50 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Qarzdorlik:</span>
                    <span
                      class="text-sm font-semibold"
                      :class="(completePrice - (completePaidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'"
                    >
                      {{ formatCurrency(Math.max(0, completePrice - (completePaidAmount || 0))) }}
                    </span>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="statusError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-600">{{ statusError }}</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                @click="completeVisit"
                :disabled="saving"
                class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? 'Yakunlanmoqda...' : 'Yakunlash' }}
              </button>
              <button
                @click="closeCompleteModal"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Bekor qilish
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
import { CalendarDaysIcon, XMarkIcon, PlayIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', 'so\'m')
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

const loading = ref(false)
const visits = ref([])
const statusFilter = ref('all')
const showStatusModal = ref(false)
const showCompleteModal = ref(false)
const selectedVisit = ref(null)
const newStatus = ref('')
const debtAmount = ref(null)
const statusError = ref('')
const saving = ref(false)
const updatingVisitId = ref(null)
const completePrice = ref(null)
const completePaidAmount = ref(null)

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

const allowedStatuses = computed(() => {
  if (!selectedVisit.value) return []
  return getAllowedNextStatuses(selectedVisit.value.status)
})

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

// Yakunlash modalini ochish
const openCompleteModal = (visit) => {
  selectedVisit.value = visit
  completePrice.value = visit.price || null
  completePaidAmount.value = visit.paid_amount || null
  statusError.value = ''
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  selectedVisit.value = null
  completePrice.value = null
  completePaidAmount.value = null
  statusError.value = ''
}

// Visitni yakunlash
const completeVisit = async () => {
  if (!selectedVisit.value) return
  
  statusError.value = ''
  
  const price = completePrice.value ? Number(completePrice.value) : null
  const paidAmount = completePaidAmount.value ? Number(completePaidAmount.value) : null
  
  // Qarz hisoblash
  let debt = null
  if (price !== null) {
    debt = price - (paidAmount || 0)
  }
  
  updatingVisitId.value = selectedVisit.value.id
  saving.value = true
  
  try {
    const updateData = {
      price,
      paid_amount: paidAmount,
      debt_amount: debt > 0 ? debt : null
    }
    
    // Agar qarz bo'lsa completed_debt, bo'lmasa completed_paid
    if (debt > 0) {
      updateData.status = 'completed_debt'
    } else {
      updateData.status = 'completed_paid'
      updateData.debt_amount = null
    }
    
    await visitsApi.updateVisit(selectedVisit.value.id, updateData)
    toast.success('Tashrif yakunlandi')
    await loadVisits()
    emit('visit-updated')
    closeCompleteModal()
  } catch (error) {
    console.error('Failed to complete visit:', error)
    statusError.value = error.message || 'Xatolik yuz berdi'
    toast.error('Tashrifni yakunlashda xatolik')
  } finally {
    updatingVisitId.value = null
    saving.value = false
  }
}

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visits:', error)
    toast.error('Tashriflarni yuklashda xatolik')
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
      statusError.value = 'Qarzdorlik summasi kiritilishi kerak'
      return
    }
  }
  
  // Check if status change is allowed
  const currentDebt = selectedVisit.value.debt_amount || null
  if (!canChangeStatus(selectedVisit.value.status, newStatus.value, currentDebt)) {
    statusError.value = 'Qarzdorlik tuzatilmasdan "Yakunlandi" statusiga o\'tib bo\'lmaydi'
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
