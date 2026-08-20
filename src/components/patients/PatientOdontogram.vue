<template>
  <div class="space-y-6">
    <OdontogramVisitHeader
      v-model="selectedVisitId"
      :visits="visits"
      :current-visit="currentVisit"
      :loading="loading"
      :has-active-visit="hasActiveVisit"
      :can-edit="canEdit"
      @change="onVisitChange"
      @new-visit="startNewVisit"
      @complete="requestCompleteVisit"
    />

    <div
      v-if="currentVisit && !canEdit"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      <LockClosedIcon class="mt-0.5 h-5 w-5 flex-none" />
      <div>
        <p class="font-semibold">{{ t('odontogram.readOnlyTitle') }}</p>
        <p class="mt-0.5 text-amber-700">{{ t('odontogram.readOnlyHint') }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- No Visit Selected -->
    <div v-else-if="!selectedVisitId" class="bg-gray-50 rounded-xl p-8 text-center">
      <DocumentTextIcon class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-500">{{ t('odontogram.emptyVisitHint') }}</p>
    </div>

    <!-- Odontogram Content — mobil-first, stomatolog uchun qulay -->
    <div v-else class="space-y-4 sm:space-y-6 pb-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          class="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          :aria-expanded="showLegend"
          @click="showLegend = !showLegend"
        >
          <InformationCircleIcon class="h-5 w-5 text-primary-500" />
          {{ t('odontogram.legend') }}
          <ChevronDownIcon class="h-4 w-4 transition-transform" :class="{ 'rotate-180': showLegend }" />
        </button>
        <div
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          :class="saveStateClass"
          role="status"
          aria-live="polite"
        >
          <span class="h-2 w-2 rounded-full bg-current"></span>
          {{ saveStateText }}
          <button
            v-if="saveState === 'error'"
            type="button"
            class="font-semibold underline"
            @click="resolveSaveIssue"
          >
            {{ isSaveConflict ? t('odontogram.reloadLatest') : t('odontogram.retry') }}
          </button>
        </div>
      </div>

      <div v-if="showLegend" class="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-6">
        <div v-for="option in statusOptions" :key="option.value" class="flex items-center gap-2 text-xs text-slate-700">
          <span class="h-3 w-3 rounded-full" :class="option.dotClass"></span>
          {{ t(option.labelKey) }}
        </div>
      </div>

      <TeethGrid
        :status-map="toothStatusMap"
        :service-color-map="toothServiceColorMap"
        :service-label-map="toothServiceLabelMap"
        :selected-tooth-id="selectedToothId"
        :disabled="!canEdit"
        @select="openStatusMenu"
      />

      <OdontogramSummary
        :services-total="servicesTotal"
        :material-total="consumptionsTotal"
        :total="totalBill"
        :format-currency="formatCurrency"
      />

      <OdontogramMaterialSection
        :consumptions="consumptions"
        :loading="consumptionsLoading"
        :can-manage="canManageMaterial"
        :deleting-id="consumptionDeleting"
        :total="consumptionsTotal"
        :item-label="itemLabel"
        :entry-total="consumptionTotal"
        :format-currency="formatCurrency"
        @add="openConsumptionModal"
        @delete="requestDeleteConsumption"
      />

      <VisitExpensePanel
        v-if="currentVisit?.id && showVisitExpenses"
        :visit-id="currentVisit.id"
        :doctor-id="doctorId || currentVisit.doctor_id"
        :patient-id="patient.id"
      />

      <!-- Desktop: floating menu -->
      <Teleport to="body">
        <div
          v-if="menuOpen && selectedToothId"
          ref="menuRef"
          role="dialog"
          :aria-label="t('odontogram.toothLabel', { id: selectedToothId })"
          class="fixed z-[70] hidden w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:block"
          :style="menuStyle"
        >
          <div class="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2">
            <div>
              <p class="font-semibold text-slate-900">{{ t('odontogram.toothLabel', { id: selectedToothId }) }}</p>
              <p class="text-xs text-slate-500">{{ t('odontogram.chooseTreatment') }}</p>
            </div>
            <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100" @click="closeStatusMenu">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <OdontogramToothPanel
            :options="menuOptionsWithClear"
            :format-currency="formatCurrency"
            :loading="applyingToothSelection"
            @select="applyMenuSelection"
          />
        </div>
      </Teleport>

      <!-- Mobile: bottom sheet — stomatolog uchun barmoq bilan qulay -->
      <MobileBottomSheet
        :model-value="menuOpen && !!selectedToothId"
        :title="selectedToothId ? t('odontogram.toothLabel', { id: selectedToothId }) : ''"
        @update:model-value="(value) => { if (!value) closeStatusMenu() }"
      >
        <p class="mb-3 text-sm text-slate-500">{{ t('odontogram.chooseTreatment') }}</p>
        <OdontogramToothPanel
          :options="menuOptionsWithClear"
          :format-currency="formatCurrency"
          :loading="applyingToothSelection"
          @select="applyMenuSelection"
        />
      </MobileBottomSheet>
    </div>

  </div>

  <!-- Material sarfi modali — mobil: bottom sheet, desktop: markaziy modal -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="showConsumptionModal" class="fixed inset-0 z-50 hidden overflow-y-auto md:block" @click.self="closeConsumptionModal">
      <div class="fixed inset-0 bg-black/40 md:bg-gray-500/75 transition-opacity" @click="closeConsumptionModal"></div>
      <!-- Desktop: markaziy modal -->
      <div class="hidden md:flex items-center justify-center min-h-screen px-4 py-8">
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl" @click.stop>
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">{{ t('odontogram.addMaterial') }}</h3>
            <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg" @click="closeConsumptionModal">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialItem') }}</label>
                <select v-model="consumptionForm.item_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">{{ t('odontogram.selectMaterial') }}</option>
                  <option v-for="item in inventoryItems" :key="item.id" :value="String(item.id)">
                    {{ formatMaterialOption(item) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialQty') }}</label>
                <input v-model="consumptionForm.quantity" type="number" min="0" step="0.01" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="0" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('odontogram.materialNote') }}</label>
                <input v-model="consumptionForm.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeConsumptionModal">
              {{ t('odontogram.cancel') }}
            </button>
            <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveConsumption">
              {{ t('odontogram.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <MobileBottomSheet
    v-model="showConsumptionModal"
    :title="t('odontogram.addMaterial')"
  >
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('odontogram.materialItem') }}</label>
        <select v-model="consumptionForm.item_id" class="min-h-[48px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base">
          <option value="">{{ t('odontogram.selectMaterial') }}</option>
          <option v-for="item in inventoryItems" :key="item.id" :value="String(item.id)">
            {{ formatMaterialOption(item) }}
          </option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('odontogram.materialQty') }}</label>
        <input v-model="consumptionForm.quantity" type="number" min="0" step="0.01" class="min-h-[48px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base" placeholder="0" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('odontogram.materialNote') }}</label>
        <input v-model="consumptionForm.note" type="text" class="min-h-[48px] w-full rounded-xl border border-gray-200 px-4 py-3 text-base" />
      </div>
    </div>
    <template #footer>
      <div class="flex gap-3">
        <button class="min-h-[48px] flex-1 rounded-xl border border-gray-300 font-medium text-gray-700" @click="closeConsumptionModal">
          {{ t('odontogram.cancel') }}
        </button>
        <button class="min-h-[48px] flex-1 rounded-xl bg-primary-600 font-medium text-white" @click="saveConsumption">
          {{ t('odontogram.save') }}
        </button>
      </div>
    </template>
  </MobileBottomSheet>

  <Teleport to="body">
    <div
      v-if="confirmation"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="confirmation.title"
      @click.self="confirmation = null"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-900">{{ confirmation.title }}</h3>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ confirmation.message }}</p>
        <div v-if="confirmation.choices?.length" class="mt-5 flex flex-col gap-2">
          <button
            v-for="choice in confirmation.choices"
            :key="choice.id"
            type="button"
            class="min-h-[44px] rounded-xl px-4 text-sm font-semibold"
            :class="choice.tone === 'debt'
              ? 'border border-rose-200 bg-rose-50 text-rose-700'
              : 'bg-emerald-600 text-white'"
            @click="runConfirmationChoice(choice)"
          >
            {{ choice.label }}
          </button>
          <button type="button" class="min-h-[44px] rounded-xl border border-slate-300 font-medium text-slate-700" @click="confirmation = null">
            {{ t('odontogram.cancel') }}
          </button>
        </div>
        <div v-else class="mt-5 flex gap-3">
          <button type="button" class="min-h-[44px] flex-1 rounded-xl border border-slate-300 font-medium text-slate-700" @click="confirmation = null">
            {{ t('odontogram.cancel') }}
          </button>
          <button type="button" class="min-h-[44px] flex-1 rounded-xl bg-primary-600 font-medium text-white" @click="confirmRequestedAction">
            {{ t('odontogram.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronDownIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LockClosedIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isAdminLike, isDoctorLike, isSolo } from '@/lib/roles'
import * as clinicalService from '@/services/odontogramService'
import { normalizeToothStatus, PERMANENT_TEETH, toStorageToothState } from '@/domain/odontogram'
import { preloadToothSvgs } from '@/lib/preloadToothSvgs'
import { useSubscriptionStore } from '@/stores/subscription'
import { FEATURE_KEYS } from '@/lib/subscriptionFeatures'
import { visitDueFrom } from '@/lib/paymentTotals'
import MobileBottomSheet from '@/components/shared/MobileBottomSheet.vue'
import TeethGrid from './TeethGrid.vue'
import OdontogramToothPanel from './OdontogramToothPanel.vue'
import OdontogramVisitHeader from './OdontogramVisitHeader.vue'
import OdontogramSummary from './OdontogramSummary.vue'
import OdontogramMaterialSection from './OdontogramMaterialSection.vue'
import VisitExpensePanel from './VisitExpensePanel.vue'

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
  },
  initialVisitId: {
    type: [Number, String],
    default: null
  }
})

