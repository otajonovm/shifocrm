<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Leadlar</h1>
          <p class="text-sm text-gray-500">Bemor so'rovlari: ism, telefon, kelish vaqti</p>
        </div>
        <button
          type="button"
          class="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          @click="loadLeads"
        >
          Yangilash
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th class="px-4 py-3 text-left">Ism</th>
                <th class="px-4 py-3 text-left">Telefon</th>
                <th class="px-4 py-3 text-left">Qachon keladi</th>
                <th class="px-4 py-3 text-left">Izoh</th>
                <th class="px-4 py-3 text-left">Status</th>
                <th class="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td colspan="6" class="px-4 py-6 text-center text-gray-500">Yuklanmoqda...</td>
              </tr>
              <tr v-else-if="leads.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-gray-500">Hozircha leadlar yo'q</td>
              </tr>
              <tr v-for="lead in leads" :key="lead.id">
                <td class="px-4 py-3 font-medium text-gray-900">{{ lead.patient_name || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">{{ lead.phone || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">
                  {{ formatVisitDateTime(lead.preferred_date, lead.preferred_time) }}
                </td>
                <td class="px-4 py-3 text-gray-700 max-w-[280px] truncate" :title="lead.note || ''">
                  {{ lead.note || '-' }}
                </td>
                <td class="px-4 py-3">
                  <span :class="statusBadgeClass(lead.status)" class="inline-flex px-2 py-1 rounded-full text-xs font-semibold">
                    {{ getLeadStatusLabel(lead.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <select
                    class="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    :value="lead.status || 'new'"
                    @change="onChangeStatus(lead, $event.target.value)"
                  >
                    <option
                      v-for="statusOption in leadStatusOptions"
                      :key="statusOption.value"
                      :value="statusOption.value"
                    >
                      {{ statusOption.label }}
                    </option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { listLeadsByClinic, listLeadsByDoctor, updateLeadStatus, convertLeadToBooked, convertLeadToQabulda } from '@/api/leadsApi'

const authStore = useAuthStore()
const toast = useToast()

const leads = ref([])
const loading = ref(false)
const leadStatusOptions = [
  { value: 'new', label: 'Yangi' },
  { value: 'contacted', label: "Bog'langan" },
  { value: 'booked', label: 'Band qilingan' },
  { value: 'qabulda', label: 'Qabulda' },
  { value: 'rejected', label: 'Rad etilgan' },
]

const formatVisitDateTime = (date, time) => {
  if (!date && !time) return '-'
  if (date && time) return `${date} ${String(time).slice(0, 5)}`
  return date || String(time || '').slice(0, 5)
}

const statusBadgeClass = (status) => {
  const key = String(status || 'new').toLowerCase()
  if (key === 'qabulda') return 'bg-cyan-100 text-cyan-700'
  if (key === 'booked') return 'bg-emerald-100 text-emerald-700'
  if (key === 'contacted') return 'bg-blue-100 text-blue-700'
  if (key === 'rejected') return 'bg-rose-100 text-rose-700'
  if (key === 'expired') return 'bg-slate-100 text-slate-600'
  return 'bg-amber-100 text-amber-700'
}

const getLeadStatusLabel = (status) => {
  const key = String(status || 'new').toLowerCase()
  const found = leadStatusOptions.find(item => item.value === key)
  if (found) return found.label
  if (key === 'expired') return 'Muddati tugagan'
  return key || 'Yangi'
}

const loadLeads = async () => {
  loading.value = true
  try {
    if (authStore.userRole === 'doctor' || authStore.userRole === 'solo') {
      const doctorId = Number(authStore.user?.id)
      leads.value = Number.isFinite(doctorId) ? await listLeadsByDoctor(doctorId) : []
    } else {
      const clinicId = Number(authStore.userClinicId || authStore.user?.clinic_id)
      leads.value = Number.isFinite(clinicId) ? await listLeadsByClinic(clinicId) : []
    }
  } catch (error) {
    console.error('Failed to load leads:', error)
    toast.error("Leadlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

const onChangeStatus = async (lead, status) => {
  const leadId = Number(lead?.id)
  if (!Number.isFinite(leadId)) return
  try {
    let updated = null
    if (status === 'booked') {
      const result = await convertLeadToBooked(lead)
      updated = result?.lead || null
    } else if (status === 'qabulda') {
      const result = await convertLeadToQabulda(lead)
      updated = result?.lead || null
    } else {
      updated = await updateLeadStatus(leadId, status)
    }

    const index = leads.value.findIndex(item => Number(item.id) === leadId)
    if (index >= 0) {
      leads.value[index] = { ...leads.value[index], ...(updated || {}), status }
    }
    if (status === 'booked') {
      toast.success('Band qilindi va qabul yaratildi')
    } else if (status === 'qabulda') {
      toast.success('Bemor qabulda holatiga o‘tkazildi')
    } else {
      toast.success('Status yangilandi')
    }
  } catch (error) {
    console.error('Failed to update lead status:', error)
    toast.error(error?.message || 'Statusni yangilab bo\'lmadi')
  }
}

onMounted(loadLeads)
</script>
