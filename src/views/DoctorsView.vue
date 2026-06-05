<template>
  <MainLayout>
    <div v-if="!canViewPage" class="bg-white rounded-lg shadow-md p-6">
      <p class="text-sm text-gray-600">Sizda ushbu bo'limni ko'rish huquqi yo'q.</p>
    </div>

    <div v-else>
      <!-- Add Staff Form (Super Admin only) -->
      <div v-if="isSuperAdmin" class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Klinikaga Yangi Xodim Qo'shish (Faqat Boshliq uchun)
        </h2>

        <form @submit.prevent="handleCreateDoctor" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                Ism-sharifi *
              </label>
              <input
                id="full_name"
                v-model="form.full_name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Masalan: Dr. Aliyev"
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
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email manzili
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="doctor@example.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Tizimga kirish paroli *
              </label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Kamida 6 ta belgi"
              />
            </div>

            <div>
              <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
                Klinikadagi mutaxassisligi (Roli)
              </label>
              <select
                id="specialization"
                v-model="form.specialization"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Mutaxassislikni tanlang</option>
                <option v-for="option in specializationOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>

            <div>
              <label for="salary_percentage" class="block text-sm font-medium text-gray-700 mb-2">
                Shifokor ulushi / Foiz stavkasi (%)
              </label>
              <input
                id="salary_percentage"
                v-model="form.salary_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Masalan: 30"
              />
            </div>

            <div class="flex items-end">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">Xodim faol (Aktiv)</span>
              </label>
            </div>
          </div>

          <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ formError }}</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSubmitting ? 'Saqlanmoqda...' : 'Xodimni saqlash' }}
          </button>
        </form>
      </div>

      <div v-else class="bg-white rounded-lg shadow-md p-6 mb-8">
        <p class="text-sm text-gray-600">
          Xodim qo'shish faqat boshliq (Super Admin) tomonidan amalga oshiriladi.
        </p>
      </div>

      <!-- Staff List -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Xodimlar va Ish grafiklari paneli</h2>
          <div class="flex gap-2">
            <button
              @click="refreshDoctors"
              :disabled="doctorsStore.isLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Yangilash
            </button>
          </div>
        </div>

        <div v-if="doctorsStore.error" class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-600">{{ doctorsStore.error }}</p>
        </div>

        <div v-if="doctorsStore.isLoading" class="text-center py-8">
          <LoadingSpinner message="Xodimlar yuklanmoqda..." />
        </div>

        <div v-else-if="doctorsStore.items.length === 0" class="text-center py-8">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="text-gray-600">Xodimlar topilmadi</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xodim ismi
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th
                  v-if="isSuperAdmin"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mutaxassisligi
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Biriktirilgan kreslo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ish kunlari
                </th>
                <th
                  v-if="isSuperAdmin"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  KPI % (Faqat Boshliqqa)
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  v-if="isSuperAdmin"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
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
                <td v-if="isSuperAdmin" class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ doctor.email || '—' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ doctor.specialization || '—' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ getChairNumber(doctor) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ getScheduleLabel(doctor) }}</div>
                </td>
                <td v-if="isSuperAdmin" class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ getKpiLabel(doctor) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      doctor.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800',
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                    ]"
                  >
                    {{ doctor.is_active ? 'Faol' : 'Nofaol' }}
                  </span>
                </td>
                <td v-if="isSuperAdmin" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="openPermissionsModal(doctor)"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                    title="Huquqlarni boshqarish"
                  >
                    Huquqlar
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
    </div>

    <!-- Permissions Modal (Super Admin only) -->
    <div
      v-if="isPermissionsOpen && isSuperAdmin"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closePermissionsModal"
    >
      <div class="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Huquqlarni boshqarish</h3>
            <p class="text-sm text-gray-500">
              {{ selectedDoctor?.full_name || '' }}
            </p>
          </div>
          <button
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="closePermissionsModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="border-b border-gray-100 px-6">
          <nav class="flex gap-4">
            <button
              class="py-3 text-sm font-medium"
              :class="activePermissionsTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'"
              @click="activePermissionsTab = 'info'"
            >
              Asosiy ma'lumot
            </button>
            <button
              class="py-3 text-sm font-medium"
              :class="activePermissionsTab === 'permissions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'"
              @click="activePermissionsTab = 'permissions'"
            >
              Huquqlar
            </button>
          </nav>
        </div>

        <div class="px-6 py-5">
          <div v-if="activePermissionsTab === 'info'" class="space-y-4">
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Mutaxassisligi/Roli</p>
              <p class="text-sm font-medium text-gray-900">
                {{ selectedDoctor?.specialization || '—' }}
              </p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Telefon</p>
              <p class="text-sm font-medium text-gray-900">
                {{ selectedDoctor?.phone || '—' }}
              </p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Email</p>
              <p class="text-sm font-medium text-gray-900">
                {{ selectedDoctor?.email || '—' }}
              </p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <label class="flex items-start gap-3 rounded-lg border border-gray-100 p-4 hover:border-blue-200">
              <input
                v-model="permissionsForm.can_view_revenue"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">Klinika kassasi va moliyaviy hisobotlarini ko'rish</p>
                <p class="text-xs text-gray-500">Moliyaviy ko'rsatkichlar va daromadlarni ko'rish huquqi</p>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-lg border border-gray-100 p-4 hover:border-blue-200">
              <input
                v-model="permissionsForm.can_export_data"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">Bemorlar bazasini Excelga yuklab olish (Export)</p>
                <p class="text-xs text-gray-500">Ma'lumotlarni eksport qilish huquqi</p>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-lg border border-gray-100 p-4 hover:border-blue-200">
              <input
                v-model="permissionsForm.can_edit_prices"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">Xizmatlar narxini (Preyskurant) o'zgartirish huquqi</p>
                <p class="text-xs text-gray-500">Narxlar ro'yxatini tahrirlash huquqi</p>
              </div>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            @click="closePermissionsModal"
          >
            Bekor qilish
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="permissionsSaving"
            @click="savePermissions"
          >
            {{ permissionsSaving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/layouts/MainLayout.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const toast = useToast()

const effectiveRole = computed(() => authStore.impersonatorRole || authStore.userRole || '')
const isSuperAdmin = computed(() => effectiveRole.value === 'super_admin')
const isAdmin = computed(() => effectiveRole.value === 'administrator' || effectiveRole.value === 'admin')
const canViewPage = computed(() => isSuperAdmin.value || isAdmin.value)

const form = ref({
  full_name: '',
  phone: '',
  email: '',
  password: '',
  specialization: '',
  salary_percentage: '',
  is_active: true,
})

const isSubmitting = ref(false)
const formError = ref('')
const isPermissionsOpen = ref(false)
const selectedDoctor = ref(null)
const permissionsSaving = ref(false)
const activePermissionsTab = ref('permissions')
const permissionsForm = ref({
  can_view_revenue: false,
  can_export_data: false,
  can_edit_prices: false,
})
const permissionsByDoctorId = ref({})

const specializationOptions = [
  'Ortodont',
  'Terapevt',
  'Xirurg',
  'Ortoped',
  'Implantolog',
  'Administrator (Reception)',
  'Assistent (Yordamchi)',
  'Kassir/Buxgalter',
]

const weekOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const dayLabels = {
  mon: 'Dush',
  tue: 'Sesh',
  wed: 'Chor',
  thu: 'Pay',
  fri: 'Jum',
  sat: 'Shan',
  sun: 'Yak',
}

const dayKeyByIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const normalizeTime = (value) => {
  if (!value) return ''
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

const normalizeWorkSchedule = (schedule) => {
  if (!schedule) return null
  if (typeof schedule === 'string') {
    try {
      return JSON.parse(schedule)
    } catch {
      return null
    }
  }
  return schedule
}

const formatWeeklySchedule = (schedule) => {
  const normalized = normalizeWorkSchedule(schedule)
  const days = normalized?.days
  if (!days || typeof days !== 'object') return '—'
  const parts = weekOrder.map((key) => {
    const day = days[key]
    if (!day?.enabled) return null
    const start = normalizeTime(day.start)
    const end = normalizeTime(day.end)
    const range = start && end ? ` ${start}-${end}` : ''
    return `${dayLabels[key]}${range}`
  }).filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

const formatTodaySchedule = (schedule) => {
  const normalized = normalizeWorkSchedule(schedule)
  const days = normalized?.days
  if (!days || typeof days !== 'object') return '—'
  const todayKey = dayKeyByIndex[new Date().getDay()]
  const day = days[todayKey]
  if (!day?.enabled) return '—'
  const start = normalizeTime(day.start)
  const end = normalizeTime(day.end)
  const range = start && end ? ` ${start}-${end}` : ''
  return `${dayLabels[todayKey]}${range}`
}

const getScheduleLabel = (doctor) => {
  if (isSuperAdmin.value) {
    return formatWeeklySchedule(doctor?.work_schedule)
  }
  return formatTodaySchedule(doctor?.work_schedule)
}

const getChairNumber = (doctor) => {
  const schedule = normalizeWorkSchedule(doctor?.work_schedule)
  const chair = doctor?.chair_number ?? schedule?.chair_number
  return chair != null && chair !== '' ? chair : '—'
}

const getKpiLabel = (doctor) => {
  const value = doctor?.salary_percentage
  if (value == null || value === '') return '—'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? String(numeric) : String(value)
}

onMounted(async () => {
  if (!canViewPage.value) return
  await refreshDoctors()
})

const handleCreateDoctor = async () => {
  if (!isSuperAdmin.value) return

  isSubmitting.value = true
  formError.value = ''
  const formData = { ...form.value }

  if (!formData.full_name || !formData.phone || !formData.password) {
    formError.value = "Majburiy maydonlar to'ldirilmagan."
    toast.error(formError.value)
    isSubmitting.value = false
    return
  }

  if (formData.salary_percentage !== '' && formData.salary_percentage != null) {
    const percentage = Number(formData.salary_percentage)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      formError.value = "Foiz stavkasi 0 dan 100 gacha bo'lishi kerak."
      toast.error(formError.value)
      isSubmitting.value = false
      return
    }
  }

  try {
    const clinicId = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
      ? Number(authStore.userClinicId)
      : null
    await doctorsStore.create({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      is_active: formData.is_active,
      ...(clinicId != null && { clinic_id: clinicId }),
    })

    form.value = {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      specialization: '',
      salary_percentage: '',
      is_active: true,
    }

    toast.success("Xodim qo'shildi")
  } catch (error) {
    formError.value = doctorsStore.error || error?.message || "Xodim qo'shishda xatolik yuz berdi"
    toast.error(formError.value)
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteDoctor = async (id) => {
  if (!isSuperAdmin.value) return
  if (confirm("Xodimni o'chirishni tasdiqlaysizmi?")) {
    try {
      await doctorsStore.remove(id)
      toast.success("Xodim o'chirildi")
    } catch (error) {
      console.error('Failed to delete doctor:', error)
      toast.error("Xodimni o'chirishda xatolik yuz berdi")
    }
  }
}

const refreshDoctors = async () => {
  try {
    await doctorsStore.fetchAll()
  } catch (error) {
    console.error('Failed to refresh doctors:', error)
    toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi")
  }
}

const openPermissionsModal = (doctor) => {
  if (!isSuperAdmin.value) return
  selectedDoctor.value = doctor
  const savedPermissions = permissionsByDoctorId.value[doctor.id]
  permissionsForm.value = savedPermissions
    ? { ...savedPermissions }
    : {
        can_view_revenue: false,
        can_export_data: false,
        can_edit_prices: false,
      }
  activePermissionsTab.value = 'permissions'
  isPermissionsOpen.value = true
}

const closePermissionsModal = () => {
  isPermissionsOpen.value = false
  selectedDoctor.value = null
}

const savePermissions = async () => {
  if (!selectedDoctor.value || !isSuperAdmin.value) return
  permissionsSaving.value = true
  try {
    permissionsByDoctorId.value = {
      ...permissionsByDoctorId.value,
      [selectedDoctor.value.id]: { ...permissionsForm.value },
    }
    toast.success('Huquqlar saqlandi')
    closePermissionsModal()
  } catch (error) {
    console.error('Failed to save permissions:', error)
    toast.error("Huquqlarni saqlashda xatolik yuz berdi")
  } finally {
    permissionsSaving.value = false
  }
}
</script>