const toast = useToast()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const { t } = useI18n()

// State
const loading = ref(false)
const visits = ref([])
const selectedVisitId = ref('')
const currentVisit = ref(null)
const currentOdontogram = ref(null)
const originalOdontogramData = ref(null)
const saveState = ref('saved')
const saveError = ref(null)
const showLegend = ref(false)
const confirmation = ref(null)
const toothIds = [...PERMANENT_TEETH]

const teeth = ref(toothIds.map(id => ({ id, status: 'healthy', service_id: null })))
const selectedToothId = ref(null)
const menuOpen = ref(false)
const applyingToothSelection = ref(false)
const menuRef = ref(null)
const menuStyle = ref({ left: '0px', top: '0px', transform: 'translate(-50%, 0)' })
const ignoreClose = ref(false)

const statusOptions = [
  { type: 'status', value: 'healthy', labelKey: 'odontogram.statusHealthy', dotClass: 'bg-slate-200' },
  { type: 'status', value: 'caries', labelKey: 'odontogram.statusCaries', dotClass: 'bg-red-500' },
  { type: 'status', value: 'filling', labelKey: 'odontogram.statusFilling', dotClass: 'bg-blue-500' },
  { type: 'status', value: 'crown', labelKey: 'odontogram.statusCrown', dotClass: 'bg-amber-500' },
  { type: 'status', value: 'root_canal', labelKey: 'odontogram.statusRootCanal', dotClass: 'bg-violet-500' },
  { type: 'status', value: 'missing', labelKey: 'odontogram.statusMissing', dotClass: 'bg-slate-400' }
]

