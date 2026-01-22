<template>
  <div class="space-y-6">
    <!-- Visit Selection Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 border border-gray-100">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">{{ t('odontogram.visit') }}</label>
        <select
          v-model="selectedVisitId"
          @change="onVisitChange"
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          :disabled="loading"
        >
          <option value="">{{ t('odontogram.select') }}</option>
          <option v-for="visit in visits" :key="visit.id" :value="visit.id">
            {{ formatVisitDate(visit.date) }} - {{ getVisitStatusText(visit.status) }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!hasActiveVisit"
          @click="startNewVisit"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <PlusIcon class="w-4 h-4" />
          {{ t('odontogram.newVisit') }}
        </button>
        <button
          v-if="currentVisit && currentVisit.status === 'in_progress' && isDoctor"
          @click="completeCurrentVisit"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckIcon class="w-4 h-4" />
          {{ t('odontogram.completeVisit') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- No Visit Selected -->
    <div v-else-if="!selectedVisitId" class="bg-gray-50 rounded-xl p-8 text-center">
      <DocumentTextIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">Odontogrammani ko'rish uchun tashrif tanlang yoki yangi tashrif boshlang</p>
    </div>

    <!-- Odontogram Content -->
    <div v-else class="space-y-6">
      <div class="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:overflow-visible sm:p-6">
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-slate-200"></div>
          <div class="pointer-events-none absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-slate-200"></div>

          <div class="space-y-6">
            <div class="flex justify-center">
              <div class="flex min-w-[820px] items-start gap-4">
                <div class="flex gap-2">
                  <Tooth
                    v-for="id in upperRight"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
                <div class="h-24 w-px bg-slate-200"></div>
                <div class="flex gap-2">
                  <Tooth
                    v-for="id in upperLeft"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
              </div>
            </div>

            <div class="flex justify-center">
              <div class="flex min-w-[820px] items-start gap-4">
                <div class="flex gap-2">
                  <Tooth
                    v-for="id in lowerLeft"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
                <div class="h-24 w-px bg-slate-200"></div>
                <div class="flex gap-2">
                  <Tooth
                    v-for="id in lowerRight"
                    :key="id"
                    :id="id"
                    :status="toothStatusMap[id]"
                    :disabled="!canEdit"
                    @select="openStatusMenu"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end text-sm text-slate-600">
        <span class="rounded-lg bg-slate-50 px-3 py-1.5">
          {{ t('odontogram.total') }}: <span class="font-semibold text-slate-900">{{ formatCurrency(totalBill) }}</span>
        </span>
      </div>

      <div
        v-if="menuOpen && selectedToothId"
        ref="menuRef"
        class="fixed z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        :style="menuStyle"
      >
        <div class="px-2 pb-1 text-xs font-medium text-slate-500">
          {{ t('odontogram.toothLabel', { id: selectedToothId }) }} · {{ activeUserRole.toUpperCase() }}
        </div>
        <button
          v-for="option in menuOptions"
          :key="option.value"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
          @click="applyMenuSelection(option)"
        >
          <span class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="option.dotClass"
            ></span>
            <span class="text-slate-700">{{ t(option.labelKey) }}</span>
          </span>
          <span v-if="option.price" class="text-xs text-slate-500">{{ formatCurrency(option.price) }}</span>
        </button>
      </div>

      <!-- Legend -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">{{ t('odontogram.noteLabel') }}</h4>
        <div class="flex flex-wrap gap-3">
          <div v-for="(state, key) in TOOTH_STATES" :key="key" class="flex items-center gap-2">
            <span
              class="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
              :class="state.color"
            >
              {{ state.icon }}
            </span>
            <span class="text-sm text-gray-600">{{ t(state.labelKey) }}</span>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div v-if="canEdit && hasChanges" class="flex justify-end">
        <button
          @click="saveOdontogram"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <template v-if="saving">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Saqlanmoqda...
          </template>
          <template v-else>
            {{ t('odontogram.save') }}
          </template>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, CheckIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/date'
import { getVisitStatusLabel } from '@/constants/visitStatus'
import * as visitsApi from '@/api/visitsApi'
import * as odontogramApi from '@/api/odontogramApi'
import * as visitServicesApi from '@/api/visitServicesApi'
import { createPayment, getPaymentsByVisitId } from '@/api/paymentsApi'
import Tooth from './Tooth.vue'

const { TOOTH_STATES } = odontogramApi

const props = defineProps({
  patient: {
    type: Object,
    required: true
  },
  doctorId: {
    type: [Number, String],
    default: null
  },
  doctorName: {
    type: String,
    default: ''
  }
})

const toast = useToast()
const authStore = useAuthStore()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const visits = ref([])
const selectedVisitId = ref('')
const currentVisit = ref(null)
const currentOdontogram = ref(null)
const originalOdontogramData = ref(null)

const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
const lowerLeft = [48, 47, 46, 45, 44, 43, 42, 41]
const lowerRight = [31, 32, 33, 34, 35, 36, 37, 38]
const toothIds = [...upperRight, ...upperLeft, ...lowerLeft, ...lowerRight]

const teeth = ref(toothIds.map(id => ({ id, status: 'healthy' })))
const selectedToothId = ref(null)
const menuOpen = ref(false)
const menuRef = ref(null)
const menuStyle = ref({ left: '0px', top: '0px', transform: 'translate(-50%, 0)' })
const ignoreClose = ref(false)

const statusOptions = [
  { value: 'healthy', labelKey: 'odontogram.statusHealthy', dotClass: 'bg-slate-200' },
  { value: 'caries', labelKey: 'odontogram.statusCaries', dotClass: 'bg-red-500' },
  { value: 'filling', labelKey: 'odontogram.statusFilling', dotClass: 'bg-blue-500' },
  { value: 'crown', labelKey: 'odontogram.statusCrown', dotClass: 'bg-amber-500' },
  { value: 'missing', labelKey: 'odontogram.statusMissing', dotClass: 'bg-slate-400' }
]

const servicesList = [
  { value: 'filling', labelKey: 'odontogram.serviceFilling', price: 150000, status: 'filling', dotClass: 'bg-blue-500' },
  { value: 'root_canal', labelKey: 'odontogram.serviceRootCanal', price: 250000, status: 'caries', dotClass: 'bg-red-500' },
  { value: 'crown', labelKey: 'odontogram.serviceCrown', price: 350000, status: 'crown', dotClass: 'bg-amber-500' },
  { value: 'extraction', labelKey: 'odontogram.serviceExtraction', price: 200000, status: 'missing', dotClass: 'bg-slate-400' }
]

// Computed
const hasActiveVisit = computed(() => {
  return visits.value.some(v => v.status === 'in_progress')
})

const canEdit = computed(() => {
  return currentVisit.value && currentVisit.value.status === 'in_progress'
})

const hasChanges = computed(() => {
  if (!currentOdontogram.value || !originalOdontogramData.value) return false
  return JSON.stringify(currentOdontogram.value.data) !== JSON.stringify(originalOdontogramData.value)
})

const activeUserRole = computed(() => authStore.userRole || 'doctor')
const isDoctor = computed(() => activeUserRole.value === 'doctor')

const menuOptions = computed(() => (isDoctor.value ? servicesList : statusOptions))

// Methods
const formatVisitDate = (date) => formatDate(date)

const getVisitStatusText = (status) => getVisitStatusLabel(status)

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const toothStatusMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    map[tooth.id] = tooth.status
  })
  return map
})

