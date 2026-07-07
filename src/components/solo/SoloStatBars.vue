<template>
  <div class="space-y-2.5">
    <div
      v-for="row in items"
      :key="row.date || row.label"
      class="flex items-center gap-3"
    >
      <span class="w-14 shrink-0 text-xs text-gray-500">{{ row.label }}</span>
      <div class="flex-1 h-7 rounded-lg bg-gray-100 overflow-hidden">
        <div
          class="h-full rounded-lg transition-all duration-500"
          :class="barClass"
          :style="{ width: widthFor(row.value) }"
        />
      </div>
      <span class="w-20 shrink-0 text-right text-xs font-semibold text-gray-800">
        {{ format(row.value) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  valueKey: { type: String, default: 'value' },
  variant: { type: String, default: 'primary' },
  formatValue: { type: Function, default: null },
})

const maxValue = computed(() => {
  const vals = props.items.map((r) => Number(r[props.valueKey] ?? r.value) || 0)
  return Math.max(1, ...vals)
})

const barClass = computed(() =>
  props.variant === 'revenue' ? 'bg-emerald-500' : 'bg-primary-500'
)

const widthFor = (val) => {
  const n = Number(val) || 0
  const pct = Math.round((n / maxValue.value) * 100)
  return `${Math.max(n > 0 ? 8 : 0, pct)}%`
}

const format = (val) => {
  if (props.formatValue) return props.formatValue(val)
  return String(val ?? 0)
}
</script>
