import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmployeesStore } from '@/stores/employees'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import { useDoctorsStore } from '@/stores/doctors'
import { useClinicStore } from '@/stores/clinic'
import { checkPhoneUnique, getCashRegisters, uploadEmployeeAvatar } from '@/api/employeesApi'
import { syncDoctorPermissionsFromEmployee } from '@/lib/staffBridge'
import {
  buildEmptyWizardForm,
  employeeToWizardForm,
  wizardFormToEmployeeRecord,
  validateWizardStep,
  buildSchedulePayload,
  validateScheduleConflicts,
  formatChairConflictMessage,
  isDoctorRole,
  specializationFromUiRole,
} from '@/lib/staffHelpers'
import { clonePermissionsMatrix, defaultMatrixForRole } from '@/lib/staffPermissionsMatrix'
import { syncLegacyPermissionFlags } from '@/lib/staffPermissions'
import { formatPhoneForStorage, isValidUzPhone } from '@/lib/phoneUz'

const TOTAL_STEPS = 4

export function useStaffWizard({ onSaved } = {}) {
  const authStore = useAuthStore()
  const employeesStore = useEmployeesStore()
  const doctorsStore = useDoctorsStore()
  const employeePermsStore = useEmployeePermissionsStore()
  const clinicStore = useClinicStore()

  const isOpen = ref(false)
  const isEditMode = ref(false)
  const editingEmployeeId = ref(null)
  const activeStep = ref(1)
  const formError = ref('')
  const isSubmitting = ref(false)
  const cashRegisters = ref([])

  const form = reactive(buildEmptyWizardForm())
  const permissions = reactive(defaultMatrixForRole('doctor'))

  const clinicName = computed(() => clinicStore.displayName || 'Joriy klinika')

  const setPermissions = (matrix) => {
    const normalized = clonePermissionsMatrix(matrix)
    Object.keys(normalized).forEach((key) => {
      permissions[key] = { ...normalized[key] }
    })
  }

  const resetForm = () => {
    Object.assign(form, buildEmptyWizardForm())
    setPermissions(defaultMatrixForRole('doctor'))
    activeStep.value = 1
    formError.value = ''
    editingEmployeeId.value = null
    isEditMode.value = false
  }

  const openCreate = async () => {
    resetForm()
    setPermissions(defaultMatrixForRole('doctor'))
    form.ui_role = 'doctor'
    isOpen.value = true
    await loadCashRegisters()
  }

  const openEdit = async (employee) => {
    resetForm()
    isEditMode.value = true
    editingEmployeeId.value = employee.id
    employeePermsStore.loadFromEmployee(employee)
    const matrix = employeePermsStore.getMatrixPermissions(employee.id)
    setPermissions(matrix)
    const wizardData = employeeToWizardForm(employee, permissions)
    Object.assign(form, wizardData)
    isOpen.value = true
    await loadCashRegisters()
  }

  const close = () => {
    isSubmitting.value = false
    isOpen.value = false
    resetForm()
  }

  const loadCashRegisters = async () => {
    const clinicId = authStore.userClinicId
    try {
      cashRegisters.value = await getCashRegisters(clinicId)
      if (!form.allowed_cash_register_id && cashRegisters.value[0]) {
        form.allowed_cash_register_id = cashRegisters.value[0].id
      }
    } catch {
      cashRegisters.value = []
    }
  }

  const validateCurrentStep = () => {
    formError.value = ''
    const stepError = validateWizardStep(activeStep.value, form, { isEdit: isEditMode.value })
    if (stepError) {
      formError.value = stepError
      return false
    }
    if (activeStep.value === 1) {
      if (!isValidUzPhone(form.phone)) {
        formError.value = 'Telefon raqami noto\'g\'ri formatda.'
        return false
      }
    }
    return true
  }

  const next = async () => {
    if (!validateCurrentStep()) return
    if (activeStep.value === 1) {
      const clinicId = authStore.userClinicId
      try {
        const result = await checkPhoneUnique(form.phone, {
          clinicId,
          excludeEmployeeId: editingEmployeeId.value,
        })
        if (!result.unique) {
          formError.value = 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan.'
          return
        }
      } catch (error) {
        formError.value = error?.message || 'Telefon tekshiruvida xatolik'
        return
      }
    }
    if (activeStep.value === 2 && !isEditMode.value) {
      setPermissions(defaultMatrixForRole(form.ui_role))
    }
    if (activeStep.value < TOTAL_STEPS) {
      activeStep.value += 1
    }
  }

  const back = () => {
    formError.value = ''
    if (activeStep.value > 1) activeStep.value -= 1
  }

  const submit = async () => {
    if (!validateCurrentStep()) return
    isSubmitting.value = true
    formError.value = ''

    try {
      const clinicId = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
        ? Number(authStore.userClinicId)
        : null

      const phoneCheck = await checkPhoneUnique(form.phone, {
        clinicId,
        excludeEmployeeId: editingEmployeeId.value,
      })
      if (!phoneCheck.unique) {
        throw new Error('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan.')
      }

      const employeeData = wizardFormToEmployeeRecord(form, clinicId, {
        includePassword: !isEditMode.value || !!form.password,
      })
      employeeData.phone = formatPhoneForStorage(form.phone)
      if (form.additional_phone) {
        employeeData.additional_phone = formatPhoneForStorage(form.additional_phone)
      }

      const specialization = specializationFromUiRole(form.ui_role, form.specialty)
      const doctorRole = isDoctorRole(specialization)
      const scheduleData = buildSchedulePayload(
        { ...form, specialization, chair: form.chair, work_schedule: form.work_schedule },
        editingEmployeeId.value,
        { isDoctor: doctorRole }
      )

      const conflict = validateScheduleConflicts(
        employeesStore.items,
        scheduleData,
        editingEmployeeId.value,
        {
          legacyDoctors: doctorsStore.items,
          excludeLegacyDoctorId: employeesStore.items.find((e) => e.id === editingEmployeeId.value)?.legacy_doctor_id ?? null,
        }
      )
      if (conflict) {
        throw new Error(formatChairConflictMessage(conflict))
      }

      const permissionsPayload = syncLegacyPermissionFlags(permissions)

      if (isEditMode.value && editingEmployeeId.value) {
        if (!form.password) delete employeeData.password
        const existing = employeesStore.items.find((e) => e.id === editingEmployeeId.value)
        await employeesStore.update(
          editingEmployeeId.value,
          employeeData,
          scheduleData,
          existing
        )
        await employeePermsStore.saveMatrixPermissions(editingEmployeeId.value, permissions)
        if (existing?.legacy_doctor_id) {
          await syncDoctorPermissionsFromEmployee(existing, {
            module_permissions: permissionsPayload.module_permissions,
            data_permissions: {
              can_view_revenue: permissionsPayload.can_view_revenue,
              can_export_data: permissionsPayload.can_export_data,
              can_edit_prices: permissionsPayload.can_edit_prices,
              can_manage_medical_records: permissionsPayload.can_manage_medical_records,
              can_allow_debt_treatment: permissionsPayload.can_allow_debt_treatment,
            },
          })
        }
      } else {
        const created = await employeesStore.create(
          employeeData,
          permissionsPayload,
          scheduleData
        )
        if (created?.id && form._avatarFile) {
          try {
            const url = await uploadEmployeeAvatar(form._avatarFile, created.id)
            await employeesStore.update(created.id, { avatar_url: url }, [], created)
          } catch (avatarErr) {
            console.warn('Avatar upload failed:', avatarErr?.message)
          }
        }
      }

      onSaved?.()
      close()
      return true
    } catch (error) {
      formError.value = employeesStore.error || error?.message || 'Saqlashda xatolik'
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isOpen,
    isEditMode,
    activeStep,
    totalSteps: TOTAL_STEPS,
    form,
    permissions,
    setPermissions,
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
    validateCurrentStep,
  }
}
