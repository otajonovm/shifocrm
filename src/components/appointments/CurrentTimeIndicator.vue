<template>
  <div
    v-if="isVisible"
    class="absolute left-0 right-0 z-20 pointer-events-none"
    :style="{ top: positionPercent, transform: 'translateY(-50%)' }"
  >
    <div class="flex items-center">
      <div v-if="showText" class="text-xs font-bold text-red-600 whitespace-nowrap bg-white/90 px-1 rounded ml-1 mr-1">
        {{ currentTimeText }}
      </div>
      <div v-if="showText" class="w-2 h-2 bg-red-500 rounded-full z-10"></div>
      <div class="flex-1 h-0.5 bg-red-500 shadow-[0_0_2px_rgba(239,68,68,0.5)]" :class="{ '-ml-[1px]': showText }"></div>
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
  startMinutes: {
    type: Number,
    default: 9 * 60,
  },
  endMinutes: {
    type: Number,
    default: 18 * 60,
  },
})

const currentTime = ref(new Date())

const currentTimeText = computed(() => {
  const h = String(currentTime.value.getHours()).padStart(2, '0')
  const m = String(currentTime.value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

const totalMinutes = computed(() => Math.max(30, props.endMinutes - props.startMinutes))

const currentMinutes = computed(() => {
  const now = currentTime.value
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const minutesIntoRange = nowMinutes - props.startMinutes
  return Math.max(0, Math.min(minutesIntoRange, totalMinutes.value))
})

const positionPercent = computed(() => {
  if (!totalMinutes.value) return '0%'
  return `${(currentMinutes.value / totalMinutes.value) * 100}%`
})

const isVisible = computed(() => {
  const nowMinutes = currentTime.value.getHours() * 60 + currentTime.value.getMinutes()
  return nowMinutes >= props.startMinutes && nowMinutes < props.endMinutes
})

const updateTime = () => {
  currentTime.value = new Date()
}

let interval
onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 60000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>
