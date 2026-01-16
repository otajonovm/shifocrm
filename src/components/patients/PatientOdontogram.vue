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
          v-if="currentVisit && currentVisit.status === 'in_progress'"
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
      <!-- Upper Jaw -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <h4 class="text-sm font-semibold text-gray-700 mb-3 text-center">Yuqori Jag' (Upper)</h4>
        <div class="flex justify-center gap-1">
          <!-- Upper Right (18-11) -->
          <div class="flex gap-1">
            <div
              v-for="tooth in TOOTH_NUMBERS.upper_right"
              :key="tooth"
              class="relative"
            >
              <button
                @click="openToothEditor(tooth)"
                :disabled="!canEdit"
                class="w-10 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 disabled:hover:scale-100"
                :class="getToothClasses(tooth)"
              >
                <img
                  :src="`/teeth/${tooth}.svg`"
                  class="w-6 h-6"
                  @load="(e) => { const s = e.target.nextElementSibling; if (s) s.style.display = 'none' }"
                  @error="(e) => { e.target.style.display = 'none' }"
                />
                <span class="text-lg">{{ getToothIcon(tooth) }}</span>
              </button>
            </div>
          </div>

          <div class="w-px bg-gray-300 mx-1"></div>

          <!-- Upper Left (21-28) -->
          <div class="flex gap-1">
            <div
              v-for="tooth in TOOTH_NUMBERS.upper_left"
              :key="tooth"
              class="relative"
            >
              <button
                @click="openToothEditor(tooth)"
                :disabled="!canEdit"
                class="w-10 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 disabled:hover:scale-100"
                :class="getToothClasses(tooth)"
              >
                <img
                  :src="`/teeth/${tooth}.svg`"
                  class="w-6 h-6"
                  @load="(e) => { const s = e.target.nextElementSibling; if (s) s.style.display = 'none' }"
                  @error="(e) => { e.target.style.display = 'none' }"
                />
                <span class="text-lg">{{ getToothIcon(tooth) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lower Jaw -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex justify-center gap-1">
          <!-- Lower Left (31-38) -->
          <div class="flex gap-1">
            <div
              v-for="tooth in TOOTH_NUMBERS.lower_left"
              :key="tooth"
              class="relative"
            >
              <button
                @click="openToothEditor(tooth)"
                :disabled="!canEdit"
                class="w-10 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 disabled:hover:scale-100"
                :class="getToothClasses(tooth)"
              >
                <img
                  :src="`/teeth/${tooth}.svg`"
                  class="w-6 h-6"
                  @load="(e) => { const s = e.target.nextElementSibling; if (s) s.style.display = 'none' }"
                  @error="(e) => { e.target.style.display = 'none' }"
                />
                <span class="text-[10px] text-gray-400">{{ tooth }}</span>
              </button>
            </div>
          </div>

          <div class="w-px bg-gray-300 mx-1"></div>

          <!-- Lower Right (48-41) -->
          <div class="flex gap-1">
            <div
              v-for="tooth in TOOTH_NUMBERS.lower_right"
              :key="tooth"
              class="relative"
            >
              <button
                @click="openToothEditor(tooth)"
                :disabled="!canEdit"
                class="w-10 h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 disabled:hover:scale-100"
                :class="getToothClasses(tooth)"
              >
                <img
                  :src="`/teeth/${tooth}.svg`"
                  class="w-6 h-6"
                  @load="(e) => { const s = e.target.nextElementSibling; if (s) s.style.display = 'none' }"
                  @error="(e) => { e.target.style.display = 'none' }"
                />
                <span class="text-[10px] text-gray-400">{{ tooth }}</span>
              </button>
            </div>
          </div>
        </div>
        <h4 class="text-sm font-semibold text-gray-700 mt-3 text-center">Pastki Jag' (Lower)</h4>
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

    <!-- Tooth Editor Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="editingTooth"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeToothEditor"
        >
          <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Tish #{{ editingTooth }} - Holatini tanlang
              </h3>

              <div class="grid grid-cols-2 gap-2 mb-4">
                <button
                  v-for="(state, key) in TOOTH_STATES"
                  :key="key"
                  @click="setToothState(key)"
                  class="flex items-center gap-2 p-3 rounded-lg border-2 transition-all"
                  :class="editingToothData.state === key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <span
                    class="w-8 h-8 rounded flex items-center justify-center text-white"
                    :class="state.color"
                  >
                    {{ state.icon }}
                  </span>
                  <span class="text-sm font-medium text-gray-700">{{ state.label }}</span>
                </button>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Izoh</label>
                <textarea
                  v-model="editingToothData.note"
                  rows="2"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Qo'shimcha izoh..."
                ></textarea>
              </div>

              <div class="flex justify-end gap-2">
                <button
                  @click="closeToothEditor"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  @click="applyToothChanges"
                  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Qo'llash
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { PlusIcon, CheckIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/lib/date'
import { getVisitStatusBadge } from '@/lib/patientHelpers'
import * as visitsApi from '@/api/visitsApi'
import * as odontogramApi from '@/api/odontogramApi'

const { TOOTH_NUMBERS, TOOTH_STATES } = odontogramApi

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

// State
const loading = ref(false)
const saving = ref(false)
const visits = ref([])
const selectedVisitId = ref('')
const currentVisit = ref(null)
const currentOdontogram = ref(null)
const originalOdontogramData = ref(null)

// Tooth editor
const editingTooth = ref(null)
const editingToothData = ref({ state: 'healthy', note: '' })

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

// Methods
const formatVisitDate = (date) => formatDate(date)

const getVisitStatusText = (status) => getVisitStatusBadge(status).text

const getToothClasses = (toothNum) => {
  if (!currentOdontogram.value?.data?.teeth?.[toothNum]) {
    return 'border-gray-200 bg-gray-50'
  }

  const state = currentOdontogram.value.data.teeth[toothNum].state
  const stateConfig = TOOTH_STATES[state]

  if (!stateConfig) return 'border-gray-200 bg-gray-50'

  const colorMap = {
    'bg-green-500': 'border-green-400 bg-green-50',
    'bg-red-500': 'border-red-400 bg-red-50',
    'bg-blue-500': 'border-blue-400 bg-blue-50',
    'bg-gray-400': 'border-gray-400 bg-gray-100',
    'bg-yellow-500': 'border-yellow-400 bg-yellow-50',
    'bg-purple-500': 'border-purple-400 bg-purple-50'
  }

  return colorMap[stateConfig.color] || 'border-gray-200 bg-gray-50'
}

const getToothIcon = (toothNum) => {
  if (!currentOdontogram.value?.data?.teeth?.[toothNum]) return '○'

  const state = currentOdontogram.value.data.teeth[toothNum].state
  return TOOTH_STATES[state]?.icon || '○'
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
    currentVisit.value.status = 'completed'

    // Update in list
    const index = visits.value.findIndex(v => v.id === currentVisit.value.id)
    if (index !== -1) {
      visits.value[index].status = 'completed'
    }

    toast.success('Tashrif yakunlandi!')
  } catch (error) {
    console.error('Failed to complete visit:', error)
    toast.error('Tashrifni yakunlashda xatolik')
  } finally {
    loading.value = false
  }
}

const openToothEditor = (toothNum) => {
  if (!canEdit.value) return

  editingTooth.value = toothNum
  const currentData = currentOdontogram.value?.data?.teeth?.[toothNum] || { state: 'healthy', note: '' }
  editingToothData.value = { ...currentData }
}

const closeToothEditor = () => {
  editingTooth.value = null
  editingToothData.value = { state: 'healthy', note: '' }
}

const setToothState = (state) => {
  editingToothData.value.state = state
}

const applyToothChanges = () => {
  if (!editingTooth.value || !currentOdontogram.value) return

  if (!currentOdontogram.value.data.teeth) {
    currentOdontogram.value.data.teeth = {}
  }

  currentOdontogram.value.data.teeth[editingTooth.value] = { ...editingToothData.value }
  closeToothEditor()
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

// Lifecycle
onMounted(() => {
  loadVisits()
})

// Watch for patient change
watch(() => props.patient.id, () => {
  selectedVisitId.value = ''
  currentVisit.value = null
  currentOdontogram.value = null
  loadVisits()
})
</script>
