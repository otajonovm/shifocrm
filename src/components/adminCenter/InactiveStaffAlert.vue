<template>
  <div
    v-if="staff.length"
    class="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <ExclamationTriangleIcon class="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold text-rose-900">
          {{ t('managementCenter.inactiveAlertTitle') }}
        </h3>
        <p class="mt-1 text-sm text-rose-800">
          {{ t('managementCenter.inactiveAlertSubtitle', { count: staff.length }) }}
        </p>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="row in staff"
            :key="row.employeeId"
            class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rose-900"
          >
            <span class="font-medium">{{ row.fullName }}</span>
            <span class="text-rose-700">·</span>
            <span class="text-rose-700">{{ roleLabel(row.role) }}</span>
            <span class="text-rose-600 text-xs">
              ({{ inactiveLabel(row) }})
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { actorRoleLabel } from '@/lib/activityLog'

defineProps({
  staff: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

const ROLE_MAP = {
  doctor: 'doctor',
  administrator: 'admin',
}

const roleLabel = (role) => {
  const mapped = ROLE_MAP[String(role || '').toLowerCase()] || role
  return actorRoleLabel(mapped)
}

const inactiveLabel = (row) => {
  if (row.daysInactive === null) {
    return t('managementCenter.neverActive')
  }
  return t('managementCenter.inactiveDays', { days: row.daysInactive })
}
</script>
