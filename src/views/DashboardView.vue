<template>
  <!-- Admin Dashboard -->
  <AdminLayout v-if="authStore.userRole === 'admin'">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AdminDashboardCard
        title="Manage Doctors"
        description="Create and manage doctor profiles"
        :to="{ name: 'doctors' }"
        :icon="doctorsIcon"
      />
      <AdminDashboardCard
        title="Patients"
        description="Coming soon"
        :icon="patientsIcon"
      />
      <AdminDashboardCard
        title="Appointments"
        description="Coming soon"
        :icon="appointmentsIcon"
      />
    </div>
  </AdminLayout>

  <!-- Doctor Dashboard -->
  <DoctorLayout v-else-if="authStore.userRole === 'doctor'">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DoctorDashboardCard
        title="My Profile"
        description="View and edit your profile"
        :to="{ name: 'doctor-profile' }"
        :icon="profileIcon"
      />
      <DoctorDashboardCard
        title="My Appointments"
        description="Coming soon"
        :icon="appointmentsIcon"
      />
      <DoctorDashboardCard
        title="My Patients"
        description="Coming soon"
        :icon="patientsIcon"
      />
    </div>
  </DoctorLayout>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import DoctorLayout from '@/layouts/DoctorLayout.vue'
import AdminDashboardCard from '@/components/admin/AdminDashboardCard.vue'
import DoctorDashboardCard from '@/components/doctor/DoctorDashboardCard.vue'

const authStore = useAuthStore()

// SVG icons as strings
const doctorsIcon = '<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
const patientsIcon = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>'
const appointmentsIcon = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
const profileIcon = '<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
</script>
