<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isAdmin ? 'Barcha Bemorlar' : 'Mening Bemorlarim' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isAdmin ? 'Tizimdagi barcha bemorlar ro\'yxati' : 'Sizga biriktirilgan bemorlar' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="exportPatients"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon class="w-5 h-5" />
            Export
          </button>
          <button
            v-if="isAdmin"
            @click="openAddModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <PlusIcon class="w-5 h-5" />
            Yangi Bemor
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-xl shadow-card border border-gray-100">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Bemor qidirish..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            v-if="isAdmin"
            v-model="selectedDoctor"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Barcha doktorlar</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <select
            v-model="selectedStatus"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="patientsStore.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>

      <!-- Patients Table -->
      <div v-else class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  F.I.O
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Telefon
                </th>
                <th v-if="isAdmin" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Doktor
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Oxirgi ko'rik
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="patient in filteredPatients"
                :key="patient.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-mono text-gray-500">#{{ patient.id }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {{ getInitials(patient.full_name) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ patient.full_name }}</p>
                      <p class="text-xs text-gray-500">{{ formatDate(patient.birth_date) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ patient.phone }}</span>
                </td>
                <td v-if="isAdmin" class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ patient.doctor_name || '-' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ formatDate(patient.last_visit) || '-' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ patient.status === 'active' ? 'Faol' : 'Nofaol' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="viewPatient(patient)"
                      class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Ko'rish"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="openEditModal(patient)"
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      v-if="isAdmin"
                      @click="confirmDelete(patient)"
                      class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-gray-100">
          <div
            v-for="patient in filteredPatients"
            :key="patient.id"
            class="p-4 hover:bg-gray-50"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {{ getInitials(patient.full_name) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ patient.full_name }}</p>
                  <p class="text-sm text-gray-500">{{ patient.phone }}</p>
                </div>
              </div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ patient.status === 'active' ? 'Faol' : 'Nofaol' }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <span class="text-gray-500">Oxirgi: {{ formatDate(patient.last_visit) || '-' }}</span>
              <div class="flex items-center gap-2">
                <button @click="viewPatient(patient)" class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                  <EyeIcon class="w-5 h-5" />
                </button>
                <button @click="openEditModal(patient)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <PencilIcon class="w-5 h-5" />
                </button>
                <button v-if="isAdmin" @click="confirmDelete(patient)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPatients.length === 0 && !patientsStore.loading" class="p-12 text-center">
          <UsersIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">Bemorlar topilmadi</p>
          <button
            v-if="isAdmin"
            @click="openAddModal"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <PlusIcon class="w-5 h-5" />
            Yangi bemor qo'shish
          </button>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">
            Jami: <span class="font-medium">{{ filteredPatients.length }}</span> bemor
          </p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Patient Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">
                  {{ isEditing ? 'Bemorni Tahrirlash' : 'Yangi Bemor' }}
                </h2>
                <p class="text-sm text-gray-500">Bemor ma'lumotlarini kiriting</p>
              </div>
              <button
                @click="closeModal"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">F.I.O *</label>
                  <input
                    type="text"
                    v-model="patientForm.full_name"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="To'liq ism"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    v-model="patientForm.phone"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998 (XX) XXX XX XX"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tug'ilgan sana</label>
                  <input
                    type="date"
                    v-model="patientForm.birth_date"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Jinsi</label>
                  <select
                    v-model="patientForm.gender"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tanlang</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Manzil</label>
                  <input
                    type="text"
                    v-model="patientForm.address"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Manzilni kiriting"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Biriktirilgan Doktor</label>
                  <select
                    v-model="patientForm.doctor_id"
                    @change="updateDoctorName"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tanlang</option>
                    <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                      {{ doctor.full_name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    v-model="patientForm.status"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Izohlar</label>
                  <textarea
                    v-model="patientForm.notes"
                    rows="3"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Qo'shimcha ma'lumotlar..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                @click="closeModal"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                @click="savePatient"
                :disabled="patientsStore.loading"
                class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {{ patientsStore.loading ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- View Patient Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showViewModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showViewModal = false"
        >
          <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                  {{ getInitials(viewingPatient?.full_name || '') }}
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">{{ viewingPatient?.full_name }}</h2>
                  <p class="text-sm text-gray-500">ID: #{{ viewingPatient?.id }}</p>
                </div>
              </div>
              <button
                @click="showViewModal = false"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Telefon</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingPatient?.phone }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Tug'ilgan sana</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ formatDate(viewingPatient?.birth_date) || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Jinsi</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">
                    {{ viewingPatient?.gender === 'male' ? 'Erkak' : viewingPatient?.gender === 'female' ? 'Ayol' : '-' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
                    :class="viewingPatient?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  >
                    {{ viewingPatient?.status === 'active' ? 'Faol' : 'Nofaol' }}
                  </span>
                </div>
                <div class="col-span-2">
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Manzil</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingPatient?.address || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Doktor</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingPatient?.doctor_name || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Oxirgi ko'rik</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ formatDate(viewingPatient?.last_visit) || '-' }}</p>
                </div>
                <div class="col-span-2" v-if="viewingPatient?.notes">
                  <p class="text-xs text-gray-500 uppercase tracking-wider">Izohlar</p>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ viewingPatient?.notes }}</p>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                @click="showViewModal = false"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yopish
              </button>
              <button
                @click="showViewModal = false; openEditModal(viewingPatient)"
                class="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showDeleteModal = false"
        >
          <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up">
            <div class="p-6 text-center">
              <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon class="w-8 h-8 text-red-600" />
              </div>
              <h3 class="mt-4 text-lg font-semibold text-gray-900">Bemorni o'chirish</h3>
              <p class="mt-2 text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{ deletingPatient?.full_name }}</span> ni o'chirmoqchimisiz?
                Bu amalni qaytarib bo'lmaydi.
              </p>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                @click="deletePatientConfirmed"
                :disabled="patientsStore.loading"
                class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {{ patientsStore.loading ? 'O\'chirilmoqda...' : 'O\'chirish' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const toast = useToast()

const isAdmin = computed(() => authStore.userRole === 'admin')

// Search & Filter
const searchQuery = ref('')
const selectedDoctor = ref('')
const selectedStatus = ref('')

// Modals
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingPatientId = ref(null)
const viewingPatient = ref(null)
const deletingPatient = ref(null)

// Form
const initialFormState = {
  full_name: '',
  phone: '',
  birth_date: '',
  gender: '',
  address: '',
  doctor_id: '',
  doctor_name: '',
  status: 'active',
  notes: '',
}
const patientForm = ref({ ...initialFormState })

// Doctors list
const doctors = computed(() => doctorsStore.items)

// Filtered patients
const filteredPatients = computed(() => {
  let result = patientsStore.items

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.full_name.toLowerCase().includes(query) ||
      p.phone.includes(query)
    )
  }

  if (selectedDoctor.value) {
    result = result.filter(p => p.doctor_id === selectedDoctor.value || p.doctor_id === Number(selectedDoctor.value))
  }

  if (selectedStatus.value) {
    result = result.filter(p => p.status === selectedStatus.value)
  }

  return result
})

// Helpers
const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const updateDoctorName = () => {
  const doctor = doctors.value.find(d => d.id === patientForm.value.doctor_id || d.id === Number(patientForm.value.doctor_id))
  patientForm.value.doctor_name = doctor?.full_name || ''
}

// Modal Actions
const openAddModal = () => {
  isEditing.value = false
  editingPatientId.value = null
  patientForm.value = { ...initialFormState }
  showModal.value = true
}

const openEditModal = (patient) => {
  isEditing.value = true
  editingPatientId.value = patient.id
  patientForm.value = {
    full_name: patient.full_name || '',
    phone: patient.phone || '',
    birth_date: patient.birth_date || '',
    gender: patient.gender || '',
    address: patient.address || '',
    doctor_id: patient.doctor_id || '',
    doctor_name: patient.doctor_name || '',
    status: patient.status || 'active',
    notes: patient.notes || '',
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  patientForm.value = { ...initialFormState }
  isEditing.value = false
  editingPatientId.value = null
}

const viewPatient = (patient) => {
  viewingPatient.value = patient
  showViewModal.value = true
}

const confirmDelete = (patient) => {
  deletingPatient.value = patient
  showDeleteModal.value = true
}

// CRUD Actions
const savePatient = async () => {
  if (!patientForm.value.full_name || !patientForm.value.phone) {
    toast.error('Iltimos, majburiy maydonlarni to\'ldiring')
    return
  }

  try {
    if (isEditing.value && editingPatientId.value) {
      await patientsStore.editPatient(editingPatientId.value, patientForm.value)
    } else {
      await patientsStore.addPatient(patientForm.value)
    }
    closeModal()
  } catch (err) {
    console.error('Save error:', err)
  }
}

const deletePatientConfirmed = async () => {
  if (!deletingPatient.value) return

  try {
    await patientsStore.removePatient(deletingPatient.value.id)
    showDeleteModal.value = false
    deletingPatient.value = null
  } catch (err) {
    console.error('Delete error:', err)
  }
}

const exportPatients = () => {
  const data = patientsStore.items
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'patients.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Bemorlar ro\'yxati yuklandi!')
}

// Lifecycle
onMounted(async () => {
  await doctorsStore.fetchAll()

  if (isAdmin.value) {
    await patientsStore.fetchPatients()
  } else {
    // Doctor o'z bemorlarini ko'radi
    const doctorId = authStore.user?.id
    if (doctorId) {
      await patientsStore.fetchPatientsByDoctor(doctorId)
    }
  }
})
</script>
