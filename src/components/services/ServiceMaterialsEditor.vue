<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-sm font-semibold text-gray-800">{{ t('services.materialsRecipe') }}</h4>
      <span
        v-if="marginInfo"
        class="text-xs font-semibold px-2 py-1 rounded-full"
        :class="marginBadgeClass"
      >
        {{ t('services.margin') }}: {{ formatCurrency(marginInfo.margin) }}
        ({{ Math.round(marginInfo.marginPercent) }}%)
      </span>
    </div>
    <p class="text-xs text-slate-500">{{ t('services.materialsRecipeHint') }}</p>

    <div v-for="(row, idx) in localItems" :key="idx" class="flex flex-wrap gap-2 items-end">
      <div class="flex-1 min-w-[140px]">
        <select v-model="row.inventory_item_id" class="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
          <option value="">{{ t('odontogram.selectMaterial') }}</option>
          <option v-for="item in inventoryItems" :key="item.id" :value="String(item.id)">
            {{ item.name }} ({{ item.current_stock ?? 0 }} {{ item.unit || '' }})
          </option>
        </select>
      </div>
      <input v-model.number="row.quantity" type="number" min="0.01" step="any" class="w-24 rounded-lg border border-gray-200 px-2 py-2 text-sm" :placeholder="t('services.quantity')" />
      <button type="button" class="text-rose-500 px-2 py-2" @click="localItems.splice(idx, 1)">×</button>
    </div>
    <button type="button" class="text-sm text-primary-600 font-medium" @click="addRow">
      + {{ t('services.addMaterialRow') }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { computeServiceMargin } from '@/api/serviceMaterialsApi'

const props = defineProps({
  inventoryItems: { type: Array, default: () => [] },
  materials: { type: Array, default: () => [] },
  basePrice: { type: [Number, String], default: 0 },
})

const { t } = useI18n()
const localItems = ref([])

watch(() => props.materials, (rows) => {
  localItems.value = (rows || []).map((r) => ({
    inventory_item_id: String(r.inventory_item_id),
    quantity: Number(r.quantity) || 1,
    unit: r.unit || '',
    notes: r.notes || '',
  }))
  if (!localItems.value.length) localItems.value = []
}, { immediate: true })

const materialCost = computed(() => {
  let sum = 0
  for (const row of localItems.value) {
    const item = props.inventoryItems.find((i) => String(i.id) === String(row.inventory_item_id))
    if (!item) continue
    const cost = Number(item.cost_price) || 0
    const qty = Number(row.quantity) || 0
    sum += cost * qty
  }
  return sum
})

const marginInfo = computed(() => computeServiceMargin(props.basePrice, materialCost.value))

const marginBadgeClass = computed(() => {
  const s = marginInfo.value?.status
  if (s === 'critical') return 'bg-red-100 text-red-700'
  if (s === 'low') return 'bg-amber-100 text-amber-800'
  return 'bg-emerald-100 text-emerald-700'
})

function addRow() {
  localItems.value.push({ inventory_item_id: '', quantity: 1 })
}

function getPayload() {
  return localItems.value
    .filter((r) => r.inventory_item_id && Number(r.quantity) > 0)
    .map((r) => ({
      inventory_item_id: Number(r.inventory_item_id),
      quantity: Number(r.quantity),
      unit: r.unit || null,
      notes: r.notes || null,
    }))
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 })
    .format(amount || 0).replace('UZS', t('common.currencySuffix'))
}

defineExpose({ getPayload })
</script>
