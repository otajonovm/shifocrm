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
            <h1 class="text-xl font-semibold text-gray-900">My Profile</h1>
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

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading profile...</p>
      </div>

      <!-- Profile Form -->
      <div v-else class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="full_name"
                v-model="profile.full_name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                id="phone"
                v-model="profile.phone"
                type="tel"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                v-model="profile.email"
                type="email"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <input
                id="specialization"
                v-model="profile.specialization"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Cardiologist, Therapist"
              />
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="is_active"
              v-model="profile.is_active"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="is_active" class="text-sm font-medium text-gray-700">
              Active Status
            </label>
          </div>

          <div v-if="updateError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ updateError }}</p>
          </div>

          <div v-if="updateSuccess" class="p-3 bg-green-50 border border-green-200 rounded-md">
            <p class="text-sm text-green-600">Profile updated successfully!</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>

        <!-- Password Change Section -->
        <div class="border-t pt-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div>
              <label for="old_password" class="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="old_password"
                v-model="passwordForm.oldPassword"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="new_password"
                v-model="passwordForm.newPassword"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div v-if="passwordError" class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{{ passwordError }}</p>
            </div>

            <div v-if="passwordSuccess" class="p-3 bg-green-50 border border-green-200 rounded-md">
              <p class="text-sm text-green-600">Password changed successfully!</p>
            </div>

            <button
              type="submit"
              :disabled="isChangingPassword"
              class="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
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

const profile = ref({
  full_name: '',
  phone: '',
  email: '',
  specialization: '',
  is_active: true,
})

const existingDoctor = ref(null)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const isChangingPassword = ref(false)
const updateError = ref(null)
const updateSuccess = ref(false)
const passwordError = ref(null)
const passwordSuccess = ref(false)

onMounted(async () => {
  await loadProfile()
})

const loadProfile = async () => {
  isLoading.value = true
  try {
    const doctor = await doctorsStore.getById(authStore.userId)
    if (!doctor) throw new Error('Doctor profile not found')
    existingDoctor.value = doctor
    profile.value = {
      full_name: doctor.full_name || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      specialization: doctor.specialization || '',
      is_active: doctor.is_active ?? true,
    }
  } catch (err) {
    updateError.value = err.message || 'Failed to load profile'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleUpdateProfile = async () => {
  isSubmitting.value = true
  updateError.value = null
  updateSuccess.value = false

  try {
    const updated = await doctorsStore.update(authStore.userId, {
      full_name: profile.value.full_name,
      phone: profile.value.phone,
      specialization: profile.value.specialization,
      is_active: profile.value.is_active,
    })
    existingDoctor.value = updated
    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)
  } catch (err) {
    updateError.value = err.message || 'Failed to update profile'
  } finally {
    isSubmitting.value = false
  }
}

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    return
  }

  if (!existingDoctor.value) {
    passwordError.value = 'Profile not loaded'
    return
  }

  if (existingDoctor.value.password !== passwordForm.value.oldPassword) {
    passwordError.value = 'Current password is incorrect'
    return
  }

  isChangingPassword.value = true
  passwordError.value = null
  passwordSuccess.value = false

  try {
    const updated = await doctorsStore.update(authStore.userId, {
      password: passwordForm.value.newPassword,
    })
    existingDoctor.value = updated

    passwordSuccess.value = true
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    }

    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (err) {
    passwordError.value = err.message || 'Failed to change password'
  } finally {
    isChangingPassword.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
