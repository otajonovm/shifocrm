<template>
  <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-gray-100 sm:px-6">
      <h2 class="text-base font-semibold text-gray-900">{{ t('managementCenter.staffActivityTitle') }}</h2>
      <p class="mt-0.5 text-sm text-gray-500">{{ t('managementCenter.staffActivitySubtitle') }}</p>
    </div>

    <div v-if="loading" class="px-6 py-12 text-center text-sm text-gray-500">
      {{ t('managementCenter.loading') }}
    </div>

    <div v-else-if="!rows.length" class="px-6 py-12 text-center text-sm text-gray-500">
      {{ t('managementCenter.noStaff') }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-100">
        <thead class="bg-gray-50/80">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">{{ t('managementCenter.colName') }}</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('managementCenter.colRole') }}</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('managementCenter.colLastActivity') }}</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('managementCenter.colOpenedToday') }}</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">{{ t('managementCenter.colUpdatedToday') }}</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">{{ t('managementCenter.colStatus') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="row in rows"
            :key="row.employeeId"
            class="hover:bg-gray-50/60 transition-colors"
            :class="row.isInactive ? 'bg-rose-50/30' : ''"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-900 sm:px-6">{{ row.fullName }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ roleLabel(row.role) }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ formatLastActivity(row.lastActivityAt) }}</td>
            <td class="px-4 py-3 text-sm text-center text-gray-900 font-medium">{{ row.patientViewsToday }}</td>
            <td class="px-4 py-3 text-sm text-center text-gray-900 font-medium">{{ row.patientUpdatesToday }}</td>
            <td class="px-4 py-3 text-right sm:px-6">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="row.isInactive ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'"
              >
                {{ row.isInactive ? t('managementCenter.statusInactive') : t('managementCenter.statusActive') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { actorRoleLabel } from '@/lib/activityLog'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const { t, locale } = useI18n()

const ROLE_MAP = {
  doctor: 'doctor',
  administrator: 'admin',
}

const roleLabel = (role) => {
  const mapped = ROLE_MAP[String(role || '').toLowerCase()] || role
  return actorRoleLabel(mapped)
}

const formatLastActivity = (iso) => {
  if (!iso) return t('managementCenter.neverActive')
  const d = new Date(iso)
  return d.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
