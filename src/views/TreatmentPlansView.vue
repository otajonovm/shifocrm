<template>
  <MainLayout>
    <div class="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0">
      <!-- Desktop sarlavha -->
      <div class="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ t('treatmentPlansView.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ t('treatmentPlansView.subtitle') }}</p>
        </div>
        <button
          v-if="canCreatePlans"
          @click="showForm = !showForm"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('treatmentPlansView.newPlan') }}
        </button>
      </div>

      <!-- Mobil: tushunarli hero + qidiruv -->
      <section class="md:hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-gray-500">{{ t('treatmentPlansView.subtitle') }}</p>
        <div class="mt-1 flex items-end justify-between gap-3">
          <h1 class="text-xl font-semibold leading-tight text-gray-900">{{ t('treatmentPlansView.title') }}</h1>
          <span class="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
            {{ t('treatmentPlansView.plansCount', { count: filteredPlans.length }) }}
          </span>
        </div>
        <label class="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <MagnifyingGlassIcon class="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            v-model="searchQuery"
            type="search"
            class="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            :placeholder="t('treatmentPlansView.searchPlaceholder')"
          />
        </label>
      </section>

      <!-- Mobil: status chiplari -->
      <div class="md:hidden -mx-4 px-4">
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            class="flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors"
            :class="selectedStatus === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'"
            @click="selectedStatus = ''"
          >
            {{ t('treatmentPlansView.allChip') }}
          </button>
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors"
            :class="selectedStatus === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'"
            @click="selectedStatus = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Mobil: qo'shimcha filtrlar -->
      <div class="md:hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left"
          @click="showMobileFilters = !showMobileFilters"
        >
          <span class="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FunnelIcon class="h-4 w-4 text-gray-400" />
            {{ t('treatmentPlansView.filters') }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span v-if="extraFilterCount" class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-700/10">
              {{ extraFilterCount }}
            </span>
            <ChevronDownIcon
              class="h-4 w-4 text-gray-400 transition-transform"
              :class="showMobileFilters ? 'rotate-180' : ''"
            />
          </span>
        </button>

        <div v-if="showMobileFilters" class="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlansView.patient') }}</label>
            <select
              v-model="selectedPatient"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">{{ t('treatmentPlansView.allPatients') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlansView.dateFrom') }}</label>
              <input
                v-model="startDate"
                type="date"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">{{ t('treatmentPlansView.dateTo') }}</label>
              <input
                v-model="endDate"
                type="date"
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop filtrlar -->
      <div class="hidden md:block rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div class="lg:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlansView.search') }}</label>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              :placeholder="t('treatmentPlansView.searchPlaceholder')"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlansView.patient') }}</label>
            <select
              v-model="selectedPatient"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">{{ t('treatmentPlansView.allPatients') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.status') }}</label>
            <select
              v-model="selectedStatus"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">{{ t('treatmentPlansView.allStatuses') }}</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlansView.dateRange') }}</label>
            <div class="flex gap-2">
              <input
                v-model="startDate"
                type="date"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <input
                v-model="endDate"
                type="date"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.planTitle') }} *</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              :placeholder="t('treatmentPlans.planTitlePlaceholder')"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlansView.patient') }} *</label>
            <select
              v-model="form.patient_id"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="">{{ t('treatmentPlansView.selectPatient') }}</option>
              <option v-for="patient in patientsStore.items" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.planDate') }} *</label>
            <input
              v-model="form.planned_date"
              type="date"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
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
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.tooth') }}</label>
            <input
              v-model.number="form.tooth_id"
              type="number"
              min="11"
              max="48"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              :placeholder="t('treatmentPlans.toothPlaceholder')"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.estimatedCost') }}</label>
            <input
              v-model.number="form.estimated_cost"
              type="number"
              min="0"
              step="1000"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              :placeholder="t('treatmentPlans.estimatedCostPlaceholder')"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('treatmentPlans.notes') }}</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              :placeholder="t('treatmentPlans.notesPlaceholder')"
            ></textarea>
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

      <!-- Desktop Table -->
      <div class="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td class="px-4 py-4 text-sm text-gray-500" colspan="8">{{ t('treatmentPlans.loading') }}</td>
            </tr>
            <tr v-else-if="filteredPlans.length === 0">
              <td class="px-4 py-4 text-sm text-gray-500" colspan="8">{{ t('treatmentPlans.noPlans') }}</td>
            </tr>
            <tr
              v-for="plan in filteredPlans"
              :key="plan.id"
              class="bg-white transition-colors hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="font-semibold text-gray-900">{{ plan.title }}</div>
                <div class="text-sm text-gray-500">{{ plan.notes || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-gray-700">
                <div>{{ plan.patientName || '-' }}</div>
                <div v-if="plan.patientPhone" class="text-sm text-gray-500">{{ plan.patientPhone }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(plan.planned_date) }}</td>
              <td class="px-4 py-3">
                <span :class="statusClass(plan.status)" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {{ statusLabel(plan.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700">{{ priorityLabel(plan.priority) }}</td>
              <td class="px-4 py-3 text-gray-700">{{ plan.tooth_id ? `#${plan.tooth_id}` : '-' }}</td>
              <td class="px-4 py-3 text-gray-700">{{ formatCurrency(plan.estimated_cost) }}</td>
              <td class="px-4 py-3 text-right">
                <div v-if="canEditPlans" class="flex items-center justify-end gap-2">
                  <select
                    :value="plan.status"
                    class="max-w-[160px] rounded-xl border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    @change="onStatusChange(plan, $event)"
                  >
                    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <button
                    v-if="!plan.visit_id"
                    type="button"
                    class="rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    @click="convertToVisit(plan)"
                  >
                    {{ t('treatmentPlans.toVisit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
      <div class="space-y-3 md:hidden">
        <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
          {{ t('treatmentPlans.loading') }}
        </div>
        <div v-else-if="filteredPlans.length === 0" class="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
          <p class="text-base font-semibold text-gray-900">{{ t('treatmentPlans.noPlans') }}</p>
          <p class="mt-1 text-sm text-gray-500">{{ t('treatmentPlansView.noPlansHint') }}</p>
        </div>
        <article
          v-for="plan in filteredPlans"
          v-else
          :key="plan.id"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div class="flex">
            <div class="w-1.5 flex-shrink-0" :class="statusBarClass(plan.status)" />
            <div class="min-w-0 flex-1 p-3.5">
              <div class="flex items-start gap-3">
                <div class="flex h-12 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-center">
                  <span class="text-[10px] font-medium uppercase text-gray-500">{{ formatDateMonth(plan.planned_date) }}</span>
                  <span class="text-lg font-semibold leading-none text-gray-900">{{ formatDateDay(plan.planned_date) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="truncate text-base font-semibold text-gray-900">{{ plan.title }}</h3>
                    <span :class="statusClass(plan.status)" class="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {{ statusLabel(plan.status) }}
                    </span>
                  </div>
                  <p class="mt-1 truncate text-sm text-gray-500">{{ plan.patientName || '-' }}</p>
                  <p v-if="plan.patientPhone" class="truncate text-sm text-gray-500">{{ plan.patientPhone }}</p>
                  <div class="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-500">
                    <span v-if="plan.tooth_id" class="rounded-full bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">#{{ plan.tooth_id }}</span>
                    <span class="rounded-full bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">{{ priorityLabel(plan.priority) }}</span>
                    <span v-if="plan.estimated_cost" class="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-600/20">
                      {{ formatCurrency(plan.estimated_cost) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="canEditPlans" class="mt-3 space-y-2 border-t border-gray-100 pt-3">
                <select
                  :value="plan.status"
                  class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
                    class="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    @click="convertToVisit(plan)"
                  >
                    {{ t('treatmentPlans.toVisit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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

defineOptions({ name: 'TreatmentPlansView' })

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
  if (status === 'done') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
  if (status === 'in_progress') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
  if (status === 'scheduled') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10'
  return 'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10'
}

const statusBarClass = (status) => {
  if (status === 'done') return 'bg-emerald-200'
  if (status === 'in_progress') return 'bg-amber-200'
  if (status === 'cancelled') return 'bg-rose-200'
  if (status === 'scheduled') return 'bg-blue-200'
  return 'bg-gray-200'
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
