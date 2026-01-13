<template>
  <div class="flex items-center justify-center p-8">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p v-if="message" class="ml-4 text-gray-600">{{ message }}</p>
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
