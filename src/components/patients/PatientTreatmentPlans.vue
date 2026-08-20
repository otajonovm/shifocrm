<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ t('treatmentPlans.title') }}</h3>
        <p class="text-sm text-gray-500">{{ t('treatmentPlans.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="generateAiDraft"
          :disabled="draftLoading"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <SparklesIcon class="h-4 w-4" />
          {{ draftLoading ? t('treatmentPlans.aiDraftLoading') : t('treatmentPlans.aiDraft') }}
        </button>
        <button
          @click="showForm = !showForm"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <PlusIcon class="h-4 w-4" />
          {{ t('treatmentPlans.newPlan') }}
        </button>
      </div>
    </div>

    <div v-if="showForm" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.status') }}</label>
          <select
            v-model="form.status"
            class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.priority') }}</label>
          <select
            v-model="form.priority"
            class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="low">{{ t('treatmentPlans.priorityLow') }}</option>
            <option value="medium">{{ t('treatmentPlans.priorityMedium') }}</option>
            <option value="high">{{ t('treatmentPlans.priorityHigh') }}</option>
          </select>
        </div>
        <div class="sm:col-span-3">
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.notes') }}</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            :placeholder="t('treatmentPlans.notesPlaceholder')"
          ></textarea>
        </div>
      </div>

      <div class="mt-5 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-900">{{ t('treatmentPlans.stages') }}</h4>
          <button
            type="button"
            @click="addStage"
            class="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {{ t('treatmentPlans.addStage') }}
          </button>
        </div>

        <div v-for="(stage, stageIdx) in form.stages" :key="stage.key" class="space-y-4 rounded-xl border border-gray-200 p-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.stageName') }} *</label>
              <input
                v-model="stage.stage_name"
                type="text"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                :placeholder="t('treatmentPlans.stageNamePlaceholder')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.planDate') }} *</label>
              <input
                v-model="stage.planned_date"
                type="date"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.notes') }}</label>
              <textarea
                v-model="stage.notes"
                rows="2"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                :placeholder="t('treatmentPlans.notesPlaceholder')"
              ></textarea>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('treatmentPlans.services') }}</p>
              <button
                type="button"
                @click="addItem(stageIdx)"
                class="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {{ t('treatmentPlans.addService') }}
              </button>
            </div>

            <div v-for="(item, itemIdx) in stage.items" :key="item.key" class="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlans.service') }} *</label>
                <select
                  v-model="item.service_id"
                  @change="handleServiceChange(stageIdx, itemIdx)"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">{{ t('treatmentPlans.selectService') }}</option>
                  <option v-for="service in services" :key="service.id" :value="service.id">
                    {{ service.name || service.title || service.service_name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlans.estimatedCost') }}</label>
                <input
                  v-model.number="item.estimated_cost"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlans.tooth') }}</label>
                <input
                  v-model.number="item.tooth_id"
                  type="number"
                  min="11"
                  max="48"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  :placeholder="t('treatmentPlans.toothPlaceholder')"
                />
              </div>
              <div class="flex items-end sm:col-span-1">
                <button
                  type="button"
                  @click="removeItem(stageIdx, itemIdx)"
                  class="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
                >
                  {{ t('treatmentPlans.remove') }}
                </button>
              </div>
              <div class="sm:col-span-5">
                <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlans.notes') }}</label>
                <textarea
                  v-model="item.notes"
                  rows="2"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="formError" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
        {{ formError }}
      </div>
      <div class="mt-4 flex items-center justify-end gap-3">
        <button
          @click="resetForm"
          class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {{ t('treatmentPlans.cancel') }}
        </button>
        <button
          @click="savePlan"
          class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {{ t('treatmentPlans.save') }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3">{{ t('treatmentPlans.plan') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.date') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.status') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.priority') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.tooth') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.price') }}</th>
            <th class="px-4 py-3 text-right">{{ t('treatmentPlans.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-sm text-gray-500" colspan="7">{{ t('treatmentPlans.loading') }}</td>
          </tr>
          <tr v-else-if="plans.length === 0">
            <td class="px-4 py-4 text-sm text-gray-500" colspan="7">{{ t('treatmentPlans.noPlans') }}</td>
          </tr>
          <tr
            v-for="plan in plans"
            :key="plan.id"
            class="bg-white transition-colors hover:bg-gray-50"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-gray-900">{{ plan.title }}</div>
              <div class="text-sm text-gray-500">{{ plan.stage_summary || '-' }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(plan.first_stage_date || plan.planned_date) }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(plan.status)" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                {{ statusLabel(plan.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ priorityLabel(plan.priority) }}</td>
            <td class="px-4 py-3 text-gray-700">{{ plan.first_tooth_id ? `#${plan.first_tooth_id}` : '-' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ formatCurrency(plan.total_estimated_cost) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="!plan.visit_id"
                  @click="convertToVisit(plan)"
                  class="rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {{ t('treatmentPlans.toVisit') }}
                </button>
                <select
                  :value="plan.status"
                  @change="setStatus(plan, $event.target.value)"
                  class="rounded-xl border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  :disabled="sendingReminderId === plan.id"
                  @click="sendReminder(plan)"
                >
                  {{ sendingReminderId === plan.id ? t('treatmentPlans.sendingReminder') : t('treatmentPlans.remind') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-50">
          <tr>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900" colspan="5">
              {{ t('treatmentPlans.totalEstimatedCost') }}
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900">
              {{ formatCurrency(totalEstimatedCostAll) }}
            </td>
            <td class="px-4 py-3" colspan="1"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="grid gap-4 md:grid-cols-5">
      <div v-for="column in kanbanColumns" :key="column.status" class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-4 py-3">
          <h4 class="text-sm font-semibold text-gray-900">{{ column.label }}</h4>
          <p class="text-sm text-gray-500">{{ column.items.length }} ta</p>
        </div>
        <div class="space-y-2 p-3">
          <div v-for="plan in column.items" :key="plan.id" class="rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
            <div class="text-sm font-semibold text-gray-900">{{ plan.title }}</div>
            <div class="text-sm text-gray-500">{{ formatDate(plan.first_stage_date || plan.planned_date) }}</div>
            <div class="mt-1 text-sm text-gray-500">{{ formatCurrency(plan.total_estimated_cost) }} so'm</div>
          </div>
          <div v-if="column.items.length === 0" class="text-sm text-gray-500">—</div>
        </div>
      </div>
    </div>

    <div
      v-if="showDraftModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="showDraftModal = false"
    >
      <div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h4 class="text-lg font-semibold text-gray-900">{{ t('treatmentPlans.aiDraftTitle') }}</h4>
        <p class="mt-1 text-sm text-gray-500">{{ draftResult?.disclaimer || t('treatmentPlans.aiDraftDisclaimer') }}</p>
        <pre class="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">{{ draftResult?.draft }}</pre>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            @click="showDraftModal = false"
          >
            {{ t('treatmentPlans.aiDraftClose') }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            @click="applyDraft"
          >
            {{ t('treatmentPlans.aiDraftApply') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { listServices } from '@/api/servicesApi'
import { getOdontogramsByPatientId } from '@/api/odontogramApi'
import { generateTreatmentPlanDraft, summarizeOdontogramForDraft } from '@/api/treatmentPlanDraftApi'
import {
  getPlansByPatientId,
  createPlan,
  updatePlan,
  updatePlanStatus,
  listStagesByPlanId,
  listItemsByStageId,
  createStage,
  createItem
} from '@/api/treatmentPlansApi'
import { createVisit } from '@/api/visitsApi'
import { sendOrQueueTreatmentPlanReminder } from '@/services/treatmentPlanReminderService'
import { useRoute } from 'vue-router'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  },
  patientName: {
    type: String,
    default: ''
  },
  patientPhone: {
    type: String,
    default: ''
  }
})

const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const route = useRoute()

const plans = ref([])
const loading = ref(false)
const showForm = ref(false)
const formError = ref('')
const services = ref([])
const selectedToothId = ref(null)
const draftLoading = ref(false)
const showDraftModal = ref(false)
const draftResult = ref(null)
const sendingReminderId = ref(null)

const statusOptions = [
  { value: 'offered', label: t('treatmentPlans.statusOffered') },
  { value: 'scheduled', label: t('treatmentPlans.statusScheduled') },
  { value: 'in_progress', label: t('treatmentPlans.statusInProgress') },
  { value: 'done', label: t('treatmentPlans.statusDone') },
  { value: 'cancelled', label: t('treatmentPlans.statusCancelled') }
]

const form = ref({
  status: 'offered',
  priority: 'medium',
  notes: '',
  stages: []
})

const doctorId = computed(() => authStore.user?.id || null)

const createEmptyItem = () => {
  return {
    key: `item-${Math.random().toString(36).slice(2, 9)}`,
    service_id: '',
    service_name: '',
    estimated_cost: null,
    tooth_id: selectedToothId.value || null,
    notes: ''
  }
}

const createEmptyStage = () => {
  return {
    key: `stage-${Math.random().toString(36).slice(2, 9)}`,
    stage_name: '',
    planned_date: '',
    notes: '',
    items: [createEmptyItem()]
  }
}

const resetForm = () => {
  form.value = {
    status: 'offered',
    priority: 'medium',
    notes: '',
    stages: [createEmptyStage()]
  }
  formError.value = ''
  showForm.value = false
}

const generateAiDraft = async () => {
  draftLoading.value = true
  try {
    const odontograms = await getOdontogramsByPatientId(props.patientId).catch(() => [])
    const latest = Array.isArray(odontograms) ? odontograms[0] : null
    const toothSummary = latest?.data
      ? summarizeOdontogramForDraft(latest.data)
      : ''

    draftResult.value = await generateTreatmentPlanDraft({
      patientName: props.patientName || 'Bemor',
      toothSummary,
    })
    if (draftResult.value?.error === 'feature_locked') {
      toast.error(draftResult.value.disclaimer || t('subscription.upgradeTitle'))
      return
    }
    showDraftModal.value = true
    showForm.value = true
  } catch (err) {
    toast.error(err?.message || t('treatmentPlans.errorLoad'))
  } finally {
    draftLoading.value = false
  }
}

const applyDraft = () => {
  form.value.notes = draftResult.value?.draft || ''
  showDraftModal.value = false
}

const addStage = () => {
  form.value.stages.push(createEmptyStage())
}

const addItem = (stageIdx) => {
  form.value.stages[stageIdx].items.push(createEmptyItem())
}

const removeItem = (stageIdx, itemIdx) => {
  const stage = form.value.stages[stageIdx]
  stage.items.splice(itemIdx, 1)
  if (stage.items.length === 0) {
    stage.items.push(createEmptyItem())
  }
}

const handleServiceChange = (stageIdx, itemIdx) => {
  const stage = form.value.stages[stageIdx]
  const item = stage.items[itemIdx]
  const service = services.value.find(entry => String(entry.id) === String(item.service_id))
  if (!service) return
  item.service_name = service.name || service.title || service.service_name || ''
  const basePrice = Number(service.base_price)
  item.estimated_cost = Number.isFinite(basePrice) ? basePrice : item.estimated_cost
}

const loadPlans = async () => {
  loading.value = true
  try {
    const basePlans = await getPlansByPatientId(props.patientId)
    const enriched = await Promise.all(
      basePlans.map(async (plan) => {
        const stages = await listStagesByPlanId(plan.id)
        const stageWithItems = await Promise.all(
          stages.map(async (stage) => {
            const items = await listItemsByStageId(stage.id)
            return { ...stage, items }
          })
        )

        const total = stageWithItems.reduce((sum, stage) => {
          return sum + stage.items.reduce((acc, item) => acc + (Number(item.estimated_cost) || 0), 0)
        }, 0)
        const firstStageDate = stageWithItems.find(item => item.planned_date)?.planned_date || null
        const firstTooth = stageWithItems.flatMap(s => s.items).find(item => item.tooth_id)?.tooth_id || null
        const stageSummary = stageWithItems.map(item => item.stage_name).filter(Boolean).join(', ')

        return {
          ...plan,
          stages: stageWithItems,
          total_estimated_cost: total,
          first_stage_date: firstStageDate,
          first_tooth_id: firstTooth,
          stage_summary: stageSummary
        }
      })
    )
    plans.value = enriched
  } catch (error) {
    console.error('Failed to load treatment plans:', error)
    plans.value = []
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  try {
    services.value = await listServices('order=name.asc')
  } catch (error) {
    console.error('Failed to load services:', error)
    services.value = []
  }
}

const savePlan = async () => {
  formError.value = ''
  const stages = form.value.stages
  if (!stages.length) {
    formError.value = t('treatmentPlans.errorStageRequired')
    return
  }
  for (const stage of stages) {
    if (!stage.stage_name || !stage.planned_date) {
      formError.value = t('treatmentPlans.errorStageRequired')
      return
    }
    if (!stage.items.length) {
      formError.value = t('treatmentPlans.errorServiceRequired')
      return
    }
    if (stage.items.some(item => !item.service_id)) {
      formError.value = t('treatmentPlans.errorServiceRequired')
      return
    }
  }

  try {
    const firstItem = stages[0]?.items?.[0]
    const title = firstItem?.service_name || t('treatmentPlans.defaultTitle')
    const totalCost = stages.reduce((sum, stage) => {
      return sum + stage.items.reduce((acc, item) => acc + (Number(item.estimated_cost) || 0), 0)
    }, 0)
    const payload = {
      patient_id: props.patientId,
      doctor_id: doctorId.value,
      title,
      planned_date: stages[0].planned_date,
      status: form.value.status,
      priority: form.value.priority,
      notes: form.value.notes,
      estimated_cost: totalCost,
    }
    const created = await createPlan(payload)

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      const createdStage = await createStage({
        plan_id: created.id,
        stage_name: stage.stage_name,
        planned_date: stage.planned_date,
        sort_order: i + 1,
        notes: stage.notes
      })

      for (const item of stage.items) {
        await createItem({
          stage_id: createdStage.id,
          service_id: item.service_id,
          service_name: item.service_name,
          tooth_id: item.tooth_id,
          estimated_cost: item.estimated_cost,
          notes: item.notes
        })
      }
    }

    await loadPlans()
    resetForm()
    toast.success(t('treatmentPlans.toastSaved'))
  } catch (error) {
    console.error('Failed to save treatment plan:', error)
    formError.value = 'Saqlashda xatolik yuz berdi.'
  }
}

const sendReminder = async (plan) => {
  if (sendingReminderId.value) return
  sendingReminderId.value = plan.id
  try {
    const result = await sendOrQueueTreatmentPlanReminder(plan, {
      phone: props.patientPhone,
    })
    if (!result.ok) {
      if (result.error === 'PHONE_REQUIRED') {
        toast.error(t('treatmentPlans.errorReminderPhone'))
      } else {
        toast.error(result.message || t('treatmentPlans.errorReminder'))
      }
      return
    }
    if (result.plan) {
      const idx = plans.value.findIndex(item => item.id === plan.id)
      if (idx !== -1) {
        plans.value[idx] = { ...plans.value[idx], ...result.plan }
      }
    }
    toast.success(t('treatmentPlans.toastReminderSmsSent', { phone: result.phone || props.patientPhone }))
  } catch (error) {
    console.error('Failed to send reminder:', error)
    toast.error(t('treatmentPlans.errorReminder'))
  } finally {
    sendingReminderId.value = null
  }
}

const setStatus = async (plan, status) => {
  try {
    const updated = await updatePlanStatus(plan.id, status)
    const idx = plans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      plans.value[idx] = { ...plans.value[idx], ...updated }
    }
    toast.success(t('treatmentPlans.toastStatusUpdated'))
  } catch (error) {
    console.error('Failed to update plan status:', error)
  }
}

const convertToVisit = async (plan) => {
  try {
    if (plan.visit_id) {
      toast.info(t('treatmentPlans.toastVisitExists'))
      return
    }
    const visit = await createVisit({
      patient_id: props.patientId,
      doctor_id: plan.doctor_id || doctorId.value,
      doctor_name: null,
      status: 'pending',
      price: plan.total_estimated_cost || plan.estimated_cost,
      service_name: plan.title,
      notes: plan.notes || 'Davolash rejasidan yaratildi',
      date: plan.first_stage_date || plan.planned_date,
      updated_by: doctorId.value ? `doctor:${doctorId.value}` : 'doctor'
    })

    const updated = await updatePlan(plan.id, { visit_id: visit.id })
    const idx = plans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      plans.value[idx] = { ...plans.value[idx], ...updated }
    }
    toast.success(t('treatmentPlans.toastVisitCreated'))
  } catch (error) {
    console.error('Failed to convert plan to visit:', error)
    toast.error(t('treatmentPlans.errorVisitCreate'))
  }
}

const statusLabel = (status) => {
  const option = statusOptions.find(item => item.value === status)
  return option ? option.label : status
}

const statusClass = (status) => {
  if (status === 'done') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
  if (status === 'in_progress') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
  if (status === 'scheduled') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10'
  return 'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10'
}

const priorityLabel = (priority) => {
  if (priority === 'high') return t('treatmentPlans.priorityHigh')
  if (priority === 'low') return t('treatmentPlans.priorityLow')
  return t('treatmentPlans.priorityMedium')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0'
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const totalEstimatedCostAll = computed(() => {
  return plans.value.reduce((sum, plan) => sum + (Number(plan.total_estimated_cost) || 0), 0)
})

const kanbanColumns = computed(() => {
  return statusOptions.map(option => ({
    status: option.value,
    label: option.label,
    items: plans.value.filter(plan => plan.status === option.value)
  }))
})

watch(() => route.query.tooth, (value) => {
  const tooth = Number(value)
  selectedToothId.value = Number.isFinite(tooth) ? tooth : null
  if (!selectedToothId.value) return
  form.value.stages.forEach(stage => {
    stage.items.forEach(item => {
      if (!item.tooth_id) {
        item.tooth_id = selectedToothId.value
      }
    })
  })
})

onMounted(() => {
  resetForm()
  loadPlans()
  loadServices()
})
watch(() => props.patientId, loadPlans)
</script>
