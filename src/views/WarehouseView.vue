<template>
  <MainLayout>
    <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6">
      <!-- Sarlavha -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('inventory.title') }}</h1>
          <p class="text-sm sm:text-base text-gray-500 mt-0.5">{{ t('inventory.subtitle') }}</p>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl transition-all touch-manipulation min-h-[44px]"
          @click="openAddModal"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('inventory.addItem') }}
        </button>
      </div>

      <!-- Kritik holat widgeti -->
      <div
        class="rounded-2xl border-2 p-4 sm:p-5 transition-colors"
        :class="criticalItems.length > 0
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50'
          : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            :class="criticalItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'"
          >
            <ExclamationTriangleIcon v-if="criticalItems.length > 0" class="w-6 h-6" />
            <CheckCircleIcon v-else class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base sm:text-lg font-semibold text-gray-900">
                {{ t('inventory.criticalTitle') }}
              </h2>
              <span
                v-if="criticalItems.length > 0"
                class="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white"
              >
                {{ criticalItems.length }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {{ criticalItems.length > 0 ? t('inventory.criticalDesc') : t('inventory.allOk') }}
            </p>
            <ul v-if="criticalItems.length > 0" class="mt-3 space-y-1.5">
              <li
                v-for="item in criticalItems"
                :key="item.id"
                class="flex items-center justify-between gap-2 text-sm rounded-lg bg-white/80 border border-red-100 px-3 py-2"
              >
                <span class="font-medium text-gray-900 truncate">{{ item.name }}</span>
                <span class="flex-shrink-0 text-red-600 font-semibold">
                  {{ formatStock(item.current_stock) }} / {{ t('inventory.min') }} {{ formatStock(item.min_limit) }}
                  <span class="text-gray-500 font-normal">{{ item.unit || 'dona' }}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Filtrlar -->
      <div class="bg-white rounded-2xl shadow-card border border-gray-100 p-4 sm:p-5 space-y-4">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="relative lg:col-span-2">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="filters.search"
              type="search"
              class="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :placeholder="t('inventory.searchPlaceholder')"
            />
          </div>
          <select
            v-model="filters.category"
            class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="">{{ t('inventory.allCategories') }}</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <button
            type="button"
            class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            @click="resetFilters"
          >
            {{ t('inventory.clearFilters') }}
          </button>
        </div>

        <!-- Jadval -->
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">{{ t('inventory.itemName') }}</th>
                <th class="px-4 py-3">{{ t('inventory.category') }}</th>
                <th class="px-4 py-3">{{ t('inventory.stock') }}</th>
                <th class="px-4 py-3">{{ t('inventory.minLimit') }}</th>
                <th class="px-4 py-3">{{ t('inventory.unit') }}</th>
                <th class="px-4 py-3 text-right">{{ t('inventory.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loading">
                <td class="px-4 py-6 text-slate-500 text-center" colspan="6">{{ t('inventory.loading') }}</td>
              </tr>
              <tr v-else-if="filteredItems.length === 0">
                <td class="px-4 py-8 text-slate-500 text-center" colspan="6">{{ t('inventory.noItems') }}</td>
              </tr>
              <tr v-for="item in filteredItems" :key="item.id" class="bg-white hover:bg-slate-50/50">
                <td class="px-4 py-3 font-medium text-slate-800">{{ item.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ item.category || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="stockBadgeClass(item)">
                    {{ formatStock(item.current_stock) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ formatStock(item.min_limit) }}</td>
                <td class="px-4 py-3 text-slate-600">{{ item.unit || 'dona' }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-100"
                      :title="t('inventory.stockIn')"
                      @click="openTransactionModal(item, 'in')"
                    >
                      <ArrowDownTrayIcon class="w-4 h-4" />
                      {{ t('inventory.inShort') }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1.5 text-xs font-medium hover:bg-orange-100"
                      :title="t('inventory.stockOut')"
                      @click="openTransactionModal(item, 'out')"
                    >
                      <ArrowUpTrayIcon class="w-4 h-4" />
                      {{ t('inventory.outShort') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="error" class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
        {{ error }}
      </p>
      <p v-if="successMessage" class="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
        {{ successMessage }}
      </p>
    </div>

    <!-- Yangi mahsulot modali -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.add" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeAddModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('inventory.addItem') }}</h3>
              <button type="button" class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="closeAddModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.itemName') }} *</label>
                <input v-model="addForm.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.category') }}</label>
                  <select v-model="addForm.category" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('inventory.selectCategory') }}</option>
                    <option v-for="cat in defaultCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.unit') }}</label>
                  <input v-model="addForm.unit" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="dona" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.initialStock') }}</label>
                  <input v-model.number="addForm.current_stock" type="number" min="0" step="any" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.minLimit') }}</label>
                  <input v-model.number="addForm.min_limit" type="number" min="0" step="any" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.costPrice') }}</label>
                  <input v-model.number="addForm.cost_price" type="number" min="0" step="any" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeAddModal">
                {{ t('inventory.cancel') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                :disabled="saving"
                @click="saveNewItem"
              >
                {{ saving ? t('inventory.saving') : t('inventory.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Kirim / Chiqim modali -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.transaction" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeTransactionModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div
              class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              :class="txForm.type === 'in' ? 'bg-emerald-50' : 'bg-orange-50'"
            >
              <h3 class="text-lg font-semibold text-gray-900">
                {{ txForm.type === 'in' ? t('inventory.stockIn') : t('inventory.stockOut') }}
              </h3>
              <button type="button" class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="closeTransactionModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <p class="text-sm text-gray-600">
                <span class="font-medium text-gray-900">{{ txForm.itemName }}</span>
                — {{ t('inventory.currentStock') }}:
                <span class="font-semibold" :class="stockBadgeTextClass(txForm.item)">{{ formatStock(txForm.currentStock) }}</span>
                {{ txForm.unit }}
              </p>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.quantity') }} *</label>
                <input
                  v-model.number="txForm.quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.reason') }}</label>
                <textarea
                  v-model="txForm.reason"
                  rows="2"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
                  :placeholder="txForm.type === 'in' ? t('inventory.reasonInPlaceholder') : t('inventory.reasonOutPlaceholder')"
                />
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeTransactionModal">
                {{ t('inventory.cancel') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                :class="txForm.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'"
                :disabled="saving"
                @click="saveTransaction"
              >
                {{ saving ? t('inventory.saving') : t('inventory.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { getInventory, addInventoryItem, logTransaction } from '@/api/warehouseApi'
import { getStockStatus, filterCriticalItems, STOCK_STATUS } from '@/lib/warehouseStock'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const authStore = useAuthStore()

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const filters = reactive({
  search: '',
  category: '',
})

const modals = reactive({
  add: false,
  transaction: false,
})

const defaultCategories = [
  'Anesteziya',
  'Sarf materiallar',
  'Instrumentlar',
  'Dezinfeksiya',
  'Boshqa',
]

const addForm = reactive({
  name: '',
  category: '',
  unit: 'dona',
  current_stock: 0,
  min_limit: 0,
  cost_price: 0,
})

const txForm = reactive({
  itemId: null,
  item: null,
  itemName: '',
  currentStock: 0,
  unit: 'dona',
  type: 'in',
  quantity: 1,
  reason: '',
})

const criticalItems = computed(() => filterCriticalItems(items.value))

const categoryOptions = computed(() => {
  const fromItems = items.value
    .map(i => i.category)
    .filter(Boolean)
  return [...new Set([...defaultCategories, ...fromItems])].sort()
})

const filteredItems = computed(() => {
  const q = filters.search.trim().toLowerCase()
  return items.value.filter(item => {
    if (filters.category && item.category !== filters.category) return false
    if (!q) return true
    const hay = `${item.name || ''} ${item.category || ''} ${item.sku || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function formatStock(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function stockBadgeClass(item) {
  const status = getStockStatus(item)
  if (status === STOCK_STATUS.CRITICAL) return 'bg-red-100 text-red-700 ring-1 ring-red-200'
  if (status === STOCK_STATUS.LOW) return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
  return 'bg-slate-100 text-slate-700'
}

function stockBadgeTextClass(item) {
  if (!item) return 'text-slate-700'
  const status = getStockStatus(item)
  if (status === STOCK_STATUS.CRITICAL) return 'text-red-600'
  if (status === STOCK_STATUS.LOW) return 'text-amber-600'
  return 'text-emerald-600'
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
}

function flashSuccess(msg) {
  successMessage.value = msg
  setTimeout(() => { successMessage.value = '' }, 3500)
}

function patchItem(updated) {
  if (!updated?.id) return
  const idx = items.value.findIndex(i => Number(i.id) === Number(updated.id))
  if (idx >= 0) {
    items.value[idx] = { ...items.value[idx], ...updated }
  } else {
    items.value.push(updated)
  }
}

async function loadInventory() {
  loading.value = true
  error.value = ''
  try {
    const clinicId = authStore.userClinicId
    items.value = await getInventory(clinicId)
  } catch (err) {
    error.value = err?.message || t('inventory.loadError')
  } finally {
    loading.value = false
  }
}

function resetAddForm() {
  addForm.name = ''
  addForm.category = ''
  addForm.unit = 'dona'
  addForm.current_stock = 0
  addForm.min_limit = 0
  addForm.cost_price = 0
}

function openAddModal() {
  resetAddForm()
  modals.add = true
}

function closeAddModal() {
  modals.add = false
}

async function saveNewItem() {
  if (!addForm.name.trim()) {
    error.value = t('inventory.nameRequired')
    return
  }
  saving.value = true
  error.value = ''
  try {
    const created = await addInventoryItem({
      clinic_id: authStore.userClinicId,
      name: addForm.name,
      category: addForm.category,
      unit: addForm.unit,
      current_stock: addForm.current_stock,
      min_limit: addForm.min_limit,
      cost_price: addForm.cost_price,
    })
    items.value = [...items.value, created].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'uz'),
    )
    closeAddModal()
    flashSuccess(t('inventory.itemAdded'))
  } catch (err) {
    error.value = err?.message || t('inventory.saveError')
  } finally {
    saving.value = false
  }
}

function openTransactionModal(item, type) {
  txForm.itemId = item.id
  txForm.item = item
  txForm.itemName = item.name
  txForm.currentStock = item.current_stock
  txForm.unit = item.unit || 'dona'
  txForm.type = type
  txForm.quantity = 1
  txForm.reason = ''
  modals.transaction = true
}

function closeTransactionModal() {
  modals.transaction = false
}

async function saveTransaction() {
  const qty = Number(txForm.quantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    error.value = t('inventory.quantityRequired')
    return
  }
  saving.value = true
  error.value = ''
  try {
    const { item } = await logTransaction(
      txForm.itemId,
      txForm.type,
      qty,
      txForm.reason,
      {
        clinicId: authStore.userClinicId,
        createdBy: authStore.userEmail || authStore.user?.login || null,
      },
    )
    patchItem(item)
    closeTransactionModal()
    flashSuccess(
      txForm.type === 'in' ? t('inventory.inSuccess') : t('inventory.outSuccess'),
    )
  } catch (err) {
    error.value = err?.message || t('inventory.saveError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadInventory()
})
</script>
