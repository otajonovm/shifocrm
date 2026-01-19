<template>
  <div class="text-center py-12">
    <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">To'lovlar</h3>
    <p class="text-gray-500">Bu bo'lim tez orada qo'shiladi</p>
  </div>
</template>

<script setup>
defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
})
</script>
