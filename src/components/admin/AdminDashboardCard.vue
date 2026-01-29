<template>
  <router-link
    v-if="to"
    :to="to"
    class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2"
  >
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h2>
        <p class="text-sm text-gray-600">{{ description }}</p>
      </div>
      <slot name="icon">
        <div v-html="icon" :class="iconClass"></div>
      </slot>
    </div>
  </router-link>
  <div
    v-else
    class="bg-white rounded-lg shadow-md p-6"
  >
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h2>
        <p class="text-sm text-gray-600">{{ description }}</p>
      </div>
      <slot name="icon">
        <div v-html="icon" :class="iconClass"></div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
  to: {
    type: [String, Object],
    default: null,
  },
})

const iconClass = computed(() => {
  return props.to ? 'w-8 h-8 text-blue-600' : 'w-8 h-8 text-gray-400'
})
</script>
