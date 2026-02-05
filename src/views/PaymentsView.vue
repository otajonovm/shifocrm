<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('payments.title') }}</h1>
          <p class="text-gray-500">{{ t('payments.subtitle') }}</p>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          @click="openCreateModal"
        >
          {{ t('payments.addPayment') }}
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('payments.totalPayments') }}</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalPayments) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('payments.refunds') }}</p>
          <p class="mt-2 text-lg font-semibold text-rose-600">{{ formatCurrency(totalRefunds) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('payments.netIncome') }}</p>
          <p class="mt-2 text-lg font-semibold text-emerald-600">{{ formatCurrency(netIncome) }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-card space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">{{ t('payments.filtersTitle') }}</h2>
          <button
            class="text-sm text-gray-500 hover:text-gray-700"
            @click="resetFilters"
          >
            {{ t('payments.clearFilters') }}
          </button>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('payments.startDate') }}</label>
            <input v-model="filters.startDate" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('payments.endDate') }}</label>
            <input v-model="filters.endDate" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ t('payments.patient') }}</label>
            <select v-model="filters.patientId" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">{{ t('payments.allPatients') }}</option>
              <option v-for="patient in patients" :key="patient.id" :value="String(patient.id)">
                {{ patient.full_name }} (#{{ patient.id }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('payments.listTitle') }}</h2>
            <p class="text-sm text-gray-500">{{ t('payments.listSubtitle') }}</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-6 py-3">{{ t('payments.date') }}</th>
                <th class="px-6 py-3">{{ t('payments.patient') }}</th>
                <th class="px-6 py-3">{{ t('payments.visitId') }}</th>
                <th class="px-6 py-3">{{ t('payments.doctor') }}</th>
                <th class="px-6 py-3">{{ t('payments.type') }}</th>
                <th class="px-6 py-3">{{ t('payments.amount') }}</th>
                <th class="px-6 py-3">{{ t('payments.method') }}</th>
                <th class="px-6 py-3">{{ t('payments.note') }}</th>
                <th class="px-6 py-3">{{ t('payments.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td class="px-6 py-4 text-gray-500" colspan="9">{{ t('payments.loading') }}</td>
              </tr>
              <tr v-else-if="filteredPayments.length === 0">
                <td class="px-6 py-4 text-gray-500" colspan="9">{{ t('payments.noPayments') }}</td>
              </tr>
              <tr v-for="payment in filteredPayments" :key="payment.id" class="bg-white">
                <td class="px-6 py-4 text-gray-700">{{ formatDate(payment.paid_at) }}</td>
                <td class="px-6 py-4 text-gray-700">
                  {{ getPatientLabel(payment.patient_id) }}
                </td>
                <td class="px-6 py-4 text-gray-700">#{{ payment.visit_id }}</td>
                <td class="px-6 py-4 text-gray-700">
                  {{ getDoctorLabel(payment.doctor_id) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="getTypeClass(payment.payment_type)">
                    {{ getTypeLabel(payment.payment_type) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-700">{{ formatCurrency(payment.amount) }}</td>
                <td class="px-6 py-4 text-gray-700">{{ payment.method || '-' }}</td>
                <td class="px-6 py-4 text-gray-700">{{ payment.note || '-' }}</td>
                <td class="px-6 py-4 text-gray-700">
                  <div class="flex items-center gap-2">
                    <button class="text-primary-600 hover:text-primary-700 text-sm" @click="openEditModal(payment)">
                      {{ t('payments.edit') }}
                    </button>
                    <button class="text-rose-600 hover:text-rose-700 text-sm" @click="confirmDelete(payment)">
                      {{ t('payments.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isEditing ? t('payments.editPayment') : t('payments.addPayment') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.patient') }}</label>
                  <select v-model="form.patient_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('payments.patientPlaceholder') }}</option>
                    <option v-for="patient in patients" :key="patient.id" :value="String(patient.id)">
                      {{ patient.full_name }} (#{{ patient.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.visitId') }}</label>
                  <input v-model="form.visit_id" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('payments.visitIdPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.doctor') }}</label>
                  <select v-model="form.doctor_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('payments.doctorPlaceholder') }}</option>
                    <option v-for="doctor in doctors" :key="doctor.id" :value="String(doctor.id)">
                      {{ doctor.full_name }} (#{{ doctor.id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.paidAt') }}</label>
                  <input v-model="form.paid_at" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.type') }}</label>
                  <select v-model="form.payment_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="payment">{{ t('payments.typePayment') }}</option>
                    <option value="refund">{{ t('payments.typeRefund') }}</option>
                    <option value="adjustment">{{ t('payments.typeAdjustment') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.method') }}</label>
                  <select v-model="form.method" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="cash">{{ t('payments.methodCash') }}</option>
                    <option value="card">{{ t('payments.methodCard') }}</option>
                    <option value="transfer">{{ t('payments.methodTransfer') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.amount') }}</label>
                  <input v-model="form.amount" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('payments.amountPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('payments.note') }}</label>
                  <input v-model="form.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('payments.notePlaceholder')" />
                </div>
              </div>

              <div v-if="visitPreview" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                <p class="font-medium text-gray-700">{{ t('payments.visitSummary') }}</p>
                <div class="mt-1 flex flex-wrap gap-4">
                  <span>{{ t('payments.visitPrice') }}: {{ formatCurrency(visitPreview.price || 0) }}</span>
                  <span>{{ t('payments.visitPaid') }}: {{ formatCurrency(visitPreview.paid_amount || 0) }}</span>
                  <span>{{ t('payments.visitDebt') }}: {{ formatCurrency(visitPreview.debt_amount || 0) }}</span>
                </div>
              </div>
              <p v-else-if="visitPreviewLoading" class="text-sm text-gray-500">{{ t('payments.loadingVisit') }}</p>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeModal">
                {{ t('payments.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="savePayment">
                {{ t('payments.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPayments, createPayment, updatePayment, deletePayment } from '@/api/paymentsApi'
import { listDoctors } from '@/api/doctorsApi'
import { listPatients } from '@/api/patientsApi'
import { getVisitById, updateVisit } from '@/api/visitsApi'
import { useToast } from '@/composables/useToast'

const payments = ref([])
const { t } = useI18n()
const loading = ref(false)
const toast = useToast()
const doctors = ref([])
const patients = ref([])
const showPaymentModal = ref(false)
const isEditing = ref(false)
const visitPreview = ref(null)
const visitPreviewLoading = ref(false)

const filters = ref({
  startDate: '',
  endDate: '',
  patientId: ''
})

const form = ref({
  id: null,
  visit_id: '',
  patient_id: '',
  doctor_id: '',
  amount: '',
  payment_type: 'payment',
  method: 'cash',
  note: '',
  paid_at: ''
})

const totalPayments = computed(() =>
  filteredPayments.value.reduce((sum, entry) => sum + (entry.payment_type === 'payment' ? Number(entry.amount) || 0 : 0), 0)
)

const totalRefunds = computed(() =>
  filteredPayments.value.reduce((sum, entry) => sum + (entry.payment_type === 'refund' ? Number(entry.amount) || 0 : 0), 0)
)

const netIncome = computed(() =>
  filteredPayments.value.reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0
    return sum + (entry.payment_type === 'refund' ? -amount : amount)
  }, 0)
)

const patientMap = computed(() => {
  const map = new Map()
  patients.value.forEach(patient => {
    map.set(Number(patient.id), patient.full_name)
  })
  return map
})

const doctorMap = computed(() => {
  const map = new Map()
  doctors.value.forEach(doctor => {
    map.set(Number(doctor.id), doctor.full_name)
  })
  return map
})

const filteredPayments = computed(() => {
  const { startDate, endDate, patientId } = filters.value
  return payments.value.filter(entry => {
    if (patientId && String(entry.patient_id || '') !== patientId) return false
    if (startDate || endDate) {
      const paidDate = entry.paid_at ? new Date(entry.paid_at) : null
      if (!paidDate || Number.isNaN(paidDate.getTime())) return false
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null
      const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null
      if (start && paidDate < start) return false
      if (end && paidDate > end) return false
    }
    return true
  })
})

const getTypeLabel = (type) => {
  if (type === 'refund') return t('payments.typeRefund')
  if (type === 'adjustment') return t('payments.typeAdjustment')
  return t('payments.typePayment')
}

const getTypeClass = (type) => {
  if (type === 'refund') return 'text-rose-600 font-medium'
  if (type === 'adjustment') return 'text-amber-600 font-medium'
  return 'text-emerald-600 font-medium'
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const getPatientLabel = (patientId) => {
  const name = patientMap.value.get(Number(patientId))
  return name ? `${name} (#${patientId})` : `#${patientId}`
}

const getDoctorLabel = (doctorId) => {
  if (!doctorId) return '-'
  const name = doctorMap.value.get(Number(doctorId))
  return name ? `${name} (#${doctorId})` : `#${doctorId}`
}

const loadPayments = async () => {
  loading.value = true
  try {
    payments.value = await listPayments('order=paid_at.desc')
  } catch (error) {
    console.error('Failed to load payments:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
}

const loadFiltersData = async () => {
  try {
    patients.value = await listPatients() || []
  } catch (error) {
    console.error('Failed to load filters data:', error)
  }
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    patientId: ''
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    id: null,
    visit_id: '',
    patient_id: '',
    doctor_id: '',
    amount: '',
    payment_type: 'payment',
    method: 'cash',
    note: '',
    paid_at: ''
  }
  visitPreview.value = null
  showPaymentModal.value = true
}

const openEditModal = (payment) => {
  isEditing.value = true
  form.value = {
    id: payment.id,
    visit_id: payment.visit_id ? String(payment.visit_id) : '',
    patient_id: payment.patient_id ? String(payment.patient_id) : '',
    doctor_id: payment.doctor_id ? String(payment.doctor_id) : '',
    amount: payment.amount ?? '',
    payment_type: payment.payment_type || 'payment',
    method: payment.method || 'cash',
    note: payment.note || '',
    paid_at: payment.paid_at ? payment.paid_at.slice(0, 16) : ''
  }
  showPaymentModal.value = true
}

const closeModal = () => {
  showPaymentModal.value = false
  visitPreview.value = null
}

const savePayment = async () => {
  const visitId = Number(form.value.visit_id)
  const patientId = Number(form.value.patient_id)
  if (!Number.isFinite(visitId)) {
    toast.error(t('payments.errorVisitRequired'))
    return
  }
  if (!Number.isFinite(patientId)) {
    toast.error(t('payments.errorPatientRequired'))
    return
  }
  const amount = Number(form.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    toast.error(t('payments.errorAmountRequired'))
    return
  }
  const payload = {
    visit_id: visitId,
    patient_id: patientId,
    doctor_id: form.value.doctor_id ? Number(form.value.doctor_id) : null,
    amount,
    payment_type: form.value.payment_type,
    method: form.value.method || null,
    note: form.value.note || null,
    paid_at: form.value.paid_at ? new Date(form.value.paid_at).toISOString() : null
  }

  try {
    if (isEditing.value && form.value.id) {
      await updatePayment(form.value.id, payload)
      toast.success(t('payments.toastUpdated'))
    } else {
      await createPayment(payload)
      toast.success(t('payments.toastCreated'))
    }
    await loadPayments()
    await syncVisitStatusIfFullyPaid(visitId)
    closeModal()
  } catch (error) {
    console.error('Failed to save payment:', error)
    toast.error(t('payments.errorSave'))
  }
}

const syncVisitStatusIfFullyPaid = async (visitId) => {
  try {
    const visit = await getVisitById(visitId)
    if (!visit || visit.status !== 'completed_debt') return
    const price = Number(visit.price)
    const paid = Number(visit.paid_amount) || 0
    if (price > 0 && paid >= price) {
      await updateVisit(visitId, { status: 'completed_paid', debt_amount: null })
    }
  } catch (e) {
    console.warn('syncVisitStatusIfFullyPaid:', e)
  }
}

const confirmDelete = async (payment) => {
  const confirmed = window.confirm(t('payments.confirmDelete'))
  if (!confirmed) return
  try {
    await deletePayment(payment.id)
    toast.success(t('payments.toastDeleted'))
    await loadPayments()
  } catch (error) {
    console.error('Failed to delete payment:', error)
    toast.error(t('payments.errorDelete'))
  }
}

const loadVisitPreview = async (visitId) => {
  if (!Number.isFinite(visitId)) {
    visitPreview.value = null
    return
  }
  visitPreviewLoading.value = true
  try {
    visitPreview.value = await getVisitById(visitId)
    if (visitPreview.value && !form.value.patient_id) {
      form.value.patient_id = String(visitPreview.value.patient_id || '')
    }
    if (visitPreview.value && !form.value.doctor_id) {
      form.value.doctor_id = visitPreview.value.doctor_id ? String(visitPreview.value.doctor_id) : ''
    }
  } catch (error) {
    console.error('Failed to load visit preview:', error)
    visitPreview.value = null
  } finally {
    visitPreviewLoading.value = false
  }
}

watch(
  () => form.value.visit_id,
  (newValue) => {
    const visitId = Number(newValue)
    if (newValue === '') {
      visitPreview.value = null
      return
    }
    loadVisitPreview(visitId)
  }
)

onMounted(async () => {
  await Promise.all([loadPayments(), loadFiltersData()])
})
</script>
