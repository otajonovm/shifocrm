<template>
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <router-link
            to="/dashboard"
            class="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            Doctor Portal
          </router-link>
          <nav class="hidden md:flex space-x-4">
            <router-link
              to="/dashboard"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              active-class="bg-blue-50 text-blue-700"
            >
              Dashboard
            </router-link>
            <router-link
              to="/doctor/profile"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              active-class="bg-blue-50 text-blue-700"
            >
              My Profile
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">{{ userEmail }}</span>
          <button
            @click="$emit('logout')"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  userEmail: {
    type: String,
    default: '',
  },
})

defineEmits(['logout'])
</script>