const servicesList = ref([])
const inventoryItems = ref([])
const consumptions = ref([])
const consumptionsLoading = ref(false)
const consumptionDeleting = ref(null)
const showConsumptionModal = ref(false)
const consumptionForm = ref({
  item_id: '',
  quantity: '',
  note: ''
})

// Computed
const EDITABLE_VISIT_STATUSES = ['pending', 'arrived', 'in_progress']

const hasActiveVisit = computed(() => {
  return visits.value.some(v => EDITABLE_VISIT_STATUSES.includes(v.status))
})

const canEdit = computed(() => {
  return currentVisit.value && EDITABLE_VISIT_STATUSES.includes(currentVisit.value.status)
})

const isSaveConflict = computed(() => clinicalService.isVersionConflictError(saveError.value))

const saveStateText = computed(() => {
  if (saveState.value === 'error' && isSaveConflict.value) return t('odontogram.saveConflict')
  return {
    pending: t('odontogram.savePending'),
    saving: t('odontogram.saving'),
    saved: t('odontogram.saved'),
    error: t('odontogram.saveFailed'),
  }[saveState.value] || t('odontogram.saved')
})

const saveStateClass = computed(() => ({
  pending: 'bg-amber-50 text-amber-700',
  saving: 'bg-blue-50 text-blue-700',
  saved: 'bg-emerald-50 text-emerald-700',
  error: 'bg-red-50 text-red-700',
}[saveState.value]))

const hasChanges = computed(() => {
  if (!currentOdontogram.value || !originalOdontogramData.value) return false
  return JSON.stringify(currentOdontogram.value.data) !== JSON.stringify(originalOdontogramData.value)
})

const isAdminLikeUser = computed(() => isAdminLike(authStore))
// Yakunlangan tashrif klinik snapshot sifatida o'zgarmaydi.
const canManageMaterial = computed(() => {
  if (!selectedVisitId.value || !canEdit.value) return false
  return isAdminLikeUser.value || isDoctorLike(authStore)
})
const showVisitExpenses = computed(() => isSolo(authStore) || isDoctorLike(authStore) || isAdminLikeUser.value)

const saveQueue = clinicalService.createSaveQueue({
  getRecord: () => currentOdontogram.value,
  onSaved: (saved) => {
    if (!currentOdontogram.value || String(saved.id) !== String(currentOdontogram.value.id)) return
    currentOdontogram.value.version = saved.version
    originalOdontogramData.value = JSON.parse(JSON.stringify(saved.data))
  },
  onState: (state, error) => {
    saveState.value = state
    saveError.value = error
  },
})

const retrySave = async () => {
  try {
    await saveQueue.retry()
  } catch {
    toast.error(t('odontogram.errorSaveOdontogram'))
  }
}

const resolveSaveIssue = async () => {
  if (isSaveConflict.value) {
    saveQueue.discard()
    await loadOdontogram(selectedVisitId.value)
    toast.warning(t('odontogram.conflictReloaded'))
    return
  }
  await retrySave()
}

