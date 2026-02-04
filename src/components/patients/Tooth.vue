<template>
  <div class="relative flex flex-col items-center gap-0.5 sm:gap-1 tooth-cell">
    <span class="text-[9px] sm:text-[10px] text-slate-500 leading-none">{{ id }}</span>
    <button
      ref="buttonRef"
      type="button"
      :disabled="disabled"
      class="rounded-lg sm:rounded-xl border transition-transform duration-150 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-60 touch-manipulation min-w-[40px] min-h-[48px] sm:min-w-0 sm:min-h-0"
      :class="statusContainerClass"
      :style="toothStyle"
      @click="handleSelect"
    >
      <div class="tooth-svg tooth-svg-responsive" :class="[statusClass, { 'tooth-status--service': !!serviceColor }]" v-html="svgMarkup"></div>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'healthy'
  },
  /** Xizmatlar bo'limida sozlangan rang (hex) — mavjud bo'lsa status rangini almashtiradi */
  serviceColor: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['select'])

const svgMarkup = ref('')
const buttonRef = ref(null)

const statusClass = computed(() => `tooth-status--${props.status || 'healthy'}`)

// Xizmat rangi — SVG va/yoki fon uchun
const toothStyle = computed(() => {
  if (props.serviceColor) {
    return {
      '--tooth-service-color': props.serviceColor,
      backgroundColor: `${props.serviceColor}20`,
      borderColor: `${props.serviceColor}60`
    }
  }
  return undefined
})

const statusContainerClass = computed(() => {
  if (props.serviceColor) {
    return 'border-2' // toothStyle background va border beradi
  }
  switch (props.status) {
    case 'caries':
      return 'border-red-300 bg-red-50'
    case 'filling':
    case 'filled':
      return 'border-blue-300 bg-blue-50'
    case 'missing':
      return 'border-slate-200 bg-slate-50'
    case 'crown':
      return 'border-amber-300 bg-amber-50'
    case 'root_canal':
      return 'border-violet-300 bg-violet-50'
    default:
      return 'border-slate-200 bg-white'
  }
})

const fetchSvg = async () => {
  try {
    const response = await fetch(`/teeth/individual/tooth-${props.id}.svg`)
    if (!response.ok) {
      throw new Error(`Failed to load tooth SVG ${props.id}`)
    }
    svgMarkup.value = await response.text()
  } catch (error) {
    console.error('Failed to load tooth SVG:', error)
    svgMarkup.value = ''
  }
}

const handleSelect = () => {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  emit('select', { id: props.id, rect })
}

onMounted(fetchSvg)
watch(() => props.id, fetchSvg)
</script>

<style scoped>
.tooth-svg {
  width: 56px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
}

@media (max-width: 768px) {
  .tooth-svg-responsive {
    width: 40px;
    height: 52px;
    padding: 4px 3px;
  }
}

.tooth-svg :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.tooth-status--caries :deep(.tooth_inner),
.tooth-status--caries :deep(.tooth_inner path) {
  fill: #ef4444;
  stroke: #ef4444;
}

.tooth-status--filling :deep(.tooth_inner),
.tooth-status--filling :deep(.tooth_inner path) {
  fill: #3b82f6;
  stroke: #3b82f6;
}

.tooth-status--crown :deep(.tooth_inner),
.tooth-status--crown :deep(.tooth_inner path) {
  fill: #f59e0b;
  stroke: #f59e0b;
}

.tooth-status--missing :deep(.tooth_inner),
.tooth-status--missing :deep(.tooth_inner path) {
  opacity: 0.2;
}

.tooth-status--root_canal :deep(.tooth_inner),
.tooth-status--root_canal :deep(.tooth_inner path) {
  fill: #8b5cf6;
  stroke: #8b5cf6;
}

/* Xizmatlar bo'limida sozlangan rang — status rangini almashtiradi */
.tooth-status--service :deep(.tooth_inner),
.tooth-status--service :deep(.tooth_inner path),
.tooth-status--service :deep(svg path),
.tooth-status--service :deep(svg) {
  fill: var(--tooth-service-color) !important;
  stroke: var(--tooth-service-color) !important;
}
</style>
