<template>
  <section class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
    <div class="border-b border-slate-100 px-4 py-3">
      <h2 class="text-base font-semibold text-slate-900">{{ t('reports.weekTable') }}</h2>
    </div>

    <div v-if="loading" class="px-4 py-8 text-center text-sm text-slate-500">
      {{ t('reports.loading') }}
    </div>

    <div v-else-if="!rows.length" class="px-4 py-8 text-center text-sm text-slate-500">
      {{ t('reports.noWeekData') }}
    </div>

    <div v-else class="divide-y divide-slate-100">
      <div class="grid grid-cols-[1.2fr_0.8fr_1.2fr] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span>{{ t('reports.colDay') }}</span>
        <span class="text-right">{{ t('reports.colPatients') }}</span>
        <span class="text-right">{{ t('reports.colMoney') }}</span>
      </div>
      <div
        v-for="row in rows"
        :key="row.date"
        class="grid grid-cols-[1.2fr_0.8fr_1.2fr] items-center gap-3 px-4 py-3"
      >
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-800">{{ row.label }}</p>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100">
            <div
              class="h-full rounded-full bg-sky-400"
              :style="{ width: barWidth(row) }"
            />
          </div>
        </div>
        <p class="text-right text-sm font-medium text-slate-600">{{ row.patients }}</p>
        <p class="text-right text-sm font-bold text-slate-900">{{ formatCurrency(row.revenue) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const { t } = useI18n()

const formatCurrency = (amount) =>
  new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0) + " so'm"

const barWidth = (row) => {
  const amount = Number(row.revenue) || 0
  const patients = Number(row.patients) || 0
  const value = amount > 0 ? amount : patients
  if (value <= 0) return '0%'
  const peak = amount > 0
    ? Math.max(1, ...props.rows.map((r) => Number(r.revenue) || 0))
    : Math.max(1, ...props.rows.map((r) => Number(r.patients) || 0))
  return `${Math.max(8, Math.round((value / peak) * 100))}%`
}
</script>