const requestConfirmation = ({ title, message, action }) => {
  confirmation.value = { title, message, action }
}

const confirmRequestedAction = async () => {
  const action = confirmation.value?.action
  confirmation.value = null
  if (action) await action()
}

const runConfirmationChoice = async (choice) => {
  confirmation.value = null
  if (choice?.action) await choice.action()
}

const menuOptions = computed(() => servicesList.value)

// Tanlangan tishda xizmat bor bo'lsa — "Tozalash" birinchi qatorga
const menuOptionsWithClear = computed(() => {
  const opts = menuOptions.value
  const tid = selectedToothId.value
  const tooth = teeth.value.find((t) => t.id === tid)
  const hasService = tooth?.service_id || tooth?.status !== 'healthy'
  if (!hasService || !tid) return opts
  const clearOption = {
    type: 'status',
    value: 'healthy',
    labelKey: 'odontogram.statusClear',
    dotClass: 'bg-slate-200'
  }
  return [clearOption, ...opts.filter(option => option.value !== 'healthy')]
})

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

// Har bir tish uchun status map - faqat odontogramdan olinadi
const toothStatusMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    map[tooth.id] = tooth.status
  })
  return map
})

// Tish uchun xizmat rangi (xizmatlar bo'limida sozlangan rang)
const toothServiceColorMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    const sid = tooth.service_id
    if (sid) {
      const svc = servicesList.value.find(s => s.value === String(sid))
      map[tooth.id] = svc?.colorHex || '#0ea5e9'
    } else if (tooth.status && tooth.status !== 'healthy') {
      map[tooth.id] = null
    } else {
      map[tooth.id] = null
    }
  })
  return map
})

const toothServiceLabelMap = computed(() => {
  const map = {}
  teeth.value.forEach((tooth) => {
    if (!tooth.service_id) {
      map[tooth.id] = ''
      return
    }
    const billed = visitServices.value.find((entry) => Number(entry.tooth_id) === Number(tooth.id))
    const svc = servicesList.value.find((item) => item.value === String(tooth.service_id))
    map[tooth.id] = billed?.service_name || svc?.label || ''
  })
  return map
})

const visitServices = ref([]) // Joriy tashrif xizmatlari — jami hisob uchun

const parsePrice = (v) => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/\s|,/g, '')) : Number(v)
  return Number.isFinite(n) ? n : 0
}

// visit_services dan to'g'ridan-to'g'ri hisoblaymiz (faqat tooth_id bo'lganlar)
// Bu to'g'ri, chunki visit_services — asosiy manba, odontogram.data.teeth esa faqat ko'rinish
const servicesTotal = computed(() => {
  const seen = new Set()
  let sum = 0
  const sorted = [...visitServices.value].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  for (const e of sorted) {
    const tid = e.tooth_id
    if (tid == null) continue // tooth_id bo'lmagan yozuvlar tish xizmati emas
    const key = `t${tid}`
    if (seen.has(key)) continue // Har tish uchun faqat oxirgi xizmat
    seen.add(key)
    sum += parsePrice(e.price)
  }
  return sum
})

// Material sarfi jami (tashrif bo'yicha)
const consumptionsTotal = computed(() =>
  consumptions.value.reduce((sum, entry) => sum + consumptionTotal(entry), 0)
)

// Bemor hisobi = faqat xizmatlar (material tannarxi COGS, billga kirmaydi)
const totalBill = computed(() => servicesTotal.value)

const syncTeethFromOdontogram = () => {
  const raw = currentOdontogram.value?.data?.teeth
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  teeth.value = toothIds.map((id) => {
    // API dan kelganda kalitlar string bo'lishi mumkin; raqam bilan ham tekshiramiz
    const toothData = data[id] ?? data[String(id)]
    const state = normalizeToothStatus(toothData?.state ?? toothData?.status)
    if (!toothData || state === 'healthy') {
      return { id, status: 'healthy', service_id: null }
    }
    return {
      id,
      status: state,
      service_id: toothData.service_id ?? null
    }
  })
}

// visit_services dan faqat odontogramda yo'q tishlarni qo'shamiz — mavjud tishlarni overwrite qilmaymiz
// Bu funksiya faqat yangi tashrif yaratilganda chaqiriladi
const loadVisitServices = async (visitId = currentVisit.value?.id) => {
  if (!visitId) {
    visitServices.value = []
    return
  }
  try {
    const rows = await clinicalService.getVisitServices(visitId)
    if (String(currentVisit.value?.id) !== String(visitId)) return
    visitServices.value = rows
  } catch (error) {
    console.error('Failed to load visit services:', error)
    if (String(currentVisit.value?.id) === String(visitId)) visitServices.value = []
  }
}

const loadInventoryItems = async () => {
  try {
    inventoryItems.value = await clinicalService.getClinicInventoryItems(authStore)
  } catch (error) {
    console.error('Failed to load inventory items:', error)
    inventoryItems.value = []
  }
}

