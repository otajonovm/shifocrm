<template>
  <MainLayout>
    <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('services.title') }}</h1>
          <p class="text-sm sm:text-base text-gray-500 mt-0.5">{{ t('services.subtitle') }}</p>
        </div>
        <button
          v-if="activeTab === 'services'"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl transition-all touch-manipulation min-h-[44px]"
          @click="openServiceModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newService') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div class="flex border-b border-gray-100 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[48px] text-sm font-medium transition-colors relative snap-start touch-manipulation"
            :class="activeTab === tab.id
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'"
          >
            {{ t(tab.label) }}
          </button>
        </div>

        <div class="p-4 sm:p-6">
          <!-- Services tab -->
          <div v-if="activeTab === 'services'" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-4">
              <input
                v-model="filters.search"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                :placeholder="t('services.searchPlaceholder')"
              />
              <select v-model="filters.category" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">{{ t('services.allCategories') }}</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
              <select v-model="filters.status" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">{{ t('services.allStatuses') }}</option>
                <option value="active">{{ t('services.active') }}</option>
                <option value="inactive">{{ t('services.inactive') }}</option>
              </select>
              <button class="rounded-lg border border-gray-200 px-3 py-2 text-sm" @click="resetFilters">
                {{ t('services.clearFilters') }}
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('services.name') }}</th>
                    <th class="px-4 py-3">{{ t('services.category') }}</th>
                    <th class="px-4 py-3">{{ t('services.price') }}</th>
                    <th class="px-4 py-3">{{ t('services.duration') }}</th>
                    <th class="px-4 py-3">{{ t('services.odontogram') }}</th>
                    <th class="px-4 py-3">{{ t('services.status') }}</th>
                    <th class="px-4 py-3 text-right">{{ t('services.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.services">
                    <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('services.loading') }}</td>
                  </tr>
                  <tr v-else-if="filteredServices.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('services.noServices') }}</td>
                  </tr>
                  <tr v-for="service in filteredServices" :key="service.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ service.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ service.category || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(service.base_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ service.duration_minutes || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span v-if="service.show_in_odontogram" class="inline-flex items-center gap-1.5">
                        <span
                          class="w-4 h-4 rounded-full flex-shrink-0"
                          :class="odontogramColorClass(service.odontogram_color)"
                        ></span>
                        <span class="text-xs">{{ t('services.yes') }}</span>
                      </span>
                      <span v-else class="text-slate-400 text-xs">{{ t('services.no') }}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="service.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ service.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          class="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          :title="t('services.edit')"
                          @click="openServiceModal(service)"
                        >
                          <PencilSquareIcon class="w-5 h-5" />
                        </button>
                        <button
                          class="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          :title="t('services.delete')"
                          @click="deleteServiceRow(service)"
                        >
                          <TrashIcon class="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Stats tab -->
          <div v-else-if="activeTab === 'stats'" class="space-y-6">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200 bg-white">
                <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  {{ t('services.topServices') }}
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th class="px-4 py-3">{{ t('services.name') }}</th>
                        <th class="px-4 py-3">{{ t('services.totalCount') }}</th>
                        <th class="px-4 py-3">{{ t('services.totalRevenue') }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-if="loading.stats">
                        <td class="px-4 py-4 text-slate-500" colspan="3">{{ t('services.loading') }}</td>
                      </tr>
                      <tr v-else-if="topServices.length === 0">
                        <td class="px-4 py-4 text-slate-500" colspan="3">{{ t('services.noStats') }}</td>
                      </tr>
                      <tr v-for="row in topServices" :key="row.service_id" class="bg-white">
                        <td class="px-4 py-3 text-slate-700">{{ row.service_name }}</td>
                        <td class="px-4 py-3 text-slate-700">{{ row.total_count }}</td>
                        <td class="px-4 py-3 text-slate-700">{{ formatCurrency(row.total_revenue) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white">
                <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  {{ t('services.monthlyRevenue') }}
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th class="px-4 py-3">{{ t('services.month') }}</th>
                        <th class="px-4 py-3">{{ t('services.totalRevenue') }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-if="loading.stats">
                        <td class="px-4 py-4 text-slate-500" colspan="2">{{ t('services.loading') }}</td>
                      </tr>
                      <tr v-else-if="monthlyRevenue.length === 0">
                        <td class="px-4 py-4 text-slate-500" colspan="2">{{ t('services.noStats') }}</td>
                      </tr>
                      <tr v-for="row in monthlyRevenue" :key="row.month" class="bg-white">
                        <td class="px-4 py-3 text-slate-700">{{ row.month }}</td>
                        <td class="px-4 py-3 text-slate-700">{{ formatCurrency(row.total_revenue) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Service modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.service" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeServiceModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ serviceForm.id ? t('services.editService') : t('services.newService') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeServiceModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.name') }}</label>
                  <input v-model="serviceForm.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.namePlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.category') }}</label>
                  <input v-model="serviceForm.category" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('services.categoryPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.price') }}</label>
                  <input v-model="serviceForm.base_price" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.duration') }}</label>
                  <input v-model="serviceForm.duration_minutes" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div class="flex items-center gap-3 mt-2">
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input v-model="serviceForm.requires_tooth" type="checkbox" class="rounded border-gray-300" />
                    {{ t('services.requiresTooth') }}
                  </label>
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input v-model="serviceForm.is_active" type="checkbox" class="rounded border-gray-300" />
                    {{ t('services.active') }}
                  </label>
                </div>
                <div class="rounded-lg border border-primary-100 bg-primary-50/30 p-4 space-y-3">
                  <h4 class="text-sm font-medium text-gray-700">{{ t('services.odontogramSection') }}</h4>
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input v-model="serviceForm.show_in_odontogram" type="checkbox" class="rounded border-gray-300" />
                    {{ t('services.showInOdontogram') }}
                  </label>
                  <div v-if="serviceForm.show_in_odontogram">
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.odontogramColor') }}</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="opt in odontogramColorOptions"
                        :key="opt.value"
                        type="button"
                        class="w-8 h-8 rounded-full border-2 transition-all"
                        :class="[
                          opt.bgClass,
                          serviceForm.odontogram_color === opt.value ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent hover:border-gray-300'
                        ]"
                        :title="opt.label"
                        @click="serviceForm.odontogram_color = opt.value"
                      />
                    </div>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.notes') }}</label>
                  <textarea v-model="serviceForm.description" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"></textarea>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeServiceModal">
                {{ t('services.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveService">
                {{ t('services.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import {
  listServices,
  createService,
  updateService,
  deleteService,
  getTopServices,
  getServiceRevenueMonthly
} from '@/api/servicesApi'

const { t } = useI18n()
const toast = useToast()

const tabs = [
  { id: 'services', label: 'services.tabServices' },
  { id: 'stats', label: 'services.tabStats' }
]

const activeTab = ref('services')
const services = ref([])
const topServices = ref([])
const monthlyRevenue = ref([])

const loading = ref({
  services: false,
  stats: false
})

const filters = ref({
  search: '',
  category: '',
  status: ''
})

const modals = ref({
  service: false
})

const serviceForm = ref({
  id: null,
  name: '',
  category: '',
  base_price: '',
  duration_minutes: '',
  requires_tooth: false,
  is_active: true,
  description: '',
  show_in_odontogram: false,
  odontogram_color: 'cyan'
})

const odontogramColorOptions = [
  { value: 'red', label: 'Qizil', bgClass: 'bg-red-500' },
  { value: 'blue', label: 'Ko\'k', bgClass: 'bg-blue-500' },
  { value: 'amber', label: 'Sariq', bgClass: 'bg-amber-500' },
  { value: 'emerald', label: 'Yashil', bgClass: 'bg-emerald-500' },
  { value: 'cyan', label: 'Moviy', bgClass: 'bg-cyan-500' },
  { value: 'violet', label: 'Binafsha', bgClass: 'bg-violet-500' },
  { value: 'rose', label: 'Qizg\'ish', bgClass: 'bg-rose-500' },
  { value: 'slate', label: 'Kulrang', bgClass: 'bg-slate-500' }
]

const odontogramColorClass = (color) => {
  const opt = odontogramColorOptions.find(o => o.value === (color || 'cyan'))
  return opt ? opt.bgClass : 'bg-cyan-500'
}


const categories = computed(() => {
  const set = new Set()
  services.value.forEach(service => {
    if (service.category) set.add(service.category)
  })
  return Array.from(set)
})

const filteredServices = computed(() => {
  const search = filters.value.search.trim().toLowerCase()
  return services.value.filter(service => {
    if (search && !service.name?.toLowerCase().includes(search)) return false
    if (filters.value.category && service.category !== filters.value.category) return false
    if (filters.value.status) {
      const isActive = filters.value.status === 'active'
      if (Boolean(service.is_active) !== isActive) return false
    }
    return true
  })
})

const resetFilters = () => {
  filters.value = { search: '', category: '', status: '' }
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const formatDiscount = (type, value) => {
  if (type === 'percent') return `${value}%`
  return formatCurrency(value)
}

const serviceName = (serviceId) => {
  const match = services.value.find(item => Number(item.id) === Number(serviceId))
  return match ? match.name : `#${serviceId}`
}

const formatScope = (rule) => {
  if (rule.scope === 'service' && rule.service_id) return `${t('services.scopeService')}: ${serviceName(rule.service_id)}`
  if (rule.scope === 'category' && rule.category) return `${t('services.scopeCategory')}: ${rule.category}`
  if (rule.scope === 'package' && rule.package_id) {
    const pkg = packages.value.find(item => Number(item.id) === Number(rule.package_id))
    return `${t('services.scopePackage')}: ${pkg?.name || `#${rule.package_id}`}`
  }
  return t(`services.scopeLabel.${rule.scope}`)
}

const loadServices = async () => {
  loading.value.services = true
  try {
    services.value = await listServices('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load services:', error)
    services.value = []
  } finally {
    loading.value.services = false
  }
}


const loadStats = async () => {
  loading.value.stats = true
  try {
    const [top, monthly] = await Promise.all([
      getTopServices('order=total_revenue.desc&limit=10'),
      getServiceRevenueMonthly('order=month.desc&limit=6')
    ])
    topServices.value = top || []
    monthlyRevenue.value = monthly || []
  } catch (error) {
    console.error('Failed to load stats:', error)
    topServices.value = []
    monthlyRevenue.value = []
  } finally {
    loading.value.stats = false
  }
}

const openServiceModal = (service = null) => {
  if (service) {
    serviceForm.value = {
      id: service.id,
      name: service.name || '',
      category: service.category || '',
      base_price: service.base_price ?? '',
      duration_minutes: service.duration_minutes ?? '',
      requires_tooth: Boolean(service.requires_tooth),
      is_active: Boolean(service.is_active),
      description: service.description || '',
      show_in_odontogram: Boolean(service.show_in_odontogram),
      odontogram_color: service.odontogram_color || 'cyan'
    }
  } else {
    serviceForm.value = {
      id: null,
      name: '',
      category: '',
      base_price: '',
      duration_minutes: '',
      requires_tooth: false,
      is_active: true,
      description: '',
      show_in_odontogram: false,
      odontogram_color: 'cyan'
    }
  }
  modals.value.service = true
}

const closeServiceModal = () => {
  modals.value.service = false
}

const saveService = async () => {
  if (!serviceForm.value.name) {
    toast.error(t('services.errorNameRequired'))
    return
  }
  const basePayload = {
    name: serviceForm.value.name,
    category: serviceForm.value.category || null,
    base_price: Number(serviceForm.value.base_price) || 0,
    duration_minutes: serviceForm.value.duration_minutes ? Number(serviceForm.value.duration_minutes) : null,
    requires_tooth: Boolean(serviceForm.value.requires_tooth),
    is_active: Boolean(serviceForm.value.is_active),
    description: serviceForm.value.description || null
  }
  const payloadWithOdontogram = {
    ...basePayload,
    show_in_odontogram: Boolean(serviceForm.value.show_in_odontogram),
    odontogram_color: serviceForm.value.odontogram_color || 'cyan'
  }

  const trySave = async (p) => {
    if (serviceForm.value.id) {
      await updateService(serviceForm.value.id, p)
    } else {
      await createService(p)
    }
  }

  try {
    try {
      await trySave(payloadWithOdontogram)
    } catch (err) {
      const msg = String(err?.message || err)
      if (msg.includes('odontogram_color') || msg.includes('show_in_odontogram') || msg.includes('schema cache')) {
        await trySave(basePayload)
        toast.info(t('services.migrationOdontogramHint'))
      } else {
        throw err
      }
    }
    toast.success(serviceForm.value.id ? t('services.toastUpdated') : t('services.toastCreated'))
    await loadServices()
    closeServiceModal()
  } catch (error) {
    console.error('Failed to save service:', error)
    toast.error(t('services.errorSave'))
  }
}

const deleteServiceRow = async (service) => {
  if (!window.confirm(t('services.confirmDelete'))) return
  try {
    await deleteService(service.id)
    toast.success(t('services.toastDeleted'))
    await loadServices()
  } catch (error) {
    console.error('Failed to delete service:', error)
    toast.error(t('services.errorDelete'))
  }
}


onMounted(async () => {
  await Promise.all([loadServices(), loadStats()])
})
</script>
