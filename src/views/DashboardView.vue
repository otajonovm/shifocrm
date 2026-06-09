<template>
  <MainLayout>
    <AdminDashboard v-if="isAdmin" />
    <DoctorDashboard v-else-if="isDoctor" />
    <SoloDashboard v-else-if="isSolo" />
    <div v-else class="bg-white rounded-lg shadow-md p-6">
      <p class="text-sm text-gray-600">{{ t('dashboard.overview') }}</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { isAdminLike, isDoctor as hasDoctorRole, isSolo as hasSoloRole } from '@/lib/roles'
import MainLayout from '@/layouts/MainLayout.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import DoctorDashboard from '@/views/DoctorDashboard.vue'
import SoloDashboard from '@/views/SoloDashboard.vue'

const authStore = useAuthStore()
const { t } = useI18n()
const isAdmin = computed(() => isAdminLike(authStore))
const isDoctor = computed(() => hasDoctorRole(authStore))
const isSolo = computed(() => hasSoloRole(authStore))
</script>
