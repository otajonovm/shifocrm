<template>
  <div>
    <!-- Header + Yangi xodim -->
    <div v-if="canManageStaff" class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ t('staffWizard.listTitle') }}</h2>
        <p class="text-sm text-gray-500">{{ t('staffWizard.listSubtitle') }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
        @click="openCreate()"
      >
        <PlusIcon class="h-5 w-5" />
        {{ t('staffWizard.addEmployee') }}
      </button>
    </div>

    <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
      <p class="text-sm text-gray-600">
        {{ isClinicAdminOnly ? t('staffWizard.noPermissionSettings') : t('staffWizard.noPermission') }}
      </p>
    </div>

    <!-- Xodimlar jadvali -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-card p-4 sm:p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-semibold text-gray-900">{{ t('staffWizard.tableTitle') }}</h3>
        <button
          type="button"
          @click="refreshEmployees"
          :disabled="employeesStore.isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {{ t('staffWizard.refresh') }}
        </button>
      </div>

      <div v-if="employeesStore.error" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-600">{{ employeesStore.error }}</p>
      </div>

      <div v-if="employeesStore.isLoading" class="text-center py-8">
        <LoadingSpinner :message="t('staffWizard.loading')" />
      </div>

      <div v-else-if="employeesStore.items.length === 0" class="text-center py-12">
        <UsersIcon class="w-14 h-14 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-600">{{ t('staffWizard.empty') }}</p>
      </div>

      <div v-else class="overflow-x-auto rounded-xl border border-slate-100">
        <table class="min-w-full divide-y divide-gray-100 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colEmployee') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colPhone') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colRole') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colSpecialty') }}</th>
              <th v-if="canManageStaff" class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colKpi') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colStatus') }}</th>
              <th v-if="canManageStaff" class="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">{{ t('staffWizard.colActions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 bg-white">
            <tr v-for="employee in employeesStore.items" :key="employee.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                    <img
                      v-if="employee.avatar_url"
                      :src="employee.avatar_url"
                      :alt="employee.full_name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="text-sm font-bold text-primary-700">
                      {{ getInitials(employee.full_name) }}
                    </span>
                  </div>
                  <div class="font-medium text-gray-900">{{ employee.full_name }}</div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ displayPhone(employee.phone) }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {{ roleLabel(employee) }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ employee.specialization || '—' }}</td>
              <td v-if="canManageStaff" class="px-4 py-3 text-gray-600">{{ getKpiLabel(employee) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="employee.is_active !== false && employee.status !== 'inactive'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'"
                >
                  {{ employee.is_active !== false && employee.status !== 'inactive' ? t('staffWizard.statusActive') : t('staffWizard.statusInactive') }}
                </span>
              </td>
              <td v-if="canManageStaff" class="px-4 py-3 text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="p-2 rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    :title="t('staffWizard.edit')"
                    @click="openEdit(employee)"
                  >
                    <PencilSquareIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    :title="t('staffWizard.delete')"
                    @click="handleDeleteEmployee(employee.id)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <StaffWizardModal
      :open="isOpen"
      :is-edit="isEditMode"
      :active-step="activeStep"
      :total-steps="totalSteps"
      :form="form"
      :permissions="permissions"
      :form-error="formError"
      :is-submitting="isSubmitting"
      :cash-registers="cashRegisters"
      :clinic-name="clinicName"
      @close="close()"
      @next="next()"
      @back="back()"
      @submit="handleWizardSubmit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { canManageStaff as checkCanManageStaff, isClinicAdmin } from '@/lib/roles'
import { useEmployeesStore } from '@/stores/employees'
import { useDoctorsStore } from '@/stores/doctors'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import { useToast } from '@/composables/useToast'
import { useStaffWizard } from '@/composables/useStaffWizard'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import StaffWizardModal from '@/components/staff/wizard/StaffWizardModal.vue'
import { formatPhoneUzDisplay } from '@/lib/phoneUz'
import {
  isDoctorRole,
  uiRoleFromEmployee,
  UI_ROLE_OPTIONS,
} from '@/lib/staffHelpers'

const authStore = useAuthStore()
const employeesStore = useEmployeesStore()
const doctorsStore = useDoctorsStore()
const employeePermsStore = useEmployeePermissionsStore()
const toast = useToast()
const { t } = useI18n()

const canManageStaff = computed(() => checkCanManageStaff(authStore))
const isClinicAdminOnly = computed(() => isClinicAdmin(authStore))

const {
  isOpen,
  isEditMode,
  activeStep,
  totalSteps,
  form,
  permissions,
  formError,
  isSubmitting,
  cashRegisters,
  clinicName,
  openCreate,
  openEdit,
  close,
  next,
  back,
  submit,
} = useStaffWizard({
  onSaved: () => {
    toast.success(isEditMode.value ? t('staffWizard.updatedToast') : t('staffWizard.createdToast'))
    refreshEmployees()
  },
})

const displayPhone = (phone) => {
  if (!phone) return '—'
  return formatPhoneUzDisplay(phone)
}

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

const roleLabel = (employee) => {
  const uiRole = uiRoleFromEmployee(employee)
  return UI_ROLE_OPTIONS.find((o) => o.value === uiRole)?.labelUz || employee.role || '—'
}

const getKpiLabel = (employee) => {
  if (isDoctorRole(employee?.specialization)) {
    const value = employee?.general_percentage ?? employee?.salary_percentage
    if (value == null || value === '') return '—'
    const numeric = Number(value)
    return Number.isFinite(numeric) ? `${numeric}%` : String(value)
  }
  const fixed = employee?.fixed_salary_amount
  if (fixed == null || fixed === '') return '—'
  const amount = Number(fixed)
  return Number.isFinite(amount)
    ? `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`
    : String(fixed)
}

const handleWizardSubmit = async () => {
  try {
    await submit()
  } catch {
    toast.error(formError.value || t('staffWizard.saveError'))
  }
}

const handleDeleteEmployee = async (id) => {
  if (!canManageStaff.value) return
  if (!confirm(t('staffWizard.deleteConfirm'))) return

  try {
    await employeesStore.remove(id)
    toast.success(t('staffWizard.deletedToast'))
  } catch {
    toast.error(t('staffWizard.deleteError'))
  }
}

const refreshEmployees = async () => {
  try {
    await Promise.all([
      employeesStore.fetchAll(),
      doctorsStore.fetchAll().catch(() => {}),
    ])
    employeesStore.items.forEach((employee) => {
      employeePermsStore.loadFromEmployee(employee)
    })
  } catch {
    toast.error(t('staffWizard.refreshError'))
  }
}

onMounted(async () => {
  await Promise.all([
    refreshEmployees(),
    doctorsStore.fetchAll().catch(() => {}),
  ])
})
</script>