const loadConsumptions = async (visitId = currentVisit.value?.id) => {
  if (!visitId) {
    consumptions.value = []
    return
  }
  consumptionsLoading.value = true
  try {
    const rows = await clinicalService.getVisitConsumptions(authStore, visitId)
    if (String(currentVisit.value?.id) !== String(visitId)) return
    consumptions.value = rows
  } catch (error) {
    console.error('Failed to load consumptions:', error)
    if (String(currentVisit.value?.id) === String(visitId)) consumptions.value = []
  } finally {
    if (String(currentVisit.value?.id) === String(visitId)) consumptionsLoading.value = false
  }
}

const itemLabel = (itemId) => {
  const match = inventoryItems.value.find(item => Number(item.id) === Number(itemId))
  return match ? match.name : `#${itemId}`
}

const itemPrice = (itemId) => {
  const match = inventoryItems.value.find(item => Number(item.id) === Number(itemId))
  return match ? (Number(match.cost_price) || 0) : 0
}

const formatMaterialOption = (item) => {
  const stock = item.current_stock ?? 0
  const price = Number(item.cost_price) || 0
  const unit = item.unit || ''
  const stockStr = unit ? `${stock} ${unit}` : stock
  const priceStr = formatCurrency(price)
  return `${item.name} (${t('odontogram.materialStock')}: ${stockStr}) — ${priceStr}`
}

const consumptionTotal = (entry) => {
  const qty = Number(entry.quantity) || 0
  const price = itemPrice(entry.item_id)
  return qty * price
}

const openConsumptionModal = () => {
  consumptionForm.value = {
    item_id: '',
    quantity: '',
    note: ''
  }
  showConsumptionModal.value = true
}

const closeConsumptionModal = () => {
  showConsumptionModal.value = false
}

const requestDeleteConsumption = (entry) => {
  requestConfirmation({
    title: t('odontogram.deleteMaterialTitle'),
    message: t('odontogram.confirmDeleteMaterial'),
    action: () => deleteConsumption(entry),
  })
}

const deleteConsumption = async (entry) => {
  if (!currentVisit.value?.id) return
  consumptionDeleting.value = entry.id
  try {
    await clinicalService.removeVisitConsumption(authStore, entry.id)
    toast.success(t('odontogram.toastMaterialDeleted'))
    await Promise.all([loadConsumptions(), loadInventoryItems()])
  } catch (error) {
    console.error('Failed to delete consumption:', error)
    toast.error(t('odontogram.errorMaterialDelete'))
  } finally {
    consumptionDeleting.value = null
  }
}

const saveConsumption = async () => {
  if (!currentVisit.value?.id) return
  if (!consumptionForm.value.item_id) {
    toast.error(t('odontogram.errorMaterialRequired'))
    return
  }
  const quantity = Number(consumptionForm.value.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    toast.error(t('odontogram.errorMaterialQty'))
    return
  }
  const selectedItem = inventoryItems.value.find(item => Number(item.id) === Number(consumptionForm.value.item_id))
  if (selectedItem && Number.isFinite(Number(selectedItem.current_stock)) && quantity > Number(selectedItem.current_stock)) {
    toast.error(t('odontogram.errorMaterialStock'))
    return
  }
  try {
    await clinicalService.addVisitConsumption(authStore, {
      visit_id: currentVisit.value.id,
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      item_id: Number(consumptionForm.value.item_id),
      quantity,
      note: consumptionForm.value.note || null
    })
    toast.success(t('odontogram.toastMaterialAdded'))
    await Promise.all([loadConsumptions(), loadInventoryItems()])
    closeConsumptionModal()
  } catch (error) {
    console.error('Failed to save consumption:', error)
    const message = error?.message || t('odontogram.errorMaterialSave')
    toast.error(message)
  }
}

const ODONTOGRAM_COLOR_MAP = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500'
}

// Xizmat ranglari — tish SVG fill/stroke uchun hex
const ODONTOGRAM_COLOR_HEX = {
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  emerald: '#10b981',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  slate: '#64748b'
}

