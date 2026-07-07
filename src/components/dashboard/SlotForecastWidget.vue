<template>
  <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-900">{{ t('slotForecast.title') }}</h3>
        <p class="text-xs text-gray-500 mt-0.5">{{ t('slotForecast.subtitle') }}</p>
      </div>
      <SparklesIcon class="w-5 h-5 text-violet-500 shrink-0" />
    </div>

    <div v-if="loading" class="py-6 text-center text-sm text-gray-500">{{ t('slotForecast.loading') }}</div>
    <template v-else-if="report">
      <p class="text-xs text-gray-500 mb-3">
        {{ t('slotForecast.noShowRate', { rate: report.noShowRate, count: report.noShowCount }) }}
      </p>

      <div v-if="report.bestSlots?.length" class="mb-4">
        <p class="text-xs font-medium text-emerald-800 mb-2">{{ t('slotForecast.bestSlots') }}</p>
        <ul class="space-y-1">
          <li
            v-for="slot in report.bestSlots"
            :key="slot.label"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-700">{{ slot.label }}</span>
            <span class="text-emerald-600 font-medium">{{ slot.rate }}%</span>
          </li>
        </ul>
      </div>

      <div v-if="report.riskySlots?.length">
        <p class="text-xs font-medium text-rose-800 mb-2">{{ t('slotForecast.riskySlots') }}</p>
        <ul class="space-y-1">
          <li
            v-for="slot in report.riskySlots"
            :key="slot.label"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-700">{{ slot.label }}</span>
            <span class="text-rose-600 font-medium">{{ slot.rate }}%</span>
          </li>
        </ul>
      </div>

      <p v-if="!report.bestSlots?.length && !report.riskySlots?.length" class="text-sm text-gray-500">
        {{ t('slotForecast.noData') }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import { getSlotForecastReport } from '@/api/slotForecastApi'

const { t } = useI18n()
const loading = ref(true)
const report = ref(null)

onMounted(async () => {
  try {
    report.value = await getSlotForecastReport({ days: 90 })
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
})
</script>
