<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="grid gap-4 sm:grid-cols-4 flex-1">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('patientPayments.totalPayments') }}</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalPayments) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('patientPayments.refunds') }}</p>
          <p class="mt-2 text-lg font-semibold text-rose-600">{{ formatCurrency(totalRefunds) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('patientPayments.netIncome') }}</p>
          <p class="mt-2 text-lg font-semibold text-emerald-600">{{ formatCurrency(netIncome) }}</p>
        </div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">{{ t('patientPayments.totalServices') }}</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalServices) }}</p>
        </div>
      </div>
      <button
        v-if="isAdmin"
        class="ml-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        @click="openCreateModal"
      >
        {{ t('patientPayments.addPayment') }}
      </button>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientPayments.date') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.visitId') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.type') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.amount') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.method') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.note') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('patientPayments.loading') }}</td>
          </tr>
          <tr v-else-if="payments.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('patientPayments.noPayments') }}</td>
          </tr>
          <tr v-for="entry in payments" :key="entry.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.paid_at) }}</td>
            <td class="px-4 py-3 text-slate-700">#{{ entry.visit_id }}</td>
            <td class="px-4 py-3 text-slate-700">
              <span :class="getTypeClass(entry.payment_type)">
                {{ getTypeLabel(entry.payment_type) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700">
              {{ formatCurrency(entry.amount) }}
            </td>
            <td class="px-4 py-3 text-slate-700">{{ entry.method || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ entry.note || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">
              <div v-if="isAdmin" class="flex items-center gap-2">
                <button class="text-primary-600 hover:text-primary-700 text-sm" @click="openEditModal(entry)">
                  {{ t('patientPayments.edit') }}
                </button>
                <button class="text-rose-600 hover:text-rose-700 text-sm" @click="confirmDelete(entry)">
                  {{ t('patientPayments.delete') }}
                </button>
              </div>
              <span v-else class="text-slate-400 text-sm">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientPayments.services') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.tooth') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.price') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.doctor') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.date') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="servicesLoading">
            <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('patientPayments.loading') }}</td>
          </tr>
          <tr v-else-if="services.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('patientPayments.noServices') }}</td>
          </tr>
          <tr v-for="service in services" :key="service.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">{{ service.service_name }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.tooth_id ? `#${service.tooth_id}` : '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatCurrency(service.price) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.performed_by || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatDate(service.created_at) }}</td>
          </tr>
        </tbody>
      </table>
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
                {{ isEditing ? t('patientPayments.editPayment') : t('patientPayments.addPayment') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.visitId') }}</label>
                  <input v-model="form.visit_id" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.visitIdPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.paidAt') }}</label>
                  <input v-model="form.paid_at" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.type') }}</label>
                  <select v-model="form.payment_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="payment">{{ t('patientPayments.typePayment') }}</option>
                    <option value="refund">{{ t('patientPayments.typeRefund') }}</option>
                    <option value="adjustment">{{ t('patientPayments.typeAdjustment') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.method') }}</label>
                  <select v-model="form.method" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="cash">{{ t('patientPayments.methodCash') }}</option>
                    <option value="card">{{ t('patientPayments.methodCard') }}</option>
                    <option value="transfer">{{ t('patientPayments.methodTransfer') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.amount') }}</label>
                  <input v-model="form.amount" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.amountPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.note') }}</label>
                  <input v-model="form.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.notePlaceholder')" />
                </div>
              </div>
              <p v-if="visitPreviewLoading" class="text-sm text-gray-500">{{ t('patientPayments.loadingVisit') }}</p>
              <div v-if="visitPreview" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                <p class="font-medium text-gray-700">{{ t('patientPayments.visitSummary') }}</p>
                <div class="mt-1 flex flex-wrap gap-4">
                  <span>{{ t('patientPayments.visitPrice') }}: {{ formatCurrency(visitPreview.price || 0) }}</span>
                  <span>{{ t('patientPayments.visitPaid') }}: {{ formatCurrency(visitPreview.paid_amount || 0) }}</span>
                  <span>{{ t('patientPayments.visitDebt') }}: {{ formatCurrency(visitPreview.debt_amount || 0) }}</span>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeModal">
                {{ t('patientPayments.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="savePayment">
                {{ t('patientPayments.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { createPayment, updatePayment, deletePayment, getPaymentsByPatientId } from '@/api/paymentsApi'
import { getVisitServicesByPatientId } from '@/api/visitServicesApi'
import { getVisitById, updateVisit } from '@/api/visitsApi'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.userRole === 'admin')

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const payments = ref([])
const loading = ref(false)
const services = ref([])
const servicesLoading = ref(false)
const { t } = useI18n()
const toast = useToast()
const showPaymentModal = ref(false)
const isEditing = ref(false)
const visitPreview = ref(null)
const visitPreviewLoading = ref(false)

const form = ref({
  id: null,
  visit_id: '',
  amount: '',
  payment_type: 'payment',
  method: 'cash',
  note: '',
  paid_at: ''
})

const totalPayments = computed(() =>
  payments.value.reduce((sum, entry) => sum + (entry.payment_type === 'payment' ? Number(entry.amount) || 0 : 0), 0)
)

const totalRefunds = computed(() =>
  payments.value.reduce((sum, entry) => sum + (entry.payment_type === 'refund' ? Number(entry.amount) || 0 : 0), 0)
)

const netIncome = computed(() =>
  payments.value.reduce((sum, entry) => {
    const amount = Number(entry.amount) || 0
    return sum + (entry.payment_type === 'refund' ? -amount : amount)
  }, 0)
)

const totalServices = computed(() =>
  services.value.reduce((sum, entry) => sum + (Number(entry.price) || 0), 0)
)

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const getTypeLabel = (type) => {
  if (type === 'refund') return t('patientPayments.typeRefund')
  if (type === 'adjustment') return t('patientPayments.typeAdjustment')
  return t('patientPayments.typePayment')
}

const getTypeClass = (type) => {
  if (type === 'refund') return 'text-rose-600 font-medium'
  if (type === 'adjustment') return 'text-amber-600 font-medium'
  return 'text-emerald-600 font-medium'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const loadPayments = async () => {
  loading.value = true
  try {
    payments.value = await getPaymentsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load payments:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  servicesLoading.value = true
  try {
    services.value = await getVisitServicesByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visit services:', error)
    services.value = []
  } finally {
    servicesLoading.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadPayments(), loadServices()])
}

onMounted(loadAll)
watch(() => props.patientId, loadAll)

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    id: null,
    visit_id: '',
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
  if (!Number.isFinite(visitId)) {
    toast.error(t('patientPayments.errorVisitRequired'))
    return
  }
  const amount = Number(form.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    toast.error(t('patientPayments.errorAmountRequired'))
    return
  }
  const payload = {
    visit_id: visitId,
    patient_id: Number(props.patientId),
    amount,
    payment_type: form.value.payment_type,
    method: form.value.method || null,
    note: form.value.note || null,
    paid_at: form.value.paid_at ? new Date(form.value.paid_at).toISOString() : null
  }

  try {
    if (isEditing.value && form.value.id) {
      await updatePayment(form.value.id, payload)
      toast.success(t('patientPayments.toastUpdated'))
    } else {
      await createPayment(payload)
      toast.success(t('patientPayments.toastCreated'))
    }
    await loadPayments()
    await syncVisitStatusIfFullyPaid(visitId)
    closeModal()
  } catch (error) {
    console.error('Failed to save payment:', error)
    toast.error(t('patientPayments.errorSave'))
  }
}

// To'lov to'liq bo'lsa visitni "To'liq yakunlangan" qilish (faqat admin to'lov qilgach)
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
  const confirmed = window.confirm(t('patientPayments.confirmDelete'))
  if (!confirmed) return
  try {
    await deletePayment(payment.id)
    toast.success(t('patientPayments.toastDeleted'))
    await loadPayments()
  } catch (error) {
    console.error('Failed to delete payment:', error)
    toast.error(t('patientPayments.errorDelete'))
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
    if (newValue === '') {
      visitPreview.value = null
      return
    }
    const visitId = Number(newValue)
    loadVisitPreview(visitId)
  }
)
</script>
