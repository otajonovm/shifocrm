<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ t('treatmentPlans.title') }}</h3>
        <p class="text-sm text-gray-500">{{ t('treatmentPlans.subtitle') }}</p>
      </div>
      <button
        @click="showForm = !showForm"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        <PlusIcon class="w-4 h-4" />
        {{ t('treatmentPlans.newPlan') }}
      </button>
    </div>

    <div v-if="showForm" class="bg-white rounded-xl border border-gray-100 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.planTitle') }} *</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('treatmentPlans.planTitlePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.planDate') }} *</label>
          <input
            v-model="form.planned_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.status') }}</label>
          <select
            v-model="form.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.priority') }}</label>
          <select
            v-model="form.priority"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="low">{{ t('treatmentPlans.priorityLow') }}</option>
            <option value="medium">{{ t('treatmentPlans.priorityMedium') }}</option>
            <option value="high">{{ t('treatmentPlans.priorityHigh') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.tooth') }}</label>
          <input
            v-model.number="form.tooth_id"
            type="number"
            min="11"
            max="48"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('treatmentPlans.toothPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.estimatedCost') }}</label>
          <input
            v-model.number="form.estimated_cost"
            type="number"
            min="0"
            step="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('treatmentPlans.estimatedCostPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.remindAt') }}</label>
          <input
            v-model="form.remind_at"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.notes') }}</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            :placeholder="t('treatmentPlans.notesPlaceholder')"
          ></textarea>
        </div>
      </div>
      <div v-if="formError" class="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
        {{ formError }}
      </div>
      <div class="mt-4 flex items-center justify-end gap-3">
        <button
          @click="resetForm"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {{ t('treatmentPlans.cancel') }}
        </button>
        <button
          @click="savePlan"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          {{ t('treatmentPlans.save') }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('treatmentPlans.plan') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.date') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.status') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.priority') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.tooth') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.price') }}</th>
            <th class="px-4 py-3">{{ t('treatmentPlans.remindAtShort') }}</th>
            <th class="px-4 py-3 text-right">{{ t('treatmentPlans.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-500" colspan="8">{{ t('treatmentPlans.loading') }}</td>
          </tr>
          <tr v-else-if="plans.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="8">{{ t('treatmentPlans.noPlans') }}</td>
          </tr>
          <tr v-for="plan in plans" :key="plan.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">
              <div class="font-medium text-slate-900">{{ plan.title }}</div>
              <div class="text-xs text-slate-400">{{ plan.notes || '-' }}</div>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ formatDate(plan.planned_date) }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(plan.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                {{ statusLabel(plan.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ priorityLabel(plan.priority) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ plan.tooth_id ? `#${plan.tooth_id}` : '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatCurrency(plan.estimated_cost) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ plan.remind_at ? formatDateTime(plan.remind_at) : '-' }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="!plan.visit_id"
                  @click="convertToVisit(plan)"
                  class="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded"
                >
                  {{ t('treatmentPlans.toVisit') }}
                </button>
                <button
                  v-if="plan.status !== 'done'"
                  @click="setStatus(plan, 'done')"
                  class="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded"
                >
                  {{ t('treatmentPlans.markDone') }}
                </button>
                <button
                  v-if="plan.status !== 'postponed'"
                  @click="setStatus(plan, 'postponed')"
                  class="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded"
                >
                  {{ t('treatmentPlans.postpone') }}
                </button>
                <button
                  v-if="plan.status !== 'cancelled'"
                  @click="setStatus(plan, 'cancelled')"
                  class="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded"
                >
                  {{ t('treatmentPlans.cancel') }}
                </button>
                <button
                  @click="sendReminder(plan)"
                  class="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded"
                >
                  {{ t('treatmentPlans.remind') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { getPlansByPatientId, createPlan, updatePlan, updatePlanStatus } from '@/api/treatmentPlansApi'
import { createVisit } from '@/api/visitsApi'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const plans = ref([])
const loading = ref(false)
const showForm = ref(false)
const formError = ref('')

const statusOptions = [
  { value: 'planned', label: t('treatmentPlans.statusPlanned') },
  { value: 'done', label: t('treatmentPlans.statusDone') },
  { value: 'postponed', label: t('treatmentPlans.statusPostponed') },
  { value: 'cancelled', label: t('treatmentPlans.statusCancelled') }
]

const form = ref({
  title: '',
  planned_date: '',
  status: 'planned',
  priority: 'medium',
  tooth_id: null,
  estimated_cost: null,
  notes: '',
  remind_at: ''
})

const doctorId = computed(() => authStore.user?.id || null)

const resetForm = () => {
  form.value = {
    title: '',
    planned_date: '',
    status: 'planned',
    priority: 'medium',
    tooth_id: null,
    estimated_cost: null,
    notes: '',
    remind_at: ''
  }
  formError.value = ''
  showForm.value = false
}

const loadPlans = async () => {
  loading.value = true
  try {
    plans.value = await getPlansByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load treatment plans:', error)
    plans.value = []
  } finally {
    loading.value = false
  }
}

const savePlan = async () => {
  formError.value = ''
  if (!form.value.title || !form.value.planned_date) {
    formError.value = t('treatmentPlans.errorTitleDate')
    return
  }

  try {
    const payload = {
      patient_id: props.patientId,
      doctor_id: doctorId.value,
      title: form.value.title,
      planned_date: form.value.planned_date,
      status: form.value.status,
      priority: form.value.priority,
      tooth_id: form.value.tooth_id,
      estimated_cost: form.value.estimated_cost,
      notes: form.value.notes,
      remind_at: form.value.remind_at || null
    }
    const created = await createPlan(payload)
    plans.value.unshift(created)
    resetForm()
    toast.success(t('treatmentPlans.toastSaved'))
  } catch (error) {
    console.error('Failed to save treatment plan:', error)
    formError.value = 'Saqlashda xatolik yuz berdi.'
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
      price: plan.estimated_cost,
      service_name: plan.title,
      notes: plan.notes || 'Davolash rejasidan yaratildi',
      date: plan.planned_date,
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

const sendReminder = async (plan) => {
  try {
    const now = new Date().toISOString()
    const updated = await updatePlan(plan.id, { remind_at: now })
    const idx = plans.value.findIndex(item => item.id === plan.id)
    if (idx !== -1) {
      plans.value[idx] = { ...plans.value[idx], ...updated }
    }
    toast.success(t('treatmentPlans.toastReminderSent'))
  } catch (error) {
    console.error('Failed to set reminder:', error)
    toast.error(t('treatmentPlans.errorReminder'))
  }
}

const statusLabel = (status) => {
  const option = statusOptions.find(item => item.value === status)
  return option ? option.label : status
}

const statusClass = (status) => {
  if (status === 'done') return 'bg-emerald-100 text-emerald-700'
  if (status === 'postponed') return 'bg-amber-100 text-amber-700'
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-blue-100 text-blue-700'
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0'
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

onMounted(loadPlans)
watch(() => props.patientId, loadPlans)
</script>
