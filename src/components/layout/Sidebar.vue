<template>
  <!-- display:contents — bitta root (vue-inspector) va layout buzilmasin -->
  <div class="contents">
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-64',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo + collapse toggle -->
    <div
      class="relative flex items-center border-b border-gray-100"
      :class="collapsed ? 'justify-center px-2 py-4' : 'gap-3 px-6 py-5'"
    >
      <div class="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
        <img
          v-if="clinicStore.isCustomLogo"
          :src="clinicStore.logoUrl"
          alt="Logo"
          class="w-full h-full object-contain"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-cyan-600"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      </div>
      <div v-if="!collapsed" class="min-w-0 flex-1 pr-8">
        <h1 class="text-xl font-bold text-gray-900 truncate">{{ clinicStore.displayName }}</h1>
        <p class="text-xs text-gray-500">{{ t('common.medicalSystem') }}</p>
      </div>

      <button
        type="button"
        class="hidden lg:flex absolute top-1/2 -translate-y-1/2 items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-colors shadow-sm"
        :class="collapsed ? 'right-1' : 'right-3'"
        :title="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        :aria-label="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        @click="$emit('toggle-collapse')"
      >
        <ChevronLeftIcon v-if="!collapsed" class="w-4 h-4" />
        <ChevronRightIcon v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-6 space-y-1 overflow-y-auto" :class="collapsed ? 'px-2' : 'px-4'">
      <router-link
        v-for="item in menuItems"
        :key="item.labelKey"
        :to="item.to"
        :title="collapsed ? t(item.labelKey) : undefined"
        class="group flex items-center text-sm font-medium rounded-xl transition-all duration-200"
        :class="[
          collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
          isActiveRoute(item.to)
            ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'
        ]"
      >
        <component
          :is="item.icon"
          class="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110"
          :class="isActiveRoute(item.to) ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'"
        />
        <span v-if="!collapsed" class="truncate">{{ t(item.labelKey) }}</span>
        <span
          v-if="!collapsed && item.badge"
          class="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full"
          :class="item.badgeClass || 'bg-primary-100 text-primary-600'"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </nav>

    <!-- User Profile Card -->
    <div class="border-t border-gray-100" :class="collapsed ? 'p-2' : 'p-4'">
      <div
        v-if="authStore.isImpersonating && !collapsed"
        class="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
      >
        <p class="text-xs font-semibold text-amber-900">Super Admin: klinika rejimi</p>
        <div class="mt-2 flex items-center gap-2">
          <router-link
            to="/admin/clinics"
            class="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-white border border-amber-200 rounded-lg hover:bg-amber-100"
          >
            Admin panel
          </router-link>
          <button
            type="button"
            class="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
            @click="exitClinicSession"
          >
            Chiqish
          </button>
        </div>
      </div>

      <div
        class="flex items-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
        :class="collapsed ? 'justify-center p-2' : 'gap-3 p-3 cursor-pointer'"
      >
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold text-sm flex-shrink-0">
          {{ userInitials }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
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
          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
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
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useClinicStore } from '@/stores/clinic'
import { useDoctorPermissionsStore } from '@/stores/doctorPermissions'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import { getEmployeeById } from '@/api/employeesApi'
import { getDoctorById } from '@/api/doctorsApi'
import { useI18n } from 'vue-i18n'
import {
  getDisplayUserName,
  getRoleBadgeClass,
  getRoleLabel,
  isAdminLike,
  isSolo,
  canManageStaff,
  canAccessWarehouse,
  ROLES,
} from '@/lib/roles'
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  InboxIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'logout', 'toggle-collapse'])

const route = useRoute()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const doctorPermsStore = useDoctorPermissionsStore()
const employeePermsStore = useEmployeePermissionsStore()
const { t } = useI18n()

onMounted(async () => {
  if (authStore.userClinicId != null) {
    await clinicStore.loadFromClinicId(authStore.userClinicId)
  }

  if (authStore.userRole === ROLES.ADMIN && authStore.user?.employee_id) {
    try {
      const employee = await getEmployeeById(authStore.user.employee_id)
      if (employee) {
        employeePermsStore.loadFromEmployee(employee)
      }
    } catch {
      // ruxsatlar keyinroq yuklanadi
    }
  }

  if (
    (authStore.userRole === ROLES.DOCTOR || authStore.userRole === ROLES.SOLO)
    && authStore.user?.id
  ) {
    try {
      const doctor = await getDoctorById(authStore.user.id)
      doctorPermsStore.loadFromDoctor(doctor || authStore.user, authStore.userClinicId)
    } catch {
      doctorPermsStore.loadFromDoctor(authStore.user, authStore.userClinicId)
    }
  }
})

