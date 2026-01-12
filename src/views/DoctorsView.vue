<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Notification Toast -->
    <div
      v-if="notification.show"
      :class="[
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all',
        notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      ]"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg
            v-if="notification.type === 'success'"
            class="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p :class="['text-sm font-medium', notification.type === 'success' ? 'text-green-800' : 'text-red-800']">
            {{ notification.message }}
          </p>
        </div>
        <button
          @click="notification.show = false"
          :class="['ml-3 inline-flex', notification.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800']"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link
              to="/dashboard"
              class="text-gray-600 hover:text-gray-900"
            >
              ← Bosh sahifaga qaytish
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">Doktorlar Boshqaruvi</h1>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Add/Edit Doctor Form -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          {{ editingDoctor ? 'Doktor ma\'lumotlarini tahrirlash' : 'Yangi doktor qo\'shish' }}
        </h2>
        
        <form @submit.prevent="editingDoctor ? handleUpdateDoctor() : handleCreateDoctor()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                To'liq ism *
              </label>
              <input
                id="full_name"
                v-model="form.full_name"
                type="text"
                required
                minlength="2"
                maxlength="100"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Dr. Alisher Aliyev"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                Telefon raqami *
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                pattern="[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+998901234567"
              />
            </div>

            <div class="flex items-end">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">Faol</span>
              </label>
            </div>
          </div>

          <div v-if="doctorsStore.error && showFormError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="isSubmitting || (!editingDoctor && doctorsStore.items.length >= MAX_DOCTORS_LIMIT)"
              class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSubmitting ? 'Saqlanmoqda...' : (editingDoctor ? 'Saqlash' : 'Qo\'shish') }}
            </button>
            
            <button
              v-if="editingDoctor"
              type="button"
              @click="cancelEdit"
              class="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Bekor qilish
            </button>
          </div>

          <p v-if="!editingDoctor && doctorsStore.items.length >= MAX_DOCTORS_LIMIT" class="text-sm text-amber-600 font-medium">
            Maksimal {{ MAX_DOCTORS_LIMIT }} ta doktor qo'shish mumkin. Yangi doktor qo'shish uchun birontasini o'chiring.
          </p>
        </form>
      </div>

      <!-- Doctors List -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Doktorlar ro'yxati ({{ doctorsStore.items.length }}/{{ MAX_DOCTORS_LIMIT }})
          </h2>
          <button
            @click="doctorsStore.fetchAll()"
            :disabled="doctorsStore.isLoading"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Yangilash
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="doctorsStore.isLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p class="text-gray-600 mt-2">Yuklanmoqda...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="doctorsStore.items.length === 0" class="text-center py-8">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="text-gray-600">Doktorlar topilmadi. Yuqorida yangi doktor qo'shing.</p>
        </div>

        <!-- Doctors Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ism
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holati
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
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
                    {{ doctor.is_active ? 'Faol' : 'Nofaol' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    @click="startEdit(doctor)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Tahrirlash
                  </button>
                  <button
                    @click="handleDeleteDoctor(doctor.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    O'chirish
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
import { MAX_DOCTORS_LIMIT, MESSAGES } from '@/constants'

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
const editingDoctor = ref(null)

const notification = ref({
  show: false,
  message: '',
  type: 'success', // success or error
})

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

onMounted(() => {
  doctorsStore.fetchAll()
})

const handleCreateDoctor = async () => {
  if (doctorsStore.items.length >= MAX_DOCTORS_LIMIT) {
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
    
    showNotification(MESSAGES.DOCTORS.CREATE_SUCCESS, 'success')
  } catch {
    showFormError.value = true
    showNotification(MESSAGES.DOCTORS.CREATE_ERROR, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (doctor) => {
  editingDoctor.value = doctor
  form.value = {
    full_name: doctor.full_name,
    phone: doctor.phone,
    is_active: doctor.is_active,
  }
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  editingDoctor.value = null
  form.value = {
    full_name: '',
    phone: '',
    is_active: true,
  }
  showFormError.value = false
}

const handleUpdateDoctor = async () => {
  if (!editingDoctor.value) return

  isSubmitting.value = true
  showFormError.value = false

  try {
    await doctorsStore.update(editingDoctor.value.id, {
      full_name: form.value.full_name,
      phone: form.value.phone,
      is_active: form.value.is_active,
    })
    
    showNotification(MESSAGES.DOCTORS.UPDATE_SUCCESS, 'success')
    cancelEdit()
  } catch {
    showFormError.value = true
    showNotification(MESSAGES.DOCTORS.UPDATE_ERROR, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (confirm(MESSAGES.DOCTORS.DELETE_CONFIRM)) {
    try {
      await doctorsStore.remove(id)
      showNotification(MESSAGES.DOCTORS.DELETE_SUCCESS, 'success')
      
      // Cancel edit if we're deleting the doctor being edited
      if (editingDoctor.value && editingDoctor.value.id === id) {
        cancelEdit()
      }
    } catch {
      showNotification(MESSAGES.DOCTORS.DELETE_ERROR, 'error')
    }
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
