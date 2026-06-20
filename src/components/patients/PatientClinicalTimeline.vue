<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="groupedEvents.length === 0" class="text-center py-12 text-sm text-gray-500">
      Klinik tarix hozircha bo'sh
    </div>

    <div v-else class="relative">
      <div
        v-for="group in groupedEvents"
        :key="group.date"
        class="mb-8 last:mb-0"
      >
        <div class="sticky top-0 z-10 mb-3">
          <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {{ formatDateLabel(group.date) }}
          </span>
        </div>

        <ol class="relative border-l border-slate-200 ml-3 space-y-4">
          <li
            v-for="event in group.items"
            :key="event.id"
            class="relative pl-6"
          >
            <span
              class="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-white"
              :class="dotClass(event.type)"
            ></span>

            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      :class="badgeClass(event.type)"
                    >
                      {{ typeLabel(event.type) }}
                    </span>
                    <span class="text-xs text-slate-400">{{ formatTimeLabel(event.ts) }}</span>
                  </div>
                  <p class="mt-1 text-sm font-semibold text-slate-900">{{ event.title }}</p>
                  <p v-if="event.subtitle" class="mt-0.5 text-xs text-slate-500">{{ event.subtitle }}</p>
                </div>

                <div v-if="event.type === 'payment'" class="text-right flex-shrink-0">
                  <p
                    class="text-sm font-bold"
                    :class="event.meta.paymentType === 'refund' ? 'text-rose-600' : 'text-emerald-600'"
                  >
                    {{ event.meta.paymentType === 'refund' ? '−' : '+' }}{{ formatMoney(event.meta.amount) }}
                  </p>
                </div>

                <div v-else-if="event.meta?.debt > 0" class="text-right flex-shrink-0">
                  <p class="text-xs text-rose-600 font-medium">Qarz: {{ formatMoney(event.meta.debt) }}</p>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { getVisitsByPatientId } from '@/api/visitsApi'
import { getPaymentsByPatientId } from '@/api/paymentsApi'
import { getOdontogramsByPatientId } from '@/api/odontogramApi'
import {
  buildPatientClinicalTimeline,
  groupTimelineByDate,
  formatTimelineDate,
  formatTimelineTime,
} from '@/lib/patientTimeline'

const props = defineProps({
  patientId: { type: [Number, String], required: true },
  patientName: { type: String, default: '' },
})

const loading = ref(false)
const events = ref([])

const groupedEvents = computed(() => groupTimelineByDate(events.value))

const formatDateLabel = (dateStr) => formatTimelineDate(dateStr)
const formatTimeLabel = (ts) => formatTimelineTime(ts)

const formatMoney = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0) + " so'm"
}

const typeLabel = (type) => {
  if (type === 'visit') return 'Tashrif'
  if (type === 'payment') return "To'lov"
  if (type === 'odontogram') return 'Odontogramma'
  return type
}

const dotClass = (type) => {
  if (type === 'visit') return 'bg-blue-500'
  if (type === 'payment') return 'bg-emerald-500'
  if (type === 'odontogram') return 'bg-violet-500'
  return 'bg-slate-400'
}

const badgeClass = (type) => {
  if (type === 'visit') return 'bg-blue-50 text-blue-700'
  if (type === 'payment') return 'bg-emerald-50 text-emerald-700'
  if (type === 'odontogram') return 'bg-violet-50 text-violet-700'
  return 'bg-slate-50 text-slate-600'
}

const loadTimeline = async () => {
  const pid = Number(props.patientId)
  if (!Number.isFinite(pid)) {
    events.value = []
    return
  }

  loading.value = true
  try {
    const [visits, payments, odontograms] = await Promise.all([
      getVisitsByPatientId(pid).catch(() => []),
      getPaymentsByPatientId(pid).catch(() => []),
      getOdontogramsByPatientId(pid).catch(() => []),
    ])

    events.value = buildPatientClinicalTimeline({
      visits: visits || [],
      payments: payments || [],
      odontograms: odontograms || [],
      patientName: props.patientName,
    })
  } catch (err) {
    console.error('Timeline load failed:', err)
    events.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.patientId,
  () => loadTimeline(),
  { immediate: true }
)
</script>
