<template>
  <MainLayout>
    <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('audit.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t('audit.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadLogs"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors touch-target"
            :disabled="loading"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            {{ t('audit.refresh') }}
          </button>
          <button
            v-if="canExport"
            @click="exportExcel"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors touch-target"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            {{ t('reports.exportExcel') }}
          </button>
        </div>
      </div>

      <!-- Read-only banner -->
      <div class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <LockClosedIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('audit.readOnlyNote') }}</span>
      </div>

      <!-- Filters -->
      <div class="mobile-card">
        <div class="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ t('audit.filterAction') }}</label>
            <select v-model="actionFilter" class="mobile-input w-full">
              <option value="all">{{ t('audit.allActions') }}</option>
              <option value="payment">{{ t('audit.catPayment') }}</option>
              <option value="service">{{ t('audit.catService') }}</option>
              <option value="employee">{{ t('audit.catEmployee') }}</option>
              <option value="visit">{{ t('audit.catVisit') }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ t('audit.search') }}</label>
            <input
              v-model="searchQuery"
              type="text"
              class="mobile-input w-full"
              :placeholder="t('audit.searchPlaceholder')"
            />
          </div>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">
            {{ t('audit.recordsTitle') }}
            <span class="ml-1 text-gray-400 font-normal">({{ filteredLogs.length }})</span>
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('audit.colDate') }}</th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('audit.colActor') }}</th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('audit.colAction') }}</th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('audit.colDetails') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loading">
                <td class="px-4 sm:px-6 py-6 text-center text-gray-500" colspan="4">{{ t('audit.loading') }}</td>
              </tr>
              <tr v-else-if="filteredLogs.length === 0">
                <td class="px-4 sm:px-6 py-6 text-center text-gray-500" colspan="4">{{ t('audit.noData') }}</td>
              </tr>
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{{ log.dateLabel }}</td>
                <td class="px-4 sm:px-6 py-4">
                  <div class="font-medium text-gray-900">{{ log.actorName }}</div>
                  <div class="text-xs text-gray-400">{{ log.actorRoleLabel }}</div>
                </td>
                <td class="px-4 sm:px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-medium" :class="log.badgeClass">
                    {{ log.actionLabel }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-gray-700 max-w-md">{{ log.summary }}</td>
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
import { useI18n } from 'vue-i18n'
import { ArrowPathIcon, ArrowDownTrayIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { listActivityLogs } from '@/api/activityLogsApi'
import { actorRoleLabel } from '@/lib/activityLog'
import { useDataPermission } from '@/composables/useDataPermission'
import { exportToCsv } from '@/lib/exportData'

const { t } = useI18n()
const toast = useToast()

const { allowed: canExport } = useDataPermission('can_export_data')

const logs = ref([])
const loading = ref(false)
const actionFilter = ref('all')
const searchQuery = ref('')

const ACTION_LABELS = {
  'payment.create': "To'lov qo'shildi",
  'payment.update': "To'lov tahrirlandi",
  'payment.delete': "To'lov o'chirildi",
  'service.create': "Xizmat qo'shildi",
  'service.update': "Xizmat narxi o'zgartirildi",
  'service.delete': "Xizmat o'chirildi",
  'employee.create': "Xodim qo'shildi",
  'employee.update': "Xodim tahrirlandi",
  'employee.delete': "Xodim o'chirildi",
  'visit.delete': "Tashrif o'chirildi",
}

const ACTION_BADGES = {
  create: 'text-emerald-700 bg-emerald-50',
  update: 'text-amber-700 bg-amber-50',
  delete: 'text-rose-700 bg-rose-50',
}

const resolveActionLabel = (action) => {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  return action || "Noma'lum amal"
}

const resolveBadgeClass = (action) => {
  const a = String(action || '')
  if (a.endsWith('.delete') || a.includes('DELETE')) return ACTION_BADGES.delete
  if (a.endsWith('.update') || a.includes('UPDATE')) return ACTION_BADGES.update
  if (a.endsWith('.create') || a.includes('INSERT')) return ACTION_BADGES.create
  return 'text-gray-700 bg-gray-50'
}

const resolveSummary = (log) => {
  const d = log.details || {}
  if (d.summary) return d.summary
  // Trigger orqali yozilgan eski yozuvlar uchun zaxira matn
  try {
    const meta = d.meta || d.new || d.old
    if (meta) return JSON.stringify(meta).slice(0, 200)
  } catch {
    // ignore
  }
  return '—'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const normalizedLogs = computed(() =>
  logs.value.map((log) => {
    const d = log.details || {}
    return {
      id: log.id,
      raw: log,
      dateLabel: formatDate(log.created_at),
      createdAt: log.created_at,
      actorName: d.actor_name || "Noma'lum",
      actorRole: d.actor_role || null,
      actorRoleLabel: actorRoleLabel(d.actor_role),
      action: log.action,
      actionLabel: resolveActionLabel(log.action),
      badgeClass: resolveBadgeClass(log.action),
      summary: resolveSummary(log),
    }
  })
)

const filteredLogs = computed(() => {
  let list = normalizedLogs.value
  if (actionFilter.value !== 'all') {
    list = list.filter((l) => String(l.action || '').startsWith(actionFilter.value))
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (l) =>
        l.actorName.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.actionLabel.toLowerCase().includes(q)
    )
  }
  return list
})

const exportExcel = () => {
  if (!canExport.value) {
    toast.error("Sizda ma'lumotlarni eksport qilish huquqi yo'q.")
    return
  }
  try {
    if (!filteredLogs.value.length) {
      toast.error(t('audit.noData'))
      return
    }
    exportToCsv(
      'audit_jurnali',
      [
        { key: 'dateLabel', label: t('audit.colDate') },
        { key: 'actorName', label: t('audit.colActor') },
        { key: 'actorRoleLabel', label: 'Rol' },
        { key: 'actionLabel', label: t('audit.colAction') },
        { key: 'summary', label: t('audit.colDetails') },
      ],
      filteredLogs.value
    )
    toast.success('Excel fayl yuklab olindi')
  } catch (error) {
    console.error('Audit export failed:', error)
    toast.error('Eksport qilishda xatolik yuz berdi')
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    logs.value = await listActivityLogs({ limit: 300 })
  } catch (error) {
    console.error('Failed to load audit logs:', error)
    toast.error(t('audit.errorLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
</script>
