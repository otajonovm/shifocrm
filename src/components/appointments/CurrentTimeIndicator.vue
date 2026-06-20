<template>
  <div
    v-if="isVisible"
    class="absolute left-0 right-0 pointer-events-none"
    :class="zIndexClass"
    :style="positionStyle"
  >
    <!-- Vaqt ustuni: faqat vaqt yorlig'i -->
    <div v-if="showText && !showLine" class="flex items-center justify-end w-full pr-1 sm:pr-2">
      <span
        class="inline-flex items-center rounded px-1 py-0.5 text-[10px] sm:text-xs font-bold tabular-nums text-red-600 bg-white/95 shadow-sm ring-1 ring-red-200"
      >
        {{ currentTimeText }}
      </span>
    </div>

    <!-- Shifokor ustunlari: nuqta + to'liq chiziq -->
    <div v-else-if="showLine" class="flex items-center w-full min-w-0">
      <div
        v-if="showDot"
        class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full flex-shrink-0 shadow-[0_0_4px_rgba(239,68,68,0.6)] ring-2 ring-white"
      />
      <div
        v-if="showText"
        class="ml-1 mr-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] sm:text-xs font-bold tabular-nums text-red-600 bg-white/95 shadow-sm ring-1 ring-red-200 flex-shrink-0 sm:hidden"
      >
        {{ currentTimeText }}
      </div>
      <div
        class="flex-1 min-w-0 rounded-full bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.45)]"
        :class="lineHeightClass"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  showText: {
    type: Boolean,
    default: true,
  },
  showLine: {
    type: Boolean,
    default: true,
  },
  showDot: {
    type: Boolean,
    default: true,
  },
  /** Jadval slotlari bilan bir xil pixel pozitsiyasi */
  topPx: {
    type: Number,
    default: null,
  },
  startMinutes: {
    type: Number,
    default: 9 * 60,
  },
  endMinutes: {
    type: Number,
    default: 18 * 60,
  },
  zIndexClass: {
    type: String,
    default: 'z-30',
  },
})

const currentTime = ref(new Date())

const currentTimeText = computed(() => {
  const h = String(currentTime.value.getHours()).padStart(2, '0')
  const m = String(currentTime.value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

const isVisible = computed(() => {
  if (props.topPx == null || !Number.isFinite(props.topPx)) return false
  const nowMinutes = currentTime.value.getHours() * 60 + currentTime.value.getMinutes()
  return nowMinutes >= props.startMinutes && nowMinutes < props.endMinutes
})

const positionStyle = computed(() => ({
  top: `${props.topPx}px`,
  transform: 'translateY(-50%)',
}))

const lineHeightClass = computed(() => 'h-[2px] sm:h-[2.5px]')

const updateTime = () => {
  currentTime.value = new Date()
}

let interval
onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 30000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>
