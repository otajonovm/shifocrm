<template>
  <div v-if="message" class="p-3 bg-green-50 border border-green-200 rounded-md">
    <p class="text-sm text-green-600">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})
</script>