// Xizmat nomidan tish statusini aniqlash (stomatolog uchun avtomatik rang)
const inferStatusFromServiceName = (name) => {
  if (!name) return null
  const n = name.toLowerCase()
  if (/plomb|пломб|filling|to'ldirish/i.test(n)) return 'filling'
  if (/krona|корон|crown/i.test(n)) return 'crown'
  if (/olib tashlash|удален|extraction|sug'urish/i.test(n)) return 'missing'
  if (/kanal|canal|root|endodont/i.test(n)) return 'root_canal'
  if (/karies|кариес|caries/i.test(n)) return 'caries'
  return null
}

const mapServiceToOption = (service) => ({
  type: 'service',
  value: String(service.id),
  label: service.name,
  price: Number(service.base_price) || 0,
  dotClass: ODONTOGRAM_COLOR_MAP[service.odontogram_color] || 'bg-cyan-500',
  colorHex: ODONTOGRAM_COLOR_HEX[service.odontogram_color] || '#06b6d4',
  inferredStatus: inferStatusFromServiceName(service.name)
})

const loadServicesMenu = async () => {
  try {
    const query = 'show_in_odontogram=eq.true&select=id,name,base_price,odontogram_color,is_active,show_in_odontogram&order=created_at.desc'
    let data
    try {
      data = await clinicalService.getClinicServices(query)
    } catch {
      data = await clinicalService.getClinicServices('order=created_at.desc')
    }
    const seen = new Set()
    servicesList.value = (data || [])
      .filter((service) => service.is_active !== false && service.show_in_odontogram === true)
      .map(mapServiceToOption)
      .filter((option) => {
        const key = `${option.label}|${option.price}`
        if (seen.has(option.value) || seen.has(key)) return false
        seen.add(option.value)
        seen.add(key)
        return true
      })
  } catch (error) {
    console.error('Failed to load services list:', error)
    servicesList.value = []
  }
}

const loadChartExtras = (token, visitId) => Promise.all([
  loadServicesMenu(),
  loadConsumptions(visitId),
  loadVisitServices(visitId),
  loadInventoryItems(),
]).catch((error) => {
  if (token !== odontogramLoadToken) return
  console.error('Failed to load odontogram extras:', error)
})

let odontogramLoadToken = 0

const loadVisits = async () => {
  loading.value = true
  try {
    visits.value = await clinicalService.getPatientVisits(props.patient.id)

    const preferredId = props.initialVisitId
      ? visits.value.find((v) => String(v.id) === String(props.initialVisitId))?.id
      : null
    const activeVisit = visits.value.find(v => v.status === 'in_progress')
    const visitToLoad = preferredId
      ? visits.value.find((v) => String(v.id) === String(preferredId))
      : (activeVisit || (visits.value.length > 0 && !selectedVisitId.value ? visits.value[0] : null))

    if (visitToLoad) {
      selectedVisitId.value = visitToLoad.id
      await loadOdontogram(visitToLoad.id)
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

  const token = ++odontogramLoadToken
  loading.value = true
  try {
    const fromList = visits.value.find((v) => String(v.id) === String(visitId))
    currentVisit.value = fromList || await clinicalService.getVisit(visitId)
    if (token !== odontogramLoadToken) return

    if (['pending', 'arrived'].includes(currentVisit.value?.status)) {
      clinicalService.updateVisit(visitId, { status: 'in_progress' }).then((started) => {
        if (token !== odontogramLoadToken) return
        currentVisit.value = started || { ...currentVisit.value, status: 'in_progress' }
        const idx = visits.value.findIndex(v => String(v.id) === String(visitId))
        if (idx !== -1) visits.value[idx] = { ...visits.value[idx], status: 'in_progress' }
      }).catch((startError) => {
        console.warn('Visitni avtomatik boshlash:', startError)
      })
    }

    currentOdontogram.value = await clinicalService.getOrCreateOdontogram({
      patient_id: props.patient.id,
      visit_id: visitId,
      doctor_id: props.doctorId
    })
    if (token !== odontogramLoadToken) return
    originalOdontogramData.value = JSON.parse(JSON.stringify(currentOdontogram.value.data))
    saveState.value = 'saved'
    saveError.value = null
    syncTeethFromOdontogram()
    loading.value = false
    loadChartExtras(token, visitId)
  } catch (error) {
    if (token !== odontogramLoadToken) return
    console.error('Failed to load odontogram:', error)
    toast.error(t('odontogram.errorLoadOdontogram'))
  } finally {
    if (token === odontogramLoadToken) loading.value = false
  }
}

const onVisitChange = async () => {
  try {
    await saveQueue.flush()
  } catch {
    toast.error(t('odontogram.errorSaveOdontogram'))
    return
  }
  await loadOdontogram(selectedVisitId.value)
}

const startNewVisit = async () => {
  loading.value = true
  try {
    const newVisit = await clinicalService.createVisit({
      patient_id: props.patient.id,
      doctor_id: props.doctorId,
      doctor_name: props.doctorName,
      status: 'in_progress'
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

const completeCurrentVisit = async (settlement = 'auto') => {
  if (!currentVisit.value) return

  // Save odontogram first if there are changes
  if (hasChanges.value) {
    await saveOdontogram()
  }

  loading.value = true
  try {
    if (visitServices.value.length === 0) {
      visitServices.value = await clinicalService.getVisitServices(currentVisit.value.id)
    }
    const totalPrice = totalBill.value

    // Odontogrammani yakunlash - data ichiga status va completed_at qo'shamiz
    if (currentOdontogram.value?.id) {
      try {
        const completedData = {
          ...currentOdontogram.value.data,
          _status: 'completed',
          _completed_at: new Date().toISOString()
        }
        const completed = await clinicalService.saveSnapshot(currentOdontogram.value, completedData)
        currentOdontogram.value = completed
      } catch (err) {
        console.warn('Failed to mark odontogram as completed:', err)
      }
    }

    let remaining = Math.max(0, totalPrice)
    let netPaid = 0
    try {
      const existingPayments = await clinicalService.getVisitPayments(currentVisit.value.id)
      const ledger = visitDueFrom({
        services: visitServices.value,
        visitPrice: totalPrice,
        payments: existingPayments,
      })
      remaining = ledger.remaining
      netPaid = ledger.paid
    } catch (err) {
      console.warn('Failed to load payments for completion:', err)
    }

    let markPaid = settlement === 'paid' || (settlement === 'auto' && remaining <= 0)
    if (markPaid && remaining > 0) {
      try {
        const recorded = await clinicalService.recordVisitPayment({
          visitId: currentVisit.value.id,
          amount: remaining,
          type: 'payment',
          method: 'cash',
          patientId: props.patient.id,
          doctorId: props.doctorId || currentVisit.value.doctor_id,
          note: 'Yakunlash: to\'liq to\'landi',
        })
        netPaid = remaining + netPaid
        if (recorded?.cashback && recorded.cashback.ok === false) {
          toast.warning(t('odontogram.cashbackWarning'))
        }
      } catch (paymentError) {
        console.warn('Yakunlash to\'lovini yozish:', paymentError)
        toast.error(t('odontogram.errorRecordPayment'))
        markPaid = false
      }
    }
    const nextStatus = markPaid ? 'completed_paid' : 'completed_debt'
    const paidAmount = netPaid
    const debtAmount = markPaid ? null : remaining

    await clinicalService.updateVisit(currentVisit.value.id, {
      status: nextStatus,
      price: totalPrice,
      paid_amount: paidAmount,
      debt_amount: debtAmount
    })
    currentVisit.value.status = nextStatus
    currentVisit.value.price = totalPrice
    currentVisit.value.paid_amount = paidAmount
    currentVisit.value.debt_amount = debtAmount

    const index = visits.value.findIndex(v => v.id === currentVisit.value.id)
    if (index !== -1) {
      visits.value[index].status = nextStatus
      visits.value[index].price = totalPrice
      visits.value[index].paid_amount = paidAmount
      visits.value[index].debt_amount = debtAmount
    }

    try {
      await clinicalService.updatePatientStatus(props.patient.id, {
        status: markPaid ? 'completed' : 'debt',
        last_visit: new Date().toISOString().split('T')[0],
      })
    } catch (patientError) {
      console.warn('Bemor statusini yangilash:', patientError)
    }

    toast.success(markPaid ? t('odontogram.toastVisitCompletedPaid') : t('odontogram.toastVisitCompletedDebt'))

    // Telegram habar yuborish (sms_marketing moduli faol bo'lsa)
    if (subscriptionStore.checkFeature(FEATURE_KEYS.SMS_MARKETING)) {
    try {
      const discountPercent = currentVisit.value.discount_percent || 0

      const totalBeforeDiscount = discountPercent > 0
        ? Math.round(totalPrice / (1 - discountPercent / 100))
        : totalPrice

      const visitDate = currentVisit.value.date
        ? new Date(currentVisit.value.date).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

      const services = visitServices.value.map(vs => ({
        name: vs.service_name || 'Xizmat',
        price: Number(vs.price) || 0,
        tooth: vs.tooth_id || null
      }))

      await clinicalService.notifyVisitCompleted({
        patientId: String(props.patient.id),
        doctorName: currentVisit.value.doctor_name || 'Shifokor',
        doctorPhone: currentVisit.value.doctor_phone || null,
        visitDate,
        services,
        discount: discountPercent,
        totalBeforeDiscount,
        totalAfterDiscount: totalPrice,
        paid: Number(paidAmount) || 0,
        remaining: Number(debtAmount) || 0
      })

      const followUpResult = await clinicalService.scheduleVisitFollowUps({
        patientId: String(props.patient.id),
        patientName: props.patient?.full_name || props.patient?.name || null,
        phone: props.patient?.phone || null,
        notes: 'Visit completed from odontogram'
      })

      if (!followUpResult.ok) {
        console.warn('⚠️ Follow-up xabarlar rejalashtirilmadi:', followUpResult.error)
      } else {
        console.log(`✅ Follow-up xabarlar rejalashtirildi: ${followUpResult.scheduledCount || 0}`)
      }

      console.log('✅ Telegram habar yuborildi')
    } catch (telegramError) {
      console.warn('⚠️ Telegram habar yuborilmadi (asosiy jarayon davom etadi):', telegramError)
    }
    }
  } catch (error) {
    console.error('Failed to complete visit:', error)
    toast.error(t('odontogram.errorCompleteVisit'))
  } finally {
    loading.value = false
  }
}

const requestCompleteVisit = () => {
  const due = totalBill.value
  confirmation.value = {
    title: t('odontogram.completeVisit'),
    message: due > 0
      ? t('odontogram.confirmCompleteWithAmount', { amount: formatCurrency(due) })
      : t('odontogram.confirmCompleteVisit'),
    choices: due > 0
      ? [
          {
            id: 'paid',
            tone: 'paid',
            label: t('odontogram.completeAsPaid'),
            action: () => completeCurrentVisit('paid'),
          },
          {
            id: 'debt',
            tone: 'debt',
            label: t('odontogram.completeAsDebt'),
            action: () => completeCurrentVisit('debt'),
          },
        ]
      : null,
    action: () => completeCurrentVisit('paid'),
  }
}

const openStatusMenu = ({ id, rect }) => {
  if (!canEdit.value) return
  selectedToothId.value = id
  menuOpen.value = true
  ignoreClose.value = true
  const panelWidth = 320
  const margin = 12
  const left = Math.max(
    margin + panelWidth / 2,
    Math.min(window.innerWidth - margin - panelWidth / 2, rect.left + rect.width / 2),
  )
  const estimatedHeight = 420
  const openAbove = rect.bottom + estimatedHeight > window.innerHeight - margin
  menuStyle.value = {
    left: `${left}px`,
    top: openAbove ? `${Math.max(margin, rect.top - 8)}px` : `${rect.bottom + 8}px`,
    transform: openAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
  }
  setTimeout(() => {
    ignoreClose.value = false
  }, 0)
}

const closeStatusMenu = () => {
  menuOpen.value = false
}

const setToothStatus = (status, serviceId = null, toothId = selectedToothId.value) => {
  if (!toothId) return
  const tid = toothId
  teeth.value = teeth.value.map((t) =>
    t.id === tid ? { ...t, status, service_id: serviceId } : t
  )

  if (currentOdontogram.value) {
    if (!currentOdontogram.value.data.teeth) {
      currentOdontogram.value.data.teeth = {}
    }
    const key = String(tid)
    const teethData = currentOdontogram.value.data.teeth

    if (status === 'healthy') {
      if (teethData[key] !== undefined) delete teethData[key]
      if (teethData[tid] !== undefined) delete teethData[tid]
    } else {
      const existing = teethData[key] || teethData[tid] || { note: '' }
      const update = { ...existing, state: toStorageToothState(status) }
      if (serviceId != null) update.service_id = serviceId
      else if ('service_id' in update) delete update.service_id
      teethData[key] = update
    }

    saveQueue.schedule(currentOdontogram.value.data)
  }

  closeStatusMenu()
}

const applyMenuSelection = async (option) => {
  if (!selectedToothId.value || applyingToothSelection.value) return
  const toothId = selectedToothId.value
  applyingToothSelection.value = true

  try {
    if (option.type === 'status' || option.status) {
      const status = option.status || option.value
      if ((status === 'healthy' || status === 'missing') && currentVisit.value?.id) {
        visitServices.value = await clinicalService.clearToothService(currentVisit.value.id, toothId, authStore)
      }
      setToothStatus(status)
      return
    }

    if (option.type === 'service') {
      if (!currentVisit.value?.id) {
        toast.error(t('odontogram.selectVisitFirst'))
        return
      }

      const result = await clinicalService.replaceToothService({
        visitId: currentVisit.value.id,
        patientId: props.patient.id,
        doctorId: props.doctorId,
        toothId,
        serviceId: option.value,
        serviceName: option.labelKey ? t(option.labelKey) : option.label,
        price: option.price || 0,
        performedBy: authStore.user?.full_name || props.doctorName || 'Doctor',
        authStore,
        inventoryItems: inventoryItems.value,
      })
      visitServices.value = result.services
      setToothStatus(option.inferredStatus || 'filling', option.value, toothId)
      toast.success(t('odontogram.toastServiceApplied', {
        tooth: toothId,
        service: option.labelKey ? t(option.labelKey) : option.label,
      }))
      if (result.consumed.length) await loadConsumptions()
    }
  } catch (error) {
    console.error('Failed to apply tooth selection:', error)
    toast.error(t('odontogram.errorSaveService'))
  } finally {
    applyingToothSelection.value = false
  }

  closeStatusMenu()
}

const saveOdontogram = async () => {
  if (!currentOdontogram.value) return
  try {
    saveQueue.schedule(currentOdontogram.value.data)
    await saveQueue.flush()
  } catch (error) {
    console.error('Failed to save odontogram:', error)
    toast.error(t('odontogram.errorSaveOdontogram'))
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
  preloadToothSvgs()
  await loadVisits()
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  saveQueue.stop({ flushPending: true })
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleEscape)
})

// Watch for patient change
watch(() => props.patient.id, async () => {
  selectedVisitId.value = ''
  currentVisit.value = null
  currentOdontogram.value = null
  syncTeethFromOdontogram()
  visitServices.value = []
  loadVisits()
})
</script>
