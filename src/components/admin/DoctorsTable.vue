<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">
        Doctors ({{ doctors.length }}/4)
      </h2>
      <div class="flex gap-2">
        <slot name="actions" />
        <button
          @click="$emit('refresh')"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <LoadingSpinner message="Loading doctors..." />
    </div>

    <!-- Empty State -->
    <div v-else-if="doctors.length === 0" class="text-center py-8">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <p class="text-gray-600">No doctors found. Add your first doctor above.</p>
    </div>

    <!-- Doctors Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Specialization
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="doctor in doctors" :key="doctor.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ doctor.full_name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ doctor.phone }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ doctor.email || 'N/A' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ doctor.specialization || 'N/A' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  doctor.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800',
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                ]"
              >
                {{ doctor.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="$emit('delete', doctor.id)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

defineProps({
  doctors: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['refresh', 'delete'])
</script>
