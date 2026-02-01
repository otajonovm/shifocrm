<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isAdmin ? t('patients.allPatients') : t('patients.myPatients') }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ isAdmin ? t('patients.allPatientsSubtitle') : t('patients.myPatientsSubtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="exportPatients"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >


            <ArrowDownTrayIcon class="w-5 h-5" />
            {{ t('patients.export') }}
          </button>
          <button
            @click="openAddModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('patients.newPatient') }}
          </button>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-card border border-gray-100">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              v-model="searchQuery"
              :placeholder="t('patients.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            v-if="isAdmin"
            v-model="selectedDoctor"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{{ t('patients.allDoctors') }}</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }}
            </option>
          </select>
          <select
            v-model="selectedStatus"
            class="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{{ t('patients.allStatuses') }}</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="patientsStore.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.fullName') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.phone') }}
                </th>
                <th v-if="isAdmin" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.doctor') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.lastExam') }}
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.status') }}
                </th>
                <th v-if="isAdmin" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.lastVisit') }}
                </th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('patients.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="patient in filteredPatients"
                :key="patient.id"
                @click="goToPatientDetail(patient.id)"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td class="px-6 py-4" @click.stop>
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
                  <PatientStatusBadge :status="patient.status || 'active'" />
                </td>
                <td v-if="isAdmin" class="px-6 py-4">
                  <span v-if="getLastVisitStatus(patient.id)" class="text-xs">
                    <VisitStatusBadge
                      :status="getLastVisitStatus(patient.id).status"
                      :visit="getLastVisitStatus(patient.id)"
                      :show-icon="false"
                    />
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-6 py-4" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click.stop="openEditModal(patient)"
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      :title="t('patients.edit')"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      v-if="isAdmin"
                      @click.stop="confirmDelete(patient)"
                      class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      :title="t('patients.delete')"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden divide-y divide-gray-100">
          <div
            v-for="patient in filteredPatients"
            :key="patient.id"
            @click="goToPatientDetail(patient.id)"
            class="p-4 hover:bg-gray-50 cursor-pointer"
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
              <PatientStatusBadge :status="patient.status || 'active'" />
            </div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <span class="text-gray-500">{{ t('patients.last') }}: {{ formatDate(patient.last_visit) || '-' }}</span>
              <div class="flex items-center gap-2" @click.stop>
                <button @click.stop="openEditModal(patient)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <PencilIcon class="w-5 h-5" />
                </button>
                <button v-if="isAdmin" @click.stop="confirmDelete(patient)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPatients.length === 0 && !patientsStore.loading" class="p-12 text-center">
          <UsersIcon class="w-12 h-12 text-gray-300 mx-auto" />
          <p class="mt-4 text-gray-500">{{ t('patients.noPatients') }}</p>
          <button
            v-if="isAdmin"
            @click="openAddModal"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('patients.addNewPatient') }}
          </button>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p class="text-sm text-gray-500">
            {{ t('patients.total') }}: <span class="font-medium">{{ filteredPatients.length }}</span> {{ t('patients.patientsCount') }}
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
                  {{ isEditing ? t('patients.editPatient') : t('patients.newPatient') }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ isEditing ? t('patients.editSubtitle') : t('patients.createSubtitle') }}
                </p>
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.fullName') }} *</label>
                  <input
                    type="text"
                    v-model="patientForm.full_name"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :placeholder="t('patients.fullNamePlaceholder')"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.phone') }} *</label>
                  <input
                    type="tel"
                    v-model="patientForm.phone"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :placeholder="t('patients.phonePlaceholder')"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.birthDate') }}</label>
                  <input
                    type="date"
                    v-model="patientForm.birth_date"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.gender') }}</label>
                  <select
                    v-model="patientForm.gender"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{{ t('patients.select') }}</option>
                    <option value="male">{{ t('patients.genderMale') }}</option>
                    <option value="female">{{ t('patients.genderFemale') }}</option>
                  </select>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.address') }}</label>
                  <input
                    type="text"
                    v-model="patientForm.address"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :placeholder="t('patients.addressPlaceholder')"
                  />
                </div>
                <div v-if="isAdmin">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ t('patients.assignedDoctor') }}
                    <span class="text-xs text-gray-400 font-normal">({{ t('patients.optional') }})</span>
                  </label>
                  <select
                    v-model="patientForm.doctor_id"
                    @change="updateDoctorName"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{{ t('patients.unassignedDoctor') }}</option>
                    <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                      {{ doctor.full_name }}
                      <span v-if="doctor.specialization"> - {{ doctor.specialization }}</span>
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ t('patients.assignedDoctorHint') }}
                  </p>
                </div>
                <div v-else class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <label class="block text-xs font-medium text-gray-500 mb-1">
                    {{ t('patients.assignedDoctor') }}
                  </label>
                  <p class="text-sm font-semibold text-gray-700">{{ currentDoctorName || t('patients.unassignedDoctor') }}</p>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ t('patients.assignedDoctorHint') }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ t('patients.status') }}
                    <span class="text-xs text-gray-400 font-normal">({{ t('patients.defaultActive') }})</span>
                  </label>
                  <div class="relative" ref="statusDropdownRef">
                    <button
                      type="button"
                      @click.stop="statusDropdownOpen = !statusDropdownOpen"
                      class="w-full flex items-center justify-between gap-3 px-4 py-2.5 border rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      :class="{
                        'border-primary-400 ring-1 ring-primary-200': statusDropdownOpen,
                        'border-gray-300 hover:border-primary-400': !statusDropdownOpen
                      }"
                    >
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <PatientStatusBadge :status="patientForm.status || 'active'" :show-tooltip="false" />
                      </div>
                      <svg
                        class="w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0"
                        :class="{ 'rotate-180': statusDropdownOpen }"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <!-- Dropdown Menu -->
                    <Transition
                      enter-active-class="transition ease-out duration-100"
                      enter-from-class="transform opacity-0 scale-95"
                      enter-to-class="transform opacity-100 scale-100"
                      leave-active-class="transition ease-in duration-75"
                      leave-from-class="transform opacity-100 scale-100"
                      leave-to-class="transform opacity-0 scale-95"
                    >
                      <div
                        v-if="statusDropdownOpen"
                        class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-auto"
                        @click.stop
                      >
                        <div class="py-1.5">
                          <button
                            v-for="status in statusOptions"
                            :key="status.value"
                            type="button"
                            @click="selectStatus(status.value)"
                            class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors group"
                            :class="{
                              'bg-primary-50 border-l-2 border-l-primary-500': patientForm.status === status.value,
                              'hover:bg-gray-50': patientForm.status !== status.value
                            }"
                          >
                            <div class="flex items-center gap-2.5 flex-1 min-w-0">
                              <PatientStatusBadge :status="status.value" :show-tooltip="false" />
                            </div>
                            <svg
                              v-if="patientForm.status === status.value"
                              class="w-5 h-5 text-primary-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <div v-else class="w-5 h-5 flex-shrink-0"></div>
                          </button>
                        </div>
                      </div>
                    </Transition>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ t('patients.defaultActiveNote') }}
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('patients.notes') }}</label>
                  <textarea
                    v-model="patientForm.notes"
                    rows="3"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :placeholder="t('patients.notesPlaceholder')"
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
                {{ t('patients.cancel') }}
              </button>
              <button
                @click="savePatient"
                :disabled="patientsStore.loading"
                class="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-cyan-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {{ patientsStore.loading ? t('patients.saving') : t('patients.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Patient Profile Modal (with tabs: MED-ID, Odontogram, Visits) -->
    <PatientProfileModal
      :show="showViewModal"
      :patient="viewingPatient"
      :is-admin="isAdmin"
      :doctor-id="authStore.userId"
      :doctor-name="currentDoctorName"
      @close="showViewModal = false"
      @edit="handleEditFromProfile"
    />

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
              <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ t('patients.deleteTitle') }}</h3>
              <p class="mt-2 text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{ deletingPatient?.full_name }}</span>
                {{ t('patients.deleteQuestion') }}
                {{ t('patients.deleteWarning') }}
              </p>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {{ t('patients.cancel') }}
              </button>
              <button
                @click="deletePatientConfirmed"
                :disabled="patientsStore.loading"
                class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {{ patientsStore.loading ? t('patients.deleting') : t('patients.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import PatientProfileModal from '@/components/patients/PatientProfileModal.vue'
import PatientStatusBadge from '@/components/ui/PatientStatusBadge.vue'
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { usePatientsStore } from '@/stores/patients'
import { useToast } from '@/composables/useToast'
import * as visitsApi from '@/api/visitsApi'
import { PATIENT_STATUSES, getPatientStatusLabel } from '@/constants/patientStatus'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const doctorsStore = useDoctorsStore()
const patientsStore = usePatientsStore()
const toast = useToast()
const { t } = useI18n()

const isAdmin = computed(() => authStore.userRole === 'admin')

// Doktor ID ni olish
const getCurrentDoctorId = () => {
  if (isAdmin.value) return null
  if (authStore.user?.id) return authStore.user.id
  if (authStore.userEmail) {
    const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail || item.phone === authStore.userEmail)
    return doctor?.id || null
  }
  return null
}

// Current doctor name (for odontogram and modal)
const currentDoctorName = computed(() => {
  if (isAdmin.value) return t('role.admin')
  const doctorId = getCurrentDoctorId()
  if (!doctorId) return ''
  const doctor = doctorsStore.items.find(d => Number(d.id) === Number(doctorId))
  return doctor?.full_name || ''
})

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
const patientVisits = ref({}) // { patientId: visit }
const statusDropdownOpen = ref(false)
const statusDropdownRef = ref(null)

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

const statusOptions = computed(() => {
  const base = [
    PATIENT_STATUSES.ACTIVE,
    PATIENT_STATUSES.INACTIVE,
    PATIENT_STATUSES.FOLLOW_UP
  ]

  const adminOnly = [
    PATIENT_STATUSES.ARCHIVED,
    PATIENT_STATUSES.DECEASED,
    PATIENT_STATUSES.BLOCKED
  ]

  const values = isAdmin.value ? [...base, ...adminOnly] : [...base]
  const currentStatus = patientForm.value?.status
  if (currentStatus && !values.includes(currentStatus)) {
    values.push(currentStatus)
  }
  return values.map(value => ({
    value,
    label: getPatientStatusLabel(value)
  }))
})

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

// Oxirgi tashrif statusini olish
const getLastVisitStatus = (patientId) => {
  return patientVisits.value[patientId] || null
}

// Bemorlar uchun visit ma'lumotlarini yuklash (batch)
const loadPatientVisits = async (doctorId = null) => {
  try {
    const visitsMap = {}
    const visits = doctorId
      ? await visitsApi.getVisitsByDoctorId(doctorId)
      : await visitsApi.listVisits('order=created_at.desc')

    visits.forEach((visit) => {
      const patientId = Number(visit.patient_id)
      if (!visitsMap[patientId]) {
        visitsMap[patientId] = visit
      }
    })

    patientVisits.value = visitsMap
  } catch (error) {
    console.error('Failed to load patient visits:', error)
  }
}

const updateDoctorName = () => {
  const doctor = doctors.value.find(d => d.id === patientForm.value.doctor_id || d.id === Number(patientForm.value.doctor_id))
  patientForm.value.doctor_name = doctor?.full_name || ''
}

const selectStatus = (status) => {
  patientForm.value.status = status
  statusDropdownOpen.value = false
}

// Modal Actions
const openAddModal = () => {
  isEditing.value = false
  editingPatientId.value = null

  // Doktor uchun avtomatik to'ldirish
  const currentDoctorId = getCurrentDoctorId()
  if (!isAdmin.value && currentDoctorId) {
    patientForm.value = {
      ...initialFormState,
      doctor_id: String(currentDoctorId)
    }
    // Doktor nomini ham to'ldirish
    const doctor = doctors.value.find(d => Number(d.id) === Number(currentDoctorId))
    if (doctor) {
      patientForm.value.doctor_name = doctor.full_name
    }
  } else {
    patientForm.value = { ...initialFormState }
  }

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

const handleEditFromProfile = (patient) => {
  showViewModal.value = false
  openEditModal(patient)
}

const closeModal = () => {
  showModal.value = false
  patientForm.value = { ...initialFormState }
  isEditing.value = false
  editingPatientId.value = null
}

const goToPatientDetail = (patientId) => {
  // ID ni number formatga o'tkazish (Supabase'da ID number)
  const numId = Number(patientId)
  console.log('Navigating to patient detail:', { original: patientId, converted: numId, type: typeof numId })
  router.push(`/patients/${numId}`)
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
      toast.success(t('patients.toastUpdated'))
    } else {
      // Yangi bemor yaratish - avtomatik birinchi visit yaratiladi
      const newPatient = await patientsStore.addPatient(patientForm.value)
      toast.success(t('patients.toastCreated'))

      // Yangi bemor uchun visit ma'lumotlarini yuklash
      if (newPatient && newPatient.id) {
        const visits = await visitsApi.getVisitsByPatientId(newPatient.id)
        if (visits && visits.length > 0) {
          patientVisits.value[newPatient.id] = visits[0]
        }
      }
    }
    closeModal()
  } catch (err) {
    console.error('Save error:', err)
    toast.error('Xatolik yuz berdi')
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
  toast.success(t('patients.toastLoaded'))
}

// Click outside handler for status dropdown
const handleClickOutside = (event) => {
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(event.target)) {
    statusDropdownOpen.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await doctorsStore.fetchAll()

  // Check if we should open the modal from query parameter
  if (route.query.action === 'add') {
    openAddModal()
    // Remove query parameter from URL
    router.replace({ query: {} })
  }

  let doctorId = null
  if (!isAdmin.value) {
    if (authStore.user?.id) {
      doctorId = authStore.user.id
    } else if (authStore.userEmail) {
      const doctor = doctorsStore.items.find(item => item.email === authStore.userEmail)
      doctorId = doctor?.id || null
    }
  }

  if (isAdmin.value) {
    await patientsStore.fetchPatients()
    await loadPatientVisits()
  } else if (doctorId) {
    await patientsStore.fetchPatientsByDoctor(doctorId)
    await loadPatientVisits(doctorId)
  } else {
    await patientsStore.fetchPatients()
    await loadPatientVisits()
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.status-dropdown::-webkit-scrollbar {
  width: 6px;
}

.status-dropdown::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.status-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.status-dropdown::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
