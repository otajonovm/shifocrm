<template>
  <div class="text-center py-12">
    <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">Odontogramma</h3>
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
