<template>
  <div class="space-y-6">
    <!-- Visit Selection Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl p-4 border border-gray-100">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">Tashrif:</label>
        <select
          v-model="selectedVisitId"
          @change="onVisitChange"
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          :disabled="loading"
        >
          <option value="">Tanlang...</option>
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
          Yangi tashrif
        </button>
        <button
          v-if="currentVisit && currentVisit.status === 'in_progress' && isDoctor"
          @click="completeCurrentVisit"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckIcon class="w-4 h-4" />
          Yakunlash
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
          Jami hisob: <span class="font-semibold text-slate-900">{{ formatCurrency(totalBill) }}</span>
        </span>
      </div>

      <div
        v-if="menuOpen && selectedToothId"
        ref="menuRef"
        class="fixed z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        :style="menuStyle"
      >
        <div class="px-2 pb-1 text-xs font-medium text-slate-500">
          Tish #{{ selectedToothId }} · {{ activeUserRole.toUpperCase() }}
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
            <span class="text-slate-700">{{ option.label }}</span>
          </span>
          <span v-if="option.price" class="text-xs text-slate-500">{{ formatCurrency(option.price) }}</span>
        </button>
      </div>

      <!-- Legend -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">Izoh:</h4>
        <div class="flex flex-wrap gap-3">
          <div v-for="(state, key) in TOOTH_STATES" :key="key" class="flex items-center gap-2">
            <span
              class="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
              :class="state.color"
            >
              {{ state.icon }}
            </span>
            <span class="text-sm text-gray-600">{{ state.label }}</span>
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
            Saqlash
          </template>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { PlusIcon, CheckIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/date'
import { getVisitStatusLabel } from '@/constants/visitStatus'
import * as visitsApi from '@/api/visitsApi'
import * as odontogramApi from '@/api/odontogramApi'
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
  { value: 'healthy', label: 'Sog\'lom', dotClass: 'bg-slate-200' },
  { value: 'caries', label: 'Karies', dotClass: 'bg-red-500' },
  { value: 'filling', label: 'Plomba', dotClass: 'bg-blue-500' },
  { value: 'crown', label: 'Krona', dotClass: 'bg-amber-500' },
  { value: 'missing', label: 'Yo\'q', dotClass: 'bg-slate-400' }
]

const servicesList = [
  { value: 'filling', label: 'Plomba', price: 150000, status: 'filling', dotClass: 'bg-blue-500' },
  { value: 'root_canal', label: 'Kanal tozalash', price: 250000, status: 'caries', dotClass: 'bg-red-500' },
  { value: 'crown', label: 'Krona', price: 350000, status: 'crown', dotClass: 'bg-amber-500' },
  { value: 'extraction', label: 'Tishni olib tashlash', price: 200000, status: 'missing', dotClass: 'bg-slate-400' }
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
  }).format(amount).replace('UZS', 'so\'m')
}

const toothStatusMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    map[tooth.id] = tooth.status
  })
  return map
})

const patientHistory = ref([])

const historyStorageKey = computed(() => `patient-history-${props.patient.id}`)

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

const loadPatientHistory = () => {
  const raw = localStorage.getItem(historyStorageKey.value)
  patientHistory.value = raw ? JSON.parse(raw) : []
}

const persistPatientHistory = () => {
  localStorage.setItem(historyStorageKey.value, JSON.stringify(patientHistory.value))
}

const addHistoryEntry = ({ toothId, serviceName, price }) => {
  patientHistory.value.unshift({
    id: Date.now(),
    toothId,
    serviceName,
    price,
    performedBy: 'Doctor tomonidan bajarildi',
    createdAt: new Date().toISOString()
  })
  persistPatientHistory()
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
    toast.error('Tashriflarni yuklashda xatolik')
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
    toast.error('Odontogrammani yuklashda xatolik')
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

    toast.success('Yangi tashrif boshlandi!')
  } catch (error) {
    console.error('Failed to create visit:', error)
    toast.error('Tashrif yaratishda xatolik')
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
    await visitsApi.completeVisit(currentVisit.value.id)
    currentVisit.value.status = 'completed_paid'

    // Update in list
    const index = visits.value.findIndex(v => v.id === currentVisit.value.id)
    if (index !== -1) {
      visits.value[index].status = 'completed_paid'
    }

    toast.success('Tashrif yakunlandi!')
  } catch (error) {
    console.error('Failed to complete visit:', error)
    toast.error('Tashrifni yakunlashda xatolik')
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

const applyMenuSelection = (option) => {
  if (!selectedToothId.value) return
  const status = option.status || option.value
  setToothStatus(status)

  if (isDoctor.value && option.price) {
    addHistoryEntry({
      toothId: selectedToothId.value,
      serviceName: option.label,
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
    toast.error('Odontogrammani saqlashda xatolik')
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
onMounted(() => {
  loadVisits()
  syncTeethFromOdontogram()
  loadPatientHistory()
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleEscape)
})

// Watch for patient change
watch(() => props.patient.id, () => {
  selectedVisitId.value = ''
  currentVisit.value = null
  currentOdontogram.value = null
  syncTeethFromOdontogram()
  loadPatientHistory()
  loadVisits()
})
</script>