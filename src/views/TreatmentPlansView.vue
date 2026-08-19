<template>
  <MainLayout>
    <div class="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0">
      <!-- Desktop sarlavha -->
      <div class="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('treatmentPlansView.title') }}</h1>
          <p class="text-gray-500">{{ t('treatmentPlansView.subtitle') }}</p>
        </div>
        <button
          v-if="canCreatePlans"
          @click="showForm = !showForm"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('treatmentPlansView.newPlan') }}
        </button>
      </div>

      <!-- Mobil: tushunarli hero + qidiruv -->
      <section class="md:hidden overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-4 text-white shadow-lg">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{{ t('treatmentPlansView.subtitle') }}</p>
        <div class="mt-1 flex items-end justify-between gap-3">
          <h1 class="text-2xl font-black leading-tight">{{ t('treatmentPlansView.title') }}</h1>
          <span class="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {{ t('treatmentPlansView.plansCount', { count: filteredPlans.length }) }}
          </span>
        </div>
        <label class="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20">
          <MagnifyingGlassIcon class="h-5 w-5 flex-shrink-0 text-white/80" />
          <input
            v-model="searchQuery"
            type="search"
            class="w-full bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            :placeholder="t('treatmentPlansView.searchPlaceholder')"
          />
        </label>
      </section>

      <!-- Mobil: status chiplari -->
      <div class="md:hidden -mx-4 px-4">
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            class="flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors"
            :class="selectedStatus === ''
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'"
            @click="selectedStatus = ''"
          >
            {{ t('treatmentPlansView.allChip') }}
          </button>
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors"
            :class="selectedStatus === option.value
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white text-slate-600 ring-1 ring-slate-200'"
            @click="selectedStatus = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Mobil: qo'shimcha filtrlar -->
      <div class="md:hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left"
          @click="showMobileFilters = !showMobileFilters"
        >
          <span class="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FunnelIcon class="h-4 w-4 text-violet-600" />
            {{ t('treatmentPlansView.filters') }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span v-if="extraFilterCount" class="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
              {{ extraFilterCount }}
            </span>
            <ChevronDownIcon
              class="h-4 w-4 text-slate-400 transition-transform"
              :class="showMobileFilters ? 'rotate-180' : ''"
            />
          </span>
        </button>

        <div v-if="showMobileFilters" class="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">{{ t('treatmentPlansView.patient') }}</label>
            <select
              v-model="selectedPatient"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">{{ t('treatmentPlansView.allPatients') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500">{{ t('treatmentPlansView.dateFrom') }}</label>
              <input
                v-model="startDate"
                type="date"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500">{{ t('treatmentPlansView.dateTo') }}</label>
              <input
                v-model="endDate"
                type="date"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop filtrlar -->
      <div class="hidden md:block bg-white rounded-2xl shadow-card border border-gray-100 p-4">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlansView.search') }}</label>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :placeholder="t('treatmentPlansView.searchPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlansView.patient') }}</label>
            <select
              v-model="selectedPatient"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{{ t('treatmentPlansView.allPatients') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlans.status') }}</label>
            <select
              v-model="selectedStatus"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{{ t('treatmentPlansView.allStatuses') }}</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlansView.dateRange') }}</label>
            <div class="flex gap-2">
              <input
                v-model="startDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                v-model="endDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('treatmentPlansView.patient') }} *</label>
            <select
              v-model="form.patient_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{{ t('treatmentPlansView.selectPatient') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
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

      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">{{ t('treatmentPlans.plan') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlansView.patient') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlans.date') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlans.status') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlans.priority') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlans.tooth') }}</th>
              <th class="px-4 py-3">{{ t('treatmentPlans.price') }}</th>
              <th class="px-4 py-3 text-right">{{ t('treatmentPlans.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td class="px-4 py-4 text-slate-500" colspan="8">{{ t('treatmentPlans.loading') }}</td>
            </tr>
            <tr v-else-if="filteredPlans.length === 0">
              <td class="px-4 py-4 text-slate-500" colspan="8">{{ t('treatmentPlans.noPlans') }}</td>
            </tr>
            <tr v-for="plan in filteredPlans" :key="plan.id" class="bg-white">
              <td class="px-4 py-3 text-slate-700">
                <div class="font-medium text-slate-900">{{ plan.title }}</div>
                <div class="text-xs text-slate-400">{{ plan.notes || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-slate-700">
                <div>{{ plan.patientName || '-' }}</div>
                <div v-if="plan.patientPhone" class="text-xs text-slate-400">{{ plan.patientPhone }}</div>
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
              <td class="px-4 py-3 text-right">
                <div v-if="canEditPlans" class="flex items-center justify-end gap-2">
                  <select
                    :value="plan.status"
                    class="max-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @change="onStatusChange(plan, $event)"
                  >
                    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <button
                    v-if="!plan.visit_id"
                    type="button"
                    class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    @click="convertToVisit(plan)"
                  >
                    {{ t('treatmentPlans.toVisit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    :disabled="sendingReminderId === plan.id"
                    @click="sendReminder(plan)"
                  >
                    {{ sendingReminderId === plan.id ? t('treatmentPlans.sendingReminder') : t('treatmentPlans.sendReminder') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden space-y-3">
        <div v-if="loading" class="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
          {{ t('treatmentPlans.loading') }}
        </div>
        <div v-else-if="filteredPlans.length === 0" class="rounded-2xl bg-white px-5 py-10 text-center shadow-sm">
          <p class="text-base font-semibold text-slate-800">{{ t('treatmentPlans.noPlans') }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ t('treatmentPlansView.noPlansHint') }}</p>
        </div>
        <article
          v-for="plan in filteredPlans"
          v-else
          :key="plan.id"
          class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
        >
          <div class="flex">
            <div class="w-1.5 flex-shrink-0" :class="statusBarClass(plan.status)" />
            <div class="min-w-0 flex-1 p-3.5">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
                  <span class="text-[10px] font-semibold uppercase text-slate-400">{{ formatDateMonth(plan.planned_date) }}</span>
                  <span class="text-lg font-black leading-none text-slate-800">{{ formatDateDay(plan.planned_date) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="truncate text-base font-bold text-slate-900">{{ plan.title }}</h3>
                    <span :class="statusClass(plan.status)" class="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                      {{ statusLabel(plan.status) }}
                    </span>
                  </div>
                  <p class="mt-1 truncate text-sm text-slate-600">{{ plan.patientName || '-' }}</p>
                  <p v-if="plan.patientPhone" class="truncate text-xs text-slate-400">{{ plan.patientPhone }}</p>
                  <div class="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                    <span v-if="plan.tooth_id" class="rounded-full bg-slate-100 px-2 py-0.5">#{{ plan.tooth_id }}</span>
                    <span class="rounded-full bg-slate-100 px-2 py-0.5">{{ priorityLabel(plan.priority) }}</span>
                    <span v-if="plan.estimated_cost" class="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      {{ formatCurrency(plan.estimated_cost) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="canEditPlans" class="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <select
                  :value="plan.status"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  @change="onStatusChange(plan, $event)"
                >
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-if="!plan.visit_id"
                    type="button"
                    class="rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700"
                    @click="convertToVisit(plan)"
                  >
                    {{ t('treatmentPlans.toVisit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    :disabled="sendingReminderId === plan.id"
                    @click="sendReminder(plan)"
                  >
                    {{ sendingReminderId === plan.id ? t('treatmentPlans.sendingReminder') : t('treatmentPlans.remind') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Mobile FAB -->
    <MobileFAB
      v-if="canCreatePlans"
      :icon="PlusIcon"
      :label="t('treatmentPlansView.newPlan')"
      @click="showForm = !showForm"
      class="md:hidden"
    />
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import MobileFAB from '@/components/shared/MobileFAB.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import { usePermission } from '@/composables/usePermission'
import { isSolo } from '@/lib/roles'
import { getPlansByDoctorAndDateRange, getPlansByDateRange, createPlan, updatePlan, updatePlanStatus } from '@/api/treatmentPlansApi'
import { createVisit } from '@/api/visitsApi'
import { sendOrQueueTreatmentPlanReminder } from '@/services/treatmentPlanReminderService'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const toast = useToast()
const { t, locale } = useI18n()
const { can } = usePermission()
const canCreatePlans = computed(() => can('treatment_plans', 'create'))
const canEditPlans = computed(() => can('treatment_plans', 'edit'))

const plans = ref([])
const loading = ref(false)
const showForm = ref(false)
const formError = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedPatient = ref('')
const startDate = ref('')
const endDate = ref('')
const showMobileFilters = ref(false)
const sendingReminderId = ref(null)

const extraFilterCount = computed(() => Number(Boolean(selectedPatient.value)))

const statusOptions = [
  { value: 'offered', label: t('treatmentPlans.statusOffered') },
  { value: 'scheduled', label: t('treatmentPlans.statusScheduled') },
  { value: 'in_progress', label: t('treatmentPlans.statusInProgress') },
  { value: 'done', label: t('treatmentPlans.statusDone') },
  { value: 'cancelled', label: t('treatmentPlans.statusCancelled') }
]

const form = ref({
  patient_id: '',
  title: '',
  planned_date: '',
  status: 'offered',
  priority: 'medium',
  tooth_id: null,
  estimated_cost: null,
  notes: '',
})

const doctorId = computed(() => authStore.user?.id || null)

const filteredPlans = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return plans.value.filter(plan => {
    if (selectedStatus.value && plan.status !== selectedStatus.value) return false
    if (selectedPatient.value && String(plan.patient_id) !== selectedPatient.value) return false
    if (query) {
      const haystack = `${plan.title || ''} ${plan.notes || ''} ${plan.patientName || ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
})

const resetForm = () => {
  form.value = {
    patient_id: '',
    title: '',
    planned_date: '',
    status: 'offered',
    priority: 'medium',
    tooth_id: null,
    estimated_cost: null,
    notes: '',
  }
  formError.value = ''
  showForm.value = false
}

const loadPlans = async () => {
  if (!startDate.value || !endDate.value) return
  const soloClinic = isSolo(authStore)
  if (!soloClinic && !doctorId.value) return

  loading.value = true
  try {
    const items = soloClinic
      ? await getPlansByDateRange(startDate.value, endDate.value)
      : await getPlansByDoctorAndDateRange(doctorId.value, startDate.value, endDate.value)
    const patientMap = new Map(patientsStore.items.map(patient => [Number(patient.id), patient]))
    plans.value = items.map(plan => ({
      ...plan,
      patientName: patientMap.get(Number(plan.patient_id))?.full_name || `#${plan.patient_id}`,
      patientPhone: patientMap.get(Number(plan.patient_id))?.phone || '',
    }))
  } catch (error) {
    console.error('Failed to load treatment plans:', error)
    plans.value = []
  } finally {
    loading.value = false
  }
}

const savePlan = async () => {
  if (!canCreatePlans.value) return
  formError.value = ''
  if (!form.value.title || !form.value.planned_date || !form.value.patient_id) {
    formError.value = t('treatmentPlansView.errorRequired')
    return
  }

  try {
    const payload = {
      patient_id: form.value.patient_id,
      doctor_id: doctorId.value,
      title: form.value.title,
      planned_date: form.value.planned_date,
      status: form.value.status,
      priority: form.value.priority,
      tooth_id: form.value.tooth_id,
      estimated_cost: form.value.estimated_cost,
      notes: form.value.notes,
    }
    const created = await createPlan(payload)
    const patient = patientsStore.items.find(item => Number(item.id) === Number(created.patient_id))
    plans.value.unshift({
      ...created,
      patientName: patient?.full_name || `#${created.patient_id}`,
      patientPhone: patient?.phone || '',
    })
    resetForm()
    toast.success(t('treatmentPlans.toastSaved'))
  } catch (error) {
    console.error('Failed to save treatment plan:', error)
    formError.value = t('treatmentPlansView.errorSave')
  }
}

const onStatusChange = (plan, event) => {
  const nextStatus = event?.target?.value
  if (!nextStatus || nextStatus === plan.status) return
  setStatus(plan, nextStatus)
}

const setStatus = async (plan, status) => {
  if (!canEditPlans.value) return
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
  if (!canEditPlans.value) return
  try {
    if (plan.visit_id) {
      toast.info(t('treatmentPlans.toastVisitExists'))
      return
    }
    const visit = await createVisit({
      patient_id: plan.patient_id,
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
  if (!canEditPlans.value || sendingReminderId.value) return
  sendingReminderId.value = plan.id
  try {
    const result = await sendOrQueueTreatmentPlanReminder(plan, {
      phone: plan.patientPhone,
    })
    if (!result.ok) {
      if (result.error === 'PHONE_REQUIRED') {
        toast.error(t('treatmentPlans.errorReminderPhone'))
      } else if (result.error === 'SMS_TEMPLATE_PENDING') {
        toast.error(result.message || t('treatmentPlans.errorReminderTemplate'))
      } else {
        toast.error(result.message || t('treatmentPlans.errorReminder'))
      }
      return
    }
    if (result.plan) {
      const idx = plans.value.findIndex(item => item.id === plan.id)
      if (idx !== -1) {
        plans.value[idx] = {
          ...plans.value[idx],
          ...result.plan,
          patientName: plan.patientName,
          patientPhone: plan.patientPhone,
        }
      }
    }
    toast.success(t('treatmentPlans.toastReminderSmsSent', { phone: result.phone || plan.patientPhone }))
  } catch (error) {
    console.error('Failed to send reminder:', error)
    toast.error(t('treatmentPlans.errorReminder'))
  } finally {
    sendingReminderId.value = null
  }
}

const statusLabel = (status) => {
  const option = statusOptions.find(item => item.value === status)
  return option ? option.label : status
}

const statusClass = (status) => {
  if (status === 'done') return 'bg-emerald-100 text-emerald-700'
  if (status === 'in_progress') return 'bg-amber-100 text-amber-700'
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (status === 'scheduled') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}

const statusBarClass = (status) => {
  if (status === 'done') return 'bg-emerald-500'
  if (status === 'in_progress') return 'bg-amber-500'
  if (status === 'cancelled') return 'bg-rose-500'
  if (status === 'scheduled') return 'bg-blue-500'
  return 'bg-violet-400'
}

const formatDateDay = (dateStr) => {
  const date = parsePlanDate(dateStr)
  return date ? String(date.getDate()).padStart(2, '0') : '--'
}

const formatDateMonth = (dateStr) => {
  const date = parsePlanDate(dateStr)
  if (!date) return ''
  return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short' })
}

const parsePlanDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date
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

const seedDateRange = () => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  startDate.value = start.toISOString().split('T')[0]
  endDate.value = end.toISOString().split('T')[0]
}

onMounted(async () => {
  seedDateRange()
  await patientsStore.fetchPatients()
  await loadPlans()
})

watch([startDate, endDate], loadPlans)
</script>
