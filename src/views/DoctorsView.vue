<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link
              to="/dashboard"
              class="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">Manage Doctors</h1>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Add Doctor Form -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Add New Doctor</h2>
        
        <form @submit.prevent="handleCreateDoctor" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="full_name"
                v-model="form.full_name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Dr. John Doe"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+1234567890"
              />
            </div>

            <div class="flex items-end">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting || doctorsStore.items.length >= 4"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSubmitting ? 'Adding...' : 'Add Doctor' }}
          </button>

          <p v-if="doctorsStore.items.length >= 4" class="text-sm text-amber-600 font-medium">
            Maximum of 4 doctors reached. Please remove a doctor before adding a new one.
          </p>
        </form>
      </div>

      <!-- Doctors List -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Doctors ({{ doctorsStore.items.length }}/4)
          </h2>
          <button
            @click="doctorsStore.fetchAll()"
            :disabled="doctorsStore.isLoading"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="doctorsStore.isLoading" class="text-center py-8">
          <p class="text-gray-600">Loading doctors...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="doctorsStore.items.length === 0" class="text-center py-8">
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
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="doctor in doctorsStore.items" :key="doctor.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ doctor.full_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ doctor.phone }}</div>
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
                    @click="handleDeleteDoctor(doctor.id)"
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
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'

const router = useRouter()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()

const form = ref({
  full_name: '',
  phone: '',
  is_active: true,
})

const isSubmitting = ref(false)
const showFormError = ref(false)

onMounted(() => {
  doctorsStore.fetchAll()
})

const handleCreateDoctor = async () => {
  if (doctorsStore.items.length >= 4) {
    showFormError.value = true
    return
  }

  isSubmitting.value = true
  showFormError.value = false

  try {
    await doctorsStore.create({
      full_name: form.value.full_name,
      phone: form.value.phone,
      is_active: form.value.is_active,
    })
    
    form.value = {
      full_name: '',
      phone: '',
      is_active: true,
    }
  } catch {
    showFormError.value = true
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (confirm('Are you sure you want to delete this doctor?')) {
    try {
      await doctorsStore.remove(id)
    } catch {
      alert('Failed to delete doctor')
    }
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