const patientHistory = ref([])

const totalBill = computed(() =>
  patientHistory.value.reduce((sum, entry) => sum + (Number(entry.price) || 0), 0)
)

const syncTeethFromOdontogram = () => {
  const data = currentOdontogram.value?.data?.teeth || {}
  teeth.value = toothIds.map((id) => ({
    id,
    status: data[id]?.state || 'healthy'
  }))
}

const loadPatientHistory = async () => {
  try {
    patientHistory.value = await visitServicesApi.getVisitServicesByPatientId(props.patient.id)
  } catch (error) {
    console.error('Failed to load visit services:', error)
    patientHistory.value = []
  }
}

const addHistoryEntry = async ({ toothId, serviceName, price }) => {
  if (!currentVisit.value?.id) {
    toast.error('Avval tashrifni tanlang')
    return
  }
  try {
    const entry = await visitServicesApi.createVisitService({
      visit_id: currentVisit.value.id,
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      tooth_id: toothId,
      service_name: serviceName,
      price,
      performed_by: authStore.user?.full_name || props.doctorName || 'Doctor'
    })
    patientHistory.value.unshift(entry)
  } catch (error) {
    console.error('Failed to save visit service:', error)
    toast.error(t('odontogram.errorSaveService'))
  }
}

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await visitsApi.getVisitsByPatientId(props.patient.id)

    // Auto-select active visit
    const activeVisit = visits.value.find(v => v.status === 'in_progress')
    if (activeVisit) {
      selectedVisitId.value = activeVisit.id
      await loadOdontogram(activeVisit.id)
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
    toast.error(t('odontogram.errorLoadVisits'))
  } finally {
    loading.value = false
  }
}

const loadOdontogram = async (visitId) => {
  if (!visitId) {
    currentOdontogram.value = null
    originalOdontogramData.value = null
    currentVisit.value = null
    return
  }

  loading.value = true
  try {
    currentVisit.value = await visitsApi.getVisitById(visitId)
    currentOdontogram.value = await odontogramApi.getOrCreateOdontogram({
      patient_id: props.patient.id,
      visit_id: visitId,
      doctor_id: props.doctorId
    })
    originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
    syncTeethFromOdontogram()
  } catch (error) {
    console.error('Failed to load odontogram:', error)
    toast.error(t('odontogram.errorLoadOdontogram'))
  } finally {
    loading.value = false
  }
}

