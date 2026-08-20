<template>
  <section
    ref="gridRef"
    class="rounded-2xl border border-slate-200 bg-white shadow-sm"
    aria-labelledby="odontogram-grid-title"
    @keydown="handleGridKeydown"
  >
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <h3 id="odontogram-grid-title" class="text-sm font-semibold text-slate-900">
          {{ t('odontogram.clinicalChart') }}
        </h3>
        <p class="mt-0.5 text-xs text-slate-500">{{ t('odontogram.selectToothHint') }}</p>
      </div>
      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">FDI</span>
    </div>

    <div class="p-3 sm:p-5">
      <div v-if="!isDesktop" class="md:hidden">
        <div class="grid grid-cols-2 gap-2" role="tablist" :aria-label="t('odontogram.quadrants')">
          <button
            v-for="quadrant in quadrants"
            :key="quadrant.id"
            type="button"
            role="tab"
            :aria-selected="activeQuadrant === quadrant.id"
            class="min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors"
            :class="activeQuadrant === quadrant.id
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-slate-200 bg-white text-slate-600'"
            @click="activeQuadrant = quadrant.id"
          >
            <span class="block">{{ t(quadrant.labelKey) }}</span>
            <span class="mt-0.5 block text-[10px] font-normal opacity-70">{{ quadrant.range }}</span>
          </button>
        </div>

        <div
          class="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-2"
          role="tabpanel"
        >
          <div class="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-slate-500">
            <span>{{ activeQuadrantData.sideStart }}</span>
            <span>{{ t('odontogram.midline') }}</span>
          </div>
          <div class="grid grid-cols-8 items-start gap-0.5">
            <Tooth
              v-for="id in activeQuadrantData.teeth"
              :key="id"
              :id="id"
              :status="statusMap[id]"
              :service-color="serviceColorMap[id]"
              :service-label="serviceLabelMap[id]"
              :selected="selectedToothId === id"
              :disabled="disabled"
              @select="$emit('select', $event)"
            />
          </div>
        </div>
      </div>

      <div v-else class="hidden md:block">
        <div class="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{{ t('odontogram.patientRight') }}</span>
          <span>{{ t('odontogram.patientLeft') }}</span>
        </div>
        <div class="relative space-y-5 rounded-2xl bg-slate-50/70 p-4 lg:p-6">
          <div class="pointer-events-none absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-slate-300"></div>
          <div class="pointer-events-none absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-slate-300"></div>

          <div v-for="jaw in desktopJaws" :key="jaw.id" class="grid grid-cols-2 gap-7">
            <div class="flex justify-end gap-1 lg:gap-2">
              <Tooth
                v-for="id in jaw.right"
                :key="id"
                :id="id"
                :status="statusMap[id]"
                :service-color="serviceColorMap[id]"
                :service-label="serviceLabelMap[id]"
                :selected="selectedToothId === id"
                :disabled="disabled"
                @select="$emit('select', $event)"
              />
            </div>
            <div class="flex justify-start gap-1 lg:gap-2">
              <Tooth
                v-for="id in jaw.left"
                :key="id"
                :id="id"
                :status="statusMap[id]"
                :service-color="serviceColorMap[id]"
                :service-label="serviceLabelMap[id]"
                :selected="selectedToothId === id"
                :disabled="disabled"
                @select="$emit('select', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PERMANENT_QUADRANTS } from '@/domain/odontogram'
import Tooth from './Tooth.vue'

defineProps({
  statusMap: {
    type: Object,
    default: () => ({}),
  },
  serviceColorMap: {
    type: Object,
    default: () => ({}),
  },
  serviceLabelMap: {
    type: Object,
    default: () => ({}),
  },
  selectedToothId: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const { t } = useI18n()
const gridRef = ref(null)
const activeQuadrant = ref('upper-right')
const isDesktop = ref(
  typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
)

let desktopMedia = null
const onDesktopMediaChange = (event) => {
  isDesktop.value = event.matches
}

onMounted(() => {
  desktopMedia = window.matchMedia('(min-width: 768px)')
  isDesktop.value = desktopMedia.matches
  desktopMedia.addEventListener('change', onDesktopMediaChange)
})

onBeforeUnmount(() => {
  desktopMedia?.removeEventListener('change', onDesktopMediaChange)
})

const quadrants = [
  {
    id: 'upper-right',
    labelKey: 'odontogram.upperRight',
    teeth: PERMANENT_QUADRANTS.upperRight,
    range: '18–11',
    sideStart: '18',
  },
  {
    id: 'upper-left',
    labelKey: 'odontogram.upperLeft',
    teeth: PERMANENT_QUADRANTS.upperLeft,
    range: '21–28',
    sideStart: '28',
  },
  {
    id: 'lower-right',
    labelKey: 'odontogram.lowerRight',
    teeth: PERMANENT_QUADRANTS.lowerRight,
    range: '48–41',
    sideStart: '48',
  },
  {
    id: 'lower-left',
    labelKey: 'odontogram.lowerLeft',
    teeth: PERMANENT_QUADRANTS.lowerLeft,
    range: '31–38',
    sideStart: '38',
  },
]

const activeQuadrantData = computed(
  () => quadrants.find((quadrant) => quadrant.id === activeQuadrant.value) || quadrants[0],
)

const desktopJaws = [
  {
    id: 'upper',
    right: quadrants[0].teeth,
    left: quadrants[1].teeth,
  },
  {
    id: 'lower',
    right: quadrants[2].teeth,
    left: quadrants[3].teeth,
  },
]

const handleGridKeydown = (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  const buttons = [...(gridRef.value?.querySelectorAll('[data-tooth-id]:not(:disabled)') || [])]
    .filter((button) => button.offsetParent !== null)
  const currentIndex = buttons.indexOf(document.activeElement)
  if (currentIndex === -1) return
  event.preventDefault()
  const step = event.key === 'ArrowLeft'
    ? -1
    : event.key === 'ArrowRight'
      ? 1
      : event.key === 'ArrowUp'
        ? -16
        : 16
  const nextIndex = Math.max(0, Math.min(buttons.length - 1, currentIndex + step))
  buttons[nextIndex]?.focus()
}
</script>
