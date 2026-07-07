<template>
  <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3 w-10">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </th>
            <th class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('dataImport.colName') }}</th>
            <th class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('dataImport.colPhone') }}</th>
            <th class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('dataImport.colNotes') }}</th>
            <th class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('dataImport.colTeeth') }}</th>
            <th class="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('dataImport.colStatus') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="(row, idx) in rows"
            :key="idx"
            class="hover:bg-gray-50/50"
            :class="row.duplicate ? 'bg-amber-50/40' : ''"
          >
            <td class="px-3 py-2">
              <input
                v-model="row.selected"
                type="checkbox"
                :disabled="row.duplicate"
              />
            </td>
            <td class="px-3 py-2">
              <input
                v-model="row.full_name"
                type="text"
                class="w-full min-w-[120px] rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </td>
            <td class="px-3 py-2">
              <input
                v-model="row.phone"
                type="text"
                class="w-full min-w-[130px] rounded border border-gray-200 px-2 py-1 text-sm font-mono"
              />
            </td>
            <td class="px-3 py-2">
              <input
                v-model="row.notes"
                type="text"
                class="w-full min-w-[100px] rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </td>
            <td class="px-3 py-2 text-xs text-gray-600">
              {{ (row.tooth_notes || []).length || '—' }}
            </td>
            <td class="px-3 py-2">
              <span
                v-if="row.duplicate"
                class="inline-flex px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800"
              >
                {{ row.duplicateReason === 'existing_patient' ? t('dataImport.dupExisting') : t('dataImport.dupBatch') }}
              </span>
              <span
                v-else-if="row.confidence != null && row.confidence < 0.6"
                class="inline-flex px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-800"
              >
                AI {{ Math.round(row.confidence * 100) }}%
              </span>
              <span v-else class="text-emerald-600 text-xs">{{ t('dataImport.ok') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const rows = defineModel('rows', { type: Array, default: () => [] })

const { t } = useI18n()

const allSelected = computed(() => {
  const eligible = rows.value.filter((r) => !r.duplicate)
  return eligible.length > 0 && eligible.every((r) => r.selected)
})

const toggleAll = (event) => {
  const checked = event.target.checked
  rows.value.forEach((r) => {
    if (!r.duplicate) r.selected = checked
  })
}
</script>
