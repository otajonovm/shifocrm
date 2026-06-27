<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200">
    <table class="min-w-full divide-y divide-slate-200 text-sm">
      <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
        <tr>
          <th class="px-4 py-3">{{ t('services.auditService') }}</th>
          <th class="px-4 py-3">{{ t('services.auditOldPrice') }}</th>
          <th class="px-4 py-3">{{ t('services.auditNewPrice') }}</th>
          <th class="px-4 py-3">{{ t('services.auditChangedAt') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-if="loading">
          <td colspan="4" class="px-4 py-6 text-slate-500 text-center">{{ t('services.loading') }}</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td colspan="4" class="px-4 py-6 text-slate-500 text-center">{{ t('services.noAudit') }}</td>
        </tr>
        <tr v-for="row in rows" :key="row.id" class="bg-white">
          <td class="px-4 py-3 text-slate-800">{{ row.service_name || '—' }}</td>
          <td class="px-4 py-3 text-slate-600">{{ formatCurrency(row.old_price) }}</td>
          <td class="px-4 py-3 text-slate-800 font-medium">{{ formatCurrency(row.new_price) }}</td>
          <td class="px-4 py-3 text-slate-500 text-xs">{{ formatDate(row.changed_at || row.created_at) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listServicePriceAudit } from '@/api/servicesApi'
import { formatDateTime } from '@/lib/date'

const { t } = useI18n()
const loading = ref(false)
const rows = ref([])

const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 })
    .format(amount).replace('UZS', t('common.currencySuffix'))
}

const formatDate = (d) => (d ? formatDateTime(d) : '—')

async function load() {
  loading.value = true
  try {
    rows.value = await listServicePriceAudit('order=changed_at.desc&limit=100')
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
defineExpose({ reload: load })
</script>
