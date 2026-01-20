<template>
  <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Jami xizmat narxi</p>
        <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatCurrency(totalBill) }}</p>
      </div>
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Bajarilgan ishlar</p>
        <p class="mt-2 text-lg font-semibold text-emerald-600">{{ history.length }}</p>
      </div>
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p class="text-xs text-slate-500">Oxirgi yozuv</p>
        <p class="mt-2 text-lg font-semibold text-slate-700">{{ lastEntryLabel }}</p>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Tish raqami</th>
            <th class="px-4 py-3">Xizmat nomi</th>
            <th class="px-4 py-3">Narxi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="history.length === 0">
            <td class="px-4 py-4 text-slate-500" colspan="3">To'lovlar topilmadi.</td>
          </tr>
          <tr v-for="entry in history" :key="entry.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">#{{ entry.toothId }}</td>
            <td class="px-4 py-3 text-slate-700">
              {{ entry.serviceName }}
              <div class="text-xs text-slate-400">{{ entry.performedBy }}</div>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ formatCurrency(entry.price) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  }
})

const history = ref([])

const totalBill = computed(() =>
  history.value.reduce((sum, entry) => sum + (Number(entry.price) || 0), 0)
)

const lastEntryLabel = computed(() => {
  if (history.value.length === 0) return '-'
  return history.value[0].serviceName || '-'
})

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', 'so\'m')
}

const historyStorageKey = computed(() => `patient-history-${props.patientId}`)

const loadHistory = () => {
  const raw = localStorage.getItem(historyStorageKey.value)
  history.value = raw ? JSON.parse(raw) : []
}

onMounted(loadHistory)
watch(() => props.patientId, loadHistory)
</script>