const onVisitChange = () => {
  loadOdontogram(selectedVisitId.value)
}

const startNewVisit = async () => {
  loading.value = true
  try {
    const newVisit = await visitsApi.createVisit({
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      doctor_name: props.doctorName
    })

    visits.value.unshift(newVisit)
    selectedVisitId.value = newVisit.id
    await loadOdontogram(newVisit.id)

    toast.success(t('odontogram.toastVisitStarted'))
  } catch (error) {
    console.error('Failed to create visit:', error)
    toast.error(t('odontogram.errorCreateVisit'))
  } finally {
    loading.value = false
  }
}

const completeCurrentVisit = async () => {
  if (!currentVisit.value) return

  // Save odontogram first if there are changes
  if (hasChanges.value) {
    await saveOdontogram()
  }

  loading.value = true
  try {
    const services = await visitServicesApi.getVisitServicesByVisitId(currentVisit.value.id)
    const totalPrice = services.reduce((sum, entry) => sum + (Number(entry.price) || 0), 0)

    await visitsApi.updateVisit(currentVisit.value.id, {
      status: 'completed_paid',
      price: totalPrice,
      paid_amount: totalPrice,
      debt_amount: null
    })
    currentVisit.value.status = 'completed_paid'
    currentVisit.value.price = totalPrice
    currentVisit.value.paid_amount = totalPrice

    if (totalPrice > 0) {
      const existingPayments = await getPaymentsByVisitId(currentVisit.value.id)
      const netPaid = existingPayments.reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0
        return sum + (entry.payment_type === 'refund' ? -amount : amount)
      }, 0)

      if (netPaid < totalPrice) {
        await createPayment({
          visit_id: currentVisit.value.id,
          patient_id: props.patient.id,
          doctor_id: props.doctorId,
          amount: totalPrice - netPaid,
          payment_type: 'payment',
          method: 'cash',
          note: 'Odontogramma yakunlandi'
        })
      }
    }

    // Update in list
    const index = visits.value.findIndex(v => v.id === currentVisit.value.id)
    if (index !== -1) {
      visits.value[index].status = 'completed_paid'
      visits.value[index].price = totalPrice
      visits.value[index].paid_amount = totalPrice
    }

    toast.success(t('odontogram.toastVisitCompleted'))
  } catch (error) {
    console.error('Failed to complete visit:', error)
    toast.error(t('odontogram.errorCompleteVisit'))
  } finally {
    loading.value = false
  }
}

const openStatusMenu = ({ id, rect }) => {
  if (!canEdit.value) return
  selectedToothId.value = id
  menuOpen.value = true
  ignoreClose.value = true
  menuStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 8}px`,
    transform: 'translate(-50%, 0)'
  }
  setTimeout(() => {
    ignoreClose.value = false
  }, 0)
}

const closeStatusMenu = () => {
  menuOpen.value = false
  selectedToothId.value = null
}

const setToothStatus = (status) => {
  if (!selectedToothId.value) return
  const target = teeth.value.find((tooth) => tooth.id === selectedToothId.value)
  if (target) {
    target.status = status
  }

  if (currentOdontogram.value) {
    if (!currentOdontogram.value.data.teeth) {
      currentOdontogram.value.data.teeth = {}
    }
    const existing = currentOdontogram.value.data.teeth[selectedToothId.value] || { note: '' }
    currentOdontogram.value.data.teeth[selectedToothId.value] = { ...existing, state: status }
  }

  closeStatusMenu()
}

const applyMenuSelection = async (option) => {
  if (!selectedToothId.value) return
  const status = option.status || option.value
  setToothStatus(status)

  if (isDoctor.value && option.price) {
    await addHistoryEntry({
      toothId: selectedToothId.value,
      serviceName: t(option.labelKey),
      price: option.price
    })
  }
}

const saveOdontogram = async () => {
  if (!currentOdontogram.value) return

  saving.value = true
  try {
    await odontogramApi.updateOdontogramSnapshot(currentOdontogram.value.id, currentOdontogram.value.data)
    originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
    toast.success('Odontogramma saqlandi!')
  } catch (error) {
    console.error('Failed to save odontogram:', error)
    toast.error(t('odontogram.errorSaveOdontogram'))
  } finally {
    saving.value = false
  }
}

const handleDocumentClick = (event) => {
  if (ignoreClose.value) return
  if (menuRef.value && menuRef.value.contains(event.target)) return
  closeStatusMenu()
}

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeStatusMenu()
  }
}

// Lifecycle
onMounted(async () => {
  loadVisits()
  syncTeethFromOdontogram()
  await loadPatientHistory()
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleEscape)
})

// Watch for patient change
watch(() => props.patient.id, async () => {
  selectedVisitId.value = ''
  currentVisit.value = null
  currentOdontogram.value = null
  syncTeethFromOdontogram()
  await loadPatientHistory()
  loadVisits()
})
</script>