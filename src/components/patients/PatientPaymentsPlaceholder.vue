<template>
  <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Jami to'lovlar</p>
        <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalPayments) }}</p>
      </div>
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Qaytarimlar</p>
        <p class="mt-2 text-lg font-semibold text-rose-600">{{ formatCurrency(totalRefunds) }}</p>
      </div>
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Sof daromad</p>
        <p class="mt-2 text-lg font-semibold text-emerald-600">{{ formatCurrency(netIncome) }}</p>
      </div>
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Jami xizmat narxi</p>
        <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalServices) }}</p>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Sana</th>
            <th class="px-4 py-3">Turi</th>
            <th class="px-4 py-3">Miqdor</th>
            <th class="px-4 py-3">Usul</th>
            <th class="px-4 py-3">Izoh</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td class="px-4 py-4 text-slate-500" colspan="5">Yuklanmoqda...</td>
          </tr>
          <tr v-else-if="payments.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="5">To'lovlar topilmadi.</td>
          </tr>
          <tr v-for="entry in payments" :key="entry.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.paid_at) }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Bajarilgan ishlar</th>
            <th class="px-4 py-3">Tish</th>
            <th class="px-4 py-3">Narx</th>
            <th class="px-4 py-3">Doktor</th>
            <th class="px-4 py-3">Sana</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="servicesLoading">
            <td class="px-4 py-4 text-slate-500" colspan="5">Yuklanmoqda...</td>
          </tr>
          <tr v-else-if="services.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="5">Bajarilgan ishlar topilmadi.</td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getPaymentsByPatientId } from '@/api/paymentsApi'
import { getVisitServicesByPatientId } from '@/api/visitServicesApi'

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
  }).format(amount).replace('UZS', 'so\'m')
}

const getTypeLabel = (type) => {
  if (type === 'refund') return 'Qaytarim'
  if (type === 'adjustment') return 'Tuzatma'
  return 'To\'lov'
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
</script>
