<template>
  <MainLayout>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="patient" class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
      <!-- Patient Profile Header — Mobile-first, touch-friendly -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-4 sm:p-6">
        <!-- Top row: Back + Avatar + Name — mobile thumb zone -->
        <div class="flex items-start gap-3 sm:gap-4">
          <button
            @click="goBack"
            class="flex-shrink-0 p-2.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            :title="t('patientDetail.back')"
          >
            <ArrowLeftIcon class="w-6 h-6" />
          </button>
          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 shadow-md">
              {{ getInitials(patient.full_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">{{ patient.full_name }}</h1>
                <button
                  v-if="isAdmin"
                  @click="openPatientStatusModal"
                  class="cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
                >
                  <PatientStatusBadge :status="patient.status || 'active'" />
                </button>
                <PatientStatusBadge v-else :status="patient.status || 'active'" />
              </div>
              <!-- MED ID — prominent, copyable on mobile -->
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-500">{{ t('patients.medId') }}</span>
                <span class="font-mono font-semibold text-primary-600 text-sm sm:text-base">{{ patient.med_id || `#${patient.id}` }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Info grid — 2-col on mobile, readable stacking -->
        <div class="mt-4 sm:mt-5 grid grid-cols-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-1 gap-x-4 gap-y-3">
          <div class="bg-gray-50/80 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 sm:py-1">
            <span class="text-xs text-gray-500 block">{{ t('patientDetail.phone') }}</span>
            <a
              v-if="patient.phone"
              :href="`tel:${patient.phone}`"
              class="text-sm font-semibold text-primary-600 hover:underline active:text-primary-700 touch-manipulation"
            >
              {{ patient.phone }}
            </a>
            <p v-else class="text-sm font-semibold text-gray-900">-</p>
          </div>
          <div class="bg-gray-50/80 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 sm:py-1">
            <span class="text-xs text-gray-500 block">{{ t('patients.balance') }}</span>
            <p
              class="text-sm font-semibold"
              :class="balance >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ formatBalance(balance) }}
            </p>
          </div>
          <div v-if="patient.doctor_name && !isSolo" class="col-span-2 sm:col-span-1 bg-gray-50/80 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 sm:py-1">
            <span class="text-xs text-gray-500 block">{{ t('patientDetail.doctor') }}</span>
            <p class="text-sm font-semibold text-gray-900">{{ patient.doctor_name }}</p>
          </div>
          <div v-if="lastVisitStatus" class="col-span-2 sm:col-span-1 bg-gray-50/80 sm:bg-transparent rounded-xl sm:rounded-none p-3 sm:p-0 sm:py-1">
            <span class="text-xs text-gray-500 block">Oxirgi tashrif</span>
            <div class="mt-0.5">
              <VisitStatusBadge :status="lastVisitStatus.status" :visit="lastVisitStatus" :show-icon="false" />
            </div>
          </div>
        </div>

        <!-- Qarzdorlik Banner — full width on mobile -->
        <div v-if="totalDebt > 0" class="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <ExclamationCircleIcon class="w-5 h-5 text-red-600 flex-shrink-0" />
          <span class="text-sm font-medium text-red-700">
            Umumiy qarzdorlik: {{ formatCurrency(totalDebt) }}
          </span>
        </div>
      </div>

      <!-- Tabs — scroll-snap, touch-friendly on mobile -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div class="flex border-b border-gray-100 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[48px] text-sm font-medium transition-colors relative whitespace-nowrap snap-start touch-manipulation"
            :class="activeTab === tab.id
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'"
          >
            {{ t(tab.labelKey) }}
            <span v-if="tab.count" class="ml-1.5 sm:ml-2 px-2 py-0.5 text-xs bg-gray-200/80 text-gray-600 rounded-full">
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Tab Content — reduced padding on mobile -->
        <div class="p-4 sm:p-6">
          <!-- Tashriflar Tab -->
          <div v-if="activeTab === 'visits'">
            <PatientVisitsTable :patient-id="patient.id" />
          </div>

          <!-- Odontogramma Tab -->
          <div v-else-if="activeTab === 'odontogram'">
            <PatientOdontogramPlaceholder :patient-id="patient.id" :visit-id="selectedVisitId" />
          </div>

          <!-- To'lovlar Tab -->
          <div v-else-if="activeTab === 'payments'">
            <PatientPaymentsPlaceholder :patient-id="patient.id" />
          </div>

          <!-- Davolash rejasi Tab -->
          <div v-else-if="activeTab === 'plans'">
            <PatientTreatmentPlans :patient-id="patient.id" />
          </div>

          <!-- Hujjatlar Tab -->
          <div v-else-if="activeTab === 'documents'">
            <PatientDocumentsPlaceholder :patient-id="patient.id" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500">{{ t('patientDetail.notFound') }}</p>
      <button
        @click="$router.push('/patients')"
        class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        {{ t('patientDetail.backToList') }}
      </button>
    </div>

    <!-- Patient Status Change Modal (Admin only) -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showPatientStatusModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closePatientStatusModal"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">{{ t('patientDetail.changeStatusTitle') }}</h3>
                <button
                  @click="closePatientStatusModal"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon class="w-6 h-6" />
                </button>
              </div>

              <div class="space-y-4">
                <!-- Current Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Hozirgi status:</label>
                  <PatientStatusBadge v-if="patient" :status="patient.status || 'active'" />
                </div>

                <!-- New Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Yangi status:</label>
                  <select
                    v-model="newPatientStatus"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option
                      v-for="status in Object.values(PATIENT_STATUSES)"
                      :key="status"
                      :value="status"
                    >
                      {{ getPatientStatusLabel(status) }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                @click="updatePatientStatus"
                :disabled="updatingPatientStatus || !newPatientStatus"
                class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ updatingPatientStatus ? t('patientDetail.saving') : t('patientDetail.save') }}
              </button>
              <button
                @click="closePatientStatusModal"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import PatientVisitsTable from '@/components/patients/PatientVisitsTable.vue'
import PatientOdontogramPlaceholder from '@/components/patients/PatientOdontogramPlaceholder.vue'
import PatientPaymentsPlaceholder from '@/components/patients/PatientPaymentsPlaceholder.vue'
import PatientTreatmentPlans from '@/components/patients/PatientTreatmentPlans.vue'
import PatientDocumentsPlaceholder from '@/components/patients/PatientDocumentsPlaceholder.vue'
import PatientStatusBadge from '@/components/ui/PatientStatusBadge.vue'
import VisitStatusBadge from '@/components/ui/VisitStatusBadge.vue'
import { usePatientsStore } from '@/stores/patients'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { PATIENT_STATUSES, getPatientStatusLabel } from '@/constants/patientStatus'
import { ArrowLeftIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import * as visitsApi from '@/api/visitsApi'

const toast = useToast()
const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const patientsStore = usePatientsStore()
const authStore = useAuthStore()

const patient = ref(null)
const loading = ref(true)
const activeTab = ref('visits')
const lastVisitStatus = ref(null)
const totalDebt = ref(0)
const visits = ref([])
const showPatientStatusModal = ref(false)
const newPatientStatus = ref('')
const updatingPatientStatus = ref(false)

const tabs = [
  { id: 'visits', labelKey: 'patientDetail.tabVisits', count: null },
  { id: 'odontogram', labelKey: 'patientDetail.tabOdontogram', count: null },
  { id: 'payments', labelKey: 'patientDetail.tabPayments', count: null },
  { id: 'plans', labelKey: 'patientDetail.tabPlans', count: null },
  { id: 'documents', labelKey: 'patientDetail.tabDocuments', count: null },
]

const isAdmin = computed(() => authStore.userRole === 'admin' || authStore.userRole === 'solo')
const isSolo = computed(() => authStore.userRole === 'solo')
const isDoctor = computed(() => authStore.userRole === 'doctor')

const goBack = () => {
  if (isDoctor.value && !isSolo.value) {
    router.push('/my-patients')
    return
  }
  router.push('/patients')
}

// Oxirgi visit statusini yuklash
const loadLastVisit = async (patientId) => {
  try {
    const patientVisits = await visitsApi.getVisitsByPatientId(patientId)
    if (patientVisits && patientVisits.length > 0) {
      lastVisitStatus.value = patientVisits[0] // Eng oxirgisi
      visits.value = patientVisits
    } else {
      lastVisitStatus.value = null
      visits.value = []
    }
  } catch (error) {
    console.error('Failed to load visits:', error)
    lastVisitStatus.value = null
    visits.value = []
  }
}

// Umumiy qarzdorlikni hisoblash
const loadTotalDebt = async (patientId) => {
  try {
    totalDebt.value = await visitsApi.getPatientTotalDebt(patientId)
  } catch (error) {
    console.error('Failed to load total debt:', error)
    totalDebt.value = 0
  }
}

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', 'so\'m')
}

// Patient status o'zgartirish modalini ochish
const openPatientStatusModal = () => {
  if (!isAdmin.value) return
  newPatientStatus.value = patient.value?.status || 'active'
  showPatientStatusModal.value = true
}

const closePatientStatusModal = () => {
  showPatientStatusModal.value = false
  newPatientStatus.value = ''
}

// Patient status o'zgartirish
const updatePatientStatus = async () => {
  if (!isAdmin.value || !patient.value) return
  
  updatingPatientStatus.value = true
  try {
    await patientsStore.editPatient(patient.value.id, {
      status: newPatientStatus.value
    })
    patient.value.status = newPatientStatus.value
    toast.success(t('patientDetail.toastStatusUpdated'))
    closePatientStatusModal()
  } catch (error) {
    console.error('Failed to update patient status:', error)
    toast.error(t('patientDetail.errorStatusUpdate'))
  } finally {
    updatingPatientStatus.value = false
  }
}

const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const balance = computed(() => {
  const raw = patient.value?.balance ?? patient.value?.account_balance ?? patient.value?.current_balance ?? 0
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : 0
})

const formatBalance = (amount) => {
  const numeric = Number(amount)
  const safe = Number.isFinite(numeric) ? numeric : 0
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(safe)
}

onMounted(async () => {
  // Route query parametrlarini tekshirish (tab va visit)
  if (route.query.tab && tabs.find(t => t.id === route.query.tab)) {
    activeTab.value = route.query.tab
  }
  if (route.query.visit) {
    selectedVisitId.value = Number(route.query.visit) || null
  }
  
  // Route params har doim string bo'ladi, shuning uchun number formatga o'tkazamiz
  const patientIdParam = route.params.id
  const patientId = Number(patientIdParam)
  
  console.log('?? PatientDetailView mounted')
  console.log('?? Route param ID:', patientIdParam, 'Type:', typeof patientIdParam)
  console.log('?? Converted ID:', patientId, 'Type:', typeof patientId)
  
  // NaN tekshiruvi
  if (isNaN(patientId)) {
    console.error('? Invalid patient ID:', patientIdParam)
    loading.value = false
    return
  }
  
  // Avval store'dan bemorlarni yuklash (agar bo'sh bo'lsa)
  if (patientsStore.items.length === 0) {
    console.log('?? Store is empty, fetching patients...')
    try {
      await patientsStore.fetchPatients()
      console.log('? Patients fetched:', patientsStore.items.length)
    } catch (err) {
      console.warn('?? Failed to fetch patients list:', err)
    }
  } else {
    console.log('?? Store already has', patientsStore.items.length, 'patients')
  }

  try {
    console.log('?? Calling getPatientById with number ID:', patientId)
    
    // Avval store'dan qidirish
    patient.value = await patientsStore.getPatientById(patientId)
    console.log('?? Patient result from store:', patient.value)
    
    // Agar topilmasa, API'dan to'g'ridan-to'g'ri qidirish
    if (!patient.value) {
      console.log('?? Not found in store, trying direct API call...')
      try {
        const directPatient = await patientsStore.fetchPatientById(patientId)
        if (directPatient) {
          patient.value = directPatient
          console.log('? Found via direct API call:', directPatient)
        }
      } catch (apiErr) {
        console.warn('Direct API call failed:', apiErr)
      }
    }
    
    // Agar hali ham topilmasa, bemorlarni yangilash va qidirish
    if (!patient.value) {
      console.log('?? Patient still not found, refreshing store...')
      try {
        await patientsStore.fetchPatients()
        console.log('?? Store refreshed, now has', patientsStore.items.length, 'patients')
        patient.value = await patientsStore.getPatientById(patientId)
        console.log('?? Patient result after refresh:', patient.value)
      } catch (err) {
        console.warn('Failed to refresh:', err)
      }
    }
    
    if (!patient.value) {
      console.error('? Patient not found!')
      console.error('?? Looking for ID:', patientId, 'Type:', typeof patientId)
      console.error('?? Available IDs:', patientsStore.items.map(p => ({ id: p.id, name: p.full_name, type: typeof p.id })))
      console.error('?? Comparison test:')
      patientsStore.items.forEach(p => {
        const match = p.id === patientId || 
                      p.id === Number(patientId) || 
                      Number(p.id) === patientId ||
                      String(p.id) === String(patientId)
        console.log(`  ID ${p.id} (${typeof p.id}) === ${patientId} (${typeof patientId}): ${match}`)
      })
    } else {
      console.log('? Patient loaded successfully:', patient.value.full_name)
    }
    
    // Patient yuklangandan keyin visit va qarzdorlik ma'lumotlarini yuklash
    if (patient.value) {
      await Promise.all([
        loadLastVisit(patient.value.id),
        loadTotalDebt(patient.value.id)
      ])
    }
  } catch (error) {
    console.error('? Failed to load patient:', error)
  } finally {
    loading.value = false
  }
})

// Visit yangilanganda ma'lumotlarni yangilash
watch(() => patient.value?.id, async (newId) => {
  if (newId) {
    await Promise.all([
      loadLastVisit(newId),
      loadTotalDebt(newId)
    ])
  }
})
</script>
