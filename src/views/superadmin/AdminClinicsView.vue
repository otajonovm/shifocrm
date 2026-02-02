<template>
  <SuperAdminLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('superAdmin.clinicsListTitle') }}</h1>
          <p class="text-gray-500">{{ t('superAdmin.clinicsListSubtitle') }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <router-link
            :to="{ name: 'admin-solo-doctor-new' }"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow hover:bg-emerald-700 hover:shadow-lg transition-all"
          >
            <UserPlusIcon class="w-5 h-5" />
            {{ t('soloDoctor.createButton') }}
          </router-link>
          <router-link
            :to="{ name: 'admin-clinics-new' }"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('superAdmin.newClinic') }}
          </router-link>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div v-if="loading" class="p-12 text-center text-gray-500">
          {{ t('superAdmin.loading') }}
        </div>
        <div v-else-if="error" class="p-12 text-center text-rose-600">
          {{ error }}
        </div>
        <div v-else-if="!clinicsWithCounts.length" class="p-12 text-center text-gray-500">
          {{ t('superAdmin.noClinics') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.logo') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.clinicId') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.name') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.adminLogin') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.createdAt') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.status') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.doctorCount') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{{ t('superAdmin.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="c in clinicsWithCounts" :key="c.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img v-if="c.logo_url" :src="c.logo_url" alt="" class="w-full h-full object-contain" />
                    <span v-else class="text-gray-400 text-xs">—</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <code class="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{{ c.id }}</code>
                </td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ c.name }}</td>
                <td class="px-4 py-3">
                  <code v-if="c.adminLogin" class="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{{ c.adminLogin }}</code>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ formatDate(c.created_at) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'"
                  >
                    {{ c.is_active ? t('superAdmin.active') : t('superAdmin.inactive') }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ c.doctorCount ?? '—' }} / {{ c.max_doctors ?? 4 }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 mr-2"
                    @click="enterClinic(c)"
                  >
                    Kirish
                  </button>
                  <router-link
                    :to="{ name: 'admin-clinics-edit', params: { id: c.id } }"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
                  >
                    <PencilSquareIcon class="w-4 h-4" />
                    {{ t('superAdmin.edit') }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SuperAdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import { listClinics, getDoctorCountByClinic, getClinicAdminByClinic } from '@/services/adminService'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useClinicStore } from '@/stores/clinic'
import { PlusIcon, PencilSquareIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const loading = ref(true)
const error = ref(null)
const clinicsWithCounts = ref([])

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return String(val)
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const list = await listClinics()
    const withCounts = await Promise.all(
      list.map(async (c) => {
        let n = 0
        let adminLogin = null
        try {
          n = await getDoctorCountByClinic(c.id)
        } catch {}
        try {
          const admin = await getClinicAdminByClinic(c.id)
          adminLogin = admin?.login || null
        } catch {}
        return { ...c, doctorCount: n, adminLogin }
      })
    )
    clinicsWithCounts.value = withCounts
  } catch (e) {
    error.value = e?.message || t('superAdmin.errorLoad')
  } finally {
    loading.value = false
  }
})

async function enterClinic(c) {
  if (!c?.id) return
  // start clinic session (super admin impersonation)
  authStore.startClinicSession(Number(c.id))
  clinicStore.setClinicName(c.name || '')
  if (c.logo_url) clinicStore.setLogo(c.logo_url)
  else clinicStore.clearLogo()
  await router.push('/dashboard')
}
</script>
