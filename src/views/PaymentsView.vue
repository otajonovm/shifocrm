<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">To'lovlar</h1>
          <p class="text-gray-500">Moliyaviy hisobotlar va to'lovlar</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
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
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">To'lovlar ro'yxati</h2>
            <p class="text-sm text-gray-500">Oxirgi to'lovlar va qaytarimlar</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-6 py-3">Sana</th>
                <th class="px-6 py-3">Bemor ID</th>
                <th class="px-6 py-3">Tashrif ID</th>
                <th class="px-6 py-3">Turi</th>
                <th class="px-6 py-3">Miqdor</th>
                <th class="px-6 py-3">Usul</th>
                <th class="px-6 py-3">Izoh</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td class="px-6 py-4 text-gray-500" colspan="7">Yuklanmoqda...</td>
              </tr>
              <tr v-else-if="payments.length === 0">
                <td class="px-6 py-4 text-gray-500" colspan="7">To'lovlar topilmadi.</td>
              </tr>
              <tr v-for="payment in payments" :key="payment.id" class="bg-white">
                <td class="px-6 py-4 text-gray-700">{{ formatDate(payment.paid_at) }}</td>
                <td class="px-6 py-4 text-gray-700">#{{ payment.patient_id }}</td>
                <td class="px-6 py-4 text-gray-700">#{{ payment.visit_id }}</td>
                <td class="px-6 py-4">
                  <span :class="getTypeClass(payment.payment_type)">
                    {{ getTypeLabel(payment.payment_type) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-700">{{ formatCurrency(payment.amount) }}</td>
                <td class="px-6 py-4 text-gray-700">{{ payment.method || '-' }}</td>
                <td class="px-6 py-4 text-gray-700">{{ payment.note || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { listPayments } from '@/api/paymentsApi'

const payments = ref([])
const loading = ref(false)

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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', 'so\'m')
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
    payments.value = await listPayments('order=paid_at.desc')
  } catch (error) {
    console.error('Failed to load payments:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadPayments)
</script>
