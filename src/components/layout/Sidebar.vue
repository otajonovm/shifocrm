<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out',
      'w-64',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
      <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-600 shadow-lg">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ t('app.name') }}</h1>
        <p class="text-xs text-gray-500">{{ t('app.tagline') }}</p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.labelKey"
        :to="item.to"
        class="group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
        :class="[
          isActiveRoute(item.to)
            ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'
        ]"
      >
        <component
          :is="item.icon"
          class="w-5 h-5 transition-transform group-hover:scale-110"
          :class="isActiveRoute(item.to) ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'"
        />
        <span>{{ t(item.labelKey) }}</span>
        <span
          v-if="item.badge"
          class="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full"
          :class="item.badgeClass || 'bg-primary-100 text-primary-600'"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </nav>

    <!-- User Profile Card -->
    <div class="p-4 border-t border-gray-100">
      <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold text-sm">
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
          <span
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
            :class="roleBadgeClass"
          >
            {{ roleLabel }}
          </span>
        </div>
        <button
          @click="$emit('logout')"
          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          :title="t('common.logout')"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
    @click="$emit('close')"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'logout'])

const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Admin menu items
const adminMenuItems = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
  { labelKey: 'nav.patients', to: '/patients', icon: UsersIcon },
  { labelKey: 'nav.doctors', to: '/doctors', icon: UserGroupIcon },
  { labelKey: 'nav.appointments', to: '/appointments', icon: CalendarDaysIcon },
  { labelKey: 'nav.payments', to: '/payments', icon: CreditCardIcon },
  { labelKey: 'nav.services', to: '/services', icon: ClipboardDocumentListIcon },
  { labelKey: 'nav.reports', to: '/reports', icon: ChartBarIcon },
  { labelKey: 'nav.settings', to: '/settings', icon: Cog6ToothIcon },
]

// Doctor menu items
const doctorMenuItems = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
  { labelKey: 'nav.myPatients', to: '/my-patients', icon: UsersIcon },
  { labelKey: 'nav.myAppointments', to: '/my-appointments', icon: CalendarDaysIcon },
  { labelKey: 'nav.treatmentPlans', to: '/treatment-plans', icon: DocumentTextIcon },
  { labelKey: 'nav.doctorProfile', to: '/doctor/profile', icon: UserCircleIcon },
]

const menuItems = computed(() => {
  return authStore.userRole === 'admin' ? adminMenuItems : doctorMenuItems
})

const userName = computed(() => {
  if (authStore.userRole === 'admin') return t('role.admin')
  return authStore.userEmail || t('role.doctor')
})

const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const roleLabel = computed(() => {
  return authStore.userRole === 'admin' ? t('role.admin') : t('role.doctor')
})

const roleBadgeClass = computed(() => {
  return authStore.userRole === 'admin'
    ? 'bg-orange-100 text-orange-700'
    : 'bg-green-100 text-green-700'
})

const isActiveRoute = (to) => {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>