const adminLike = computed(() => isAdminLike(authStore))

const adminMenuItems = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
  { labelKey: 'nav.patients', to: '/patients', icon: UsersIcon },
  { labelKey: 'nav.staff', to: '/staff', icon: UsersIcon },
  { labelKey: 'nav.appointments', to: '/appointments', icon: CalendarDaysIcon },
  { labelKey: 'nav.leads', to: '/leads', icon: InboxIcon },
  { labelKey: 'nav.payments', to: '/payments', icon: CreditCardIcon },
  { labelKey: 'nav.services', to: '/services', icon: ClipboardDocumentListIcon },
  { labelKey: 'nav.inventory', to: '/inventory', icon: BuildingStorefrontIcon, warehouseOnly: true },
  { labelKey: 'nav.reports', to: '/reports', icon: ChartBarIcon },
  { labelKey: 'nav.settings', to: '/settings', icon: Cog6ToothIcon },
]

const soloMenuItems = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
  { labelKey: 'nav.patients', to: '/patients', icon: UsersIcon },
  { labelKey: 'nav.appointments', to: '/appointments', icon: CalendarDaysIcon },
  { labelKey: 'nav.myLeads', to: '/my-leads', icon: InboxIcon },
  { labelKey: 'nav.payments', to: '/payments', icon: CreditCardIcon },
  { labelKey: 'nav.services', to: '/services', icon: ClipboardDocumentListIcon },
  { labelKey: 'nav.reports', to: '/reports', icon: ChartBarIcon },
  { labelKey: 'nav.treatmentPlans', to: '/treatment-plans', icon: DocumentTextIcon },
  { labelKey: 'nav.doctorProfile', to: '/doctor/profile', icon: UserCircleIcon },
  { labelKey: 'nav.settings', to: '/settings', icon: Cog6ToothIcon },
]

const allDoctorMenuItems = [
  { labelKey: 'nav.dashboard',       to: '/dashboard',        icon: HomeIcon,                 permKey: 'can_view_dashboard' },
  { labelKey: 'nav.myPatients',      to: '/patients',         icon: UsersIcon,                permKey: 'can_view_patients' },
  { labelKey: 'nav.myAppointments',  to: '/my-appointments',  icon: CalendarDaysIcon,         permKey: 'can_view_appointments' },
  { labelKey: 'nav.myLeads',         to: '/my-leads',         icon: InboxIcon,                permKey: 'can_view_leads' },
  { labelKey: 'nav.treatmentPlans',  to: '/treatment-plans',  icon: DocumentTextIcon,         permKey: 'can_view_treatment_plans' },
  { labelKey: 'nav.doctorProfile',   to: '/doctor/profile',   icon: UserCircleIcon,           permKey: 'can_edit_profile' },
]

const doctorMenuItems = computed(() => {
  const doctorId = authStore.user?.id
  if (!doctorId) return allDoctorMenuItems
  return allDoctorMenuItems.filter(item => {
    return doctorPermsStore.hasPermission(doctorId, item.permKey)
  })
})

const menuItems = computed(() => {
  if (isSolo(authStore)) return soloMenuItems
  if (adminLike.value) {
    const base = adminMenuItems.filter(item => {
      if (item.warehouseOnly) return canAccessWarehouse(authStore)
      return true
    })
    if (canManageStaff(authStore)) {
      return [
        ...base,
        { labelKey: 'nav.audit', to: '/audit', icon: ShieldCheckIcon },
      ]
    }
    return base
  }
  return doctorMenuItems.value
})

const userName = computed(() => getDisplayUserName(authStore, t))

const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
})

const roleLabel = computed(() => getRoleLabel(authStore, t))

const roleBadgeClass = computed(() => getRoleBadgeClass(authStore))

const isActiveRoute = (to) => {
  return route.path === to || route.path.startsWith(to + '/')
}

const exitClinicSession = () => {
  authStore.stopClinicSession()
  clinicStore.clearClinicName()
  clinicStore.clearLogo()
}
</script>
