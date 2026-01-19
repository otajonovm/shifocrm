<template>
  <MainLayout>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="patient" class="space-y-6 animate-fade-in">
      <!-- Patient Profile Header -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
              {{ getInitials(patient.full_name) }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ patient.full_name }}</h1>
              <div class="flex items-center gap-6 mt-2">
                <div>
                  <span class="text-xs text-gray-500">MED ID</span>
                  <p class="text-sm font-semibold text-gray-900">{{ patient.med_id || `#${patient.id}` }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">Telefon</span>
                  <p class="text-sm font-semibold text-gray-900">{{ patient.phone || '-' }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-500">Balans</span>
                  <p class="text-sm font-semibold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatBalance(balance) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            @click="$router.push('/patients')"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Orqaga"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div class="flex border-b border-gray-100">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-6 py-4 text-sm font-medium transition-colors relative"
            :class="activeTab === tab.id
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Tashriflar Tab -->
          <div v-if="activeTab === 'visits'">
            <PatientVisitsTable :patient-id="patient.id" />
          </div>

          <!-- Odontogramma Tab -->
          <div v-else-if="activeTab === 'odontogram'">
            <PatientOdontogramPlaceholder :patient-id="patient.id" />
          </div>

          <!-- To'lovlar Tab -->
          <div v-else-if="activeTab === 'payments'">
            <PatientPaymentsPlaceholder :patient-id="patient.id" />
          </div>

          <!-- Hujjatlar Tab -->
          <div v-else-if="activeTab === 'documents'">
            <PatientDocumentsPlaceholder :patient-id="patient.id" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500">Bemor topilmadi</p>
      <button
        @click="$router.push('/patients')"
        class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
      >
        Bemorlar ro'yxatiga qaytish
      </button>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import PatientVisitsTable from '@/components/patients/PatientVisitsTable.vue'
import PatientOdontogramPlaceholder from '@/components/patients/PatientOdontogramPlaceholder.vue'
import PatientPaymentsPlaceholder from '@/components/patients/PatientPaymentsPlaceholder.vue'
import PatientDocumentsPlaceholder from '@/components/patients/PatientDocumentsPlaceholder.vue'
import { usePatientsStore } from '@/stores/patients'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const patientsStore = usePatientsStore()

const patient = ref(null)
const loading = ref(true)
const activeTab = ref('visits')

const tabs = [
  { id: 'visits', label: 'Tashriflar', count: null },
  { id: 'odontogram', label: 'Odontogramma', count: null },
  { id: 'payments', label: 'To\'lovlar', count: null },
  { id: 'documents', label: 'Hujjatlar', count: null },
]

const balance = computed(() => {
  // TODO: Calculate balance from payments
  return 0
})

const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const formatBalance = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(amount)
}

onMounted(async () => {
  // Route params har doim string bo'ladi, shuning uchun number formatga o'tkazamiz
  const patientIdParam = route.params.id
  const patientId = Number(patientIdParam)
  
  console.log('🚀 PatientDetailView mounted')
  console.log('📋 Route param ID:', patientIdParam, 'Type:', typeof patientIdParam)
  console.log('🔢 Converted ID:', patientId, 'Type:', typeof patientId)
  
  // NaN tekshiruvi
  if (isNaN(patientId)) {
    console.error('❌ Invalid patient ID:', patientIdParam)
    loading.value = false
    return
  }
  
  // Avval store'dan bemorlarni yuklash (agar bo'sh bo'lsa)
  if (patientsStore.items.length === 0) {
    console.log('📥 Store is empty, fetching patients...')
    try {
      await patientsStore.fetchPatients()
      console.log('✅ Patients fetched:', patientsStore.items.length)
    } catch (err) {
      console.warn('⚠️ Failed to fetch patients list:', err)
    }
  } else {
    console.log('📦 Store already has', patientsStore.items.length, 'patients')
  }

  try {
    console.log('🔍 Calling getPatientById with number ID:', patientId)
    
    // Avval store'dan qidirish
    patient.value = await patientsStore.getPatientById(patientId)
    console.log('📋 Patient result from store:', patient.value)
    
    // Agar topilmasa, API'dan to'g'ridan-to'g'ri qidirish
    if (!patient.value) {
      console.log('⚠️ Not found in store, trying direct API call...')
      try {
        const directPatient = await patientsStore.fetchPatientById(patientId)
        if (directPatient) {
          patient.value = directPatient
          console.log('✅ Found via direct API call:', directPatient)
        }
      } catch (apiErr) {
        console.warn('Direct API call failed:', apiErr)
      }
    }
    
    // Agar hali ham topilmasa, bemorlarni yangilash va qidirish
    if (!patient.value) {
      console.log('⚠️ Patient still not found, refreshing store...')
      try {
        await patientsStore.fetchPatients()
        console.log('📦 Store refreshed, now has', patientsStore.items.length, 'patients')
        patient.value = await patientsStore.getPatientById(patientId)
        console.log('📋 Patient result after refresh:', patient.value)
      } catch (err) {
        console.warn('Failed to refresh:', err)
      }
    }
    
    if (!patient.value) {
      console.error('❌ Patient not found!')
      console.error('🔍 Looking for ID:', patientId, 'Type:', typeof patientId)
      console.error('📋 Available IDs:', patientsStore.items.map(p => ({ id: p.id, name: p.full_name, type: typeof p.id })))
      console.error('🔢 Comparison test:')
      patientsStore.items.forEach(p => {
        const match = p.id === patientId || 
                      p.id === Number(patientId) || 
                      Number(p.id) === patientId ||
                      String(p.id) === String(patientId)
        console.log(`  ID ${p.id} (${typeof p.id}) === ${patientId} (${typeof patientId}): ${match}`)
      })
    } else {
      console.log('✅ Patient loaded successfully:', patient.value.full_name)
    }
  } catch (error) {
    console.error('❌ Failed to load patient:', error)
  } finally {
    loading.value = false
  }
})
</script>
