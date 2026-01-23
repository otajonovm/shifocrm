<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('inventory.title') }}</h1>
          <p class="text-gray-500">{{ t('inventory.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="activeTab === 'items'"
            class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            @click="openItemModal()"
          >
            {{ t('inventory.addItem') }}
          </button>
          <button
            v-else-if="activeTab === 'movements'"
            class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            @click="openMovementModal()"
          >
            {{ t('inventory.addMovement') }}
          </button>
          <button
            v-else
            class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            @click="openExpenseModal()"
          >
            {{ t('inventory.addExpense') }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-gray-100">
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
            {{ t(tab.label) }}
          </button>
        </div>

        <div class="p-6">
          <div v-if="activeTab === 'items'" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-3">
              <input
                v-model="filters.search"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                :placeholder="t('inventory.searchPlaceholder')"
              />
              <select v-model="filters.category" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">{{ t('inventory.allCategories') }}</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
              <button class="rounded-lg border border-gray-200 px-3 py-2 text-sm" @click="resetFilters">
                {{ t('inventory.clearFilters') }}
              </button>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('inventory.itemName') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.category') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.unit') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.stock') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.minStock') }}</th>
                    <th class="px-4 py-3 text-right">{{ t('inventory.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.items">
                    <td class="px-4 py-4 text-slate-500" colspan="6">{{ t('inventory.loading') }}</td>
                  </tr>
                  <tr v-else-if="filteredItems.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="6">{{ t('inventory.noItems') }}</td>
                  </tr>
                  <tr v-for="item in filteredItems" :key="item.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ item.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ item.category || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ item.unit || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span :class="itemLowStock(item) ? 'text-rose-600 font-medium' : 'text-slate-700'">
                        {{ item.current_stock ?? 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-700">{{ item.min_stock ?? '-' }}</td>
                    <td class="px-4 py-3 text-right">
                      <button class="text-primary-600 hover:text-primary-700 text-sm mr-3" @click="openItemModal(item)">
                        {{ t('inventory.edit') }}
                      </button>
                      <button class="text-rose-600 hover:text-rose-700 text-sm" @click="deleteItem(item)">
                        {{ t('inventory.delete') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="activeTab === 'movements'" class="space-y-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('inventory.date') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.itemName') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.type') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.quantity') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.usedBy') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.visitId') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.note') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.movements">
                    <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('inventory.loading') }}</td>
                  </tr>
                  <tr v-else-if="movements.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="7">{{ t('inventory.noMovements') }}</td>
                  </tr>
                  <tr v-for="movement in movements" :key="movement.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ formatDate(movement.created_at) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ itemName(movement.item_id) }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      {{ movement.type === 'in' ? t('inventory.typeIn') : t('inventory.typeOut') }}
                    </td>
                    <td class="px-4 py-3 text-slate-700">{{ movement.quantity }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ doctorLabel(movement.doctor_id) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ movement.visit_id ? `#${movement.visit_id}` : '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ movement.note || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('inventory.date') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.category') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.amount') }}</th>
                    <th class="px-4 py-3">{{ t('inventory.note') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.expenses">
                    <td class="px-4 py-4 text-slate-500" colspan="4">{{ t('inventory.loading') }}</td>
                  </tr>
                  <tr v-else-if="expenses.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="4">{{ t('inventory.noExpenses') }}</td>
                  </tr>
                  <tr v-for="expense in expenses" :key="expense.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ formatDate(expense.paid_at) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ expense.category || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(expense.amount) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ expense.note || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.item" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeItemModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ itemForm.id ? t('inventory.editItem') : t('inventory.addItem') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeItemModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.itemName') }}</label>
                  <input v-model="itemForm.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.category') }}</label>
                  <input v-model="itemForm.category" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.unit') }}</label>
                  <input v-model="itemForm.unit" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.costPrice') }}</label>
                  <input v-model="itemForm.cost_price" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.currentStock') }}</label>
                  <input v-model="itemForm.current_stock" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.minStock') }}</label>
                  <input v-model="itemForm.min_stock" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeItemModal">
                {{ t('inventory.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveItem">
                {{ t('inventory.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.movement" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeMovementModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('inventory.addMovement') }}</h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeMovementModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.itemName') }}</label>
                  <select v-model="movementForm.item_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('inventory.selectItem') }}</option>
                    <option v-for="item in items" :key="item.id" :value="String(item.id)">
                      {{ item.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.type') }}</label>
                  <select v-model="movementForm.type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="in">{{ t('inventory.typeIn') }}</option>
                    <option value="out">{{ t('inventory.typeOut') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.quantity') }}</label>
                  <input v-model="movementForm.quantity" type="number" min="1" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.note') }}</label>
                  <input v-model="movementForm.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeMovementModal">
                {{ t('inventory.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveMovement">
                {{ t('inventory.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.expense" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeExpenseModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ t('inventory.addExpense') }}</h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeExpenseModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.category') }}</label>
                  <input v-model="expenseForm.category" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.amount') }}</label>
                  <input v-model="expenseForm.amount" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.date') }}</label>
                  <input v-model="expenseForm.paid_at" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('inventory.note') }}</label>
                  <input v-model="expenseForm.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeExpenseModal">
                {{ t('inventory.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveExpense">
                {{ t('inventory.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import { useToast } from '@/composables/useToast'
import { listDoctors } from '@/api/doctorsApi'
import {
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listInventoryMovements,
  createInventoryMovement,
  listExpenses,
  createExpense
} from '@/api/inventoryApi'

const { t } = useI18n()
const toast = useToast()

const tabs = [
  { id: 'items', label: 'inventory.tabItems' },
  { id: 'movements', label: 'inventory.tabMovements' },
  { id: 'expenses', label: 'inventory.tabExpenses' }
]

const activeTab = ref('items')
const items = ref([])
const movements = ref([])
const expenses = ref([])
const doctors = ref([])

const loading = ref({
  items: false,
  movements: false,
  expenses: false
})

const filters = ref({
  search: '',
  category: ''
})

const modals = ref({
  item: false,
  movement: false,
  expense: false
})

const itemForm = ref({
  id: null,
  name: '',
  category: '',
  unit: '',
  cost_price: '',
  current_stock: '',
  min_stock: ''
})

const movementForm = ref({
  item_id: '',
  type: 'in',
  quantity: '',
  note: ''
})

const expenseForm = ref({
  category: '',
  amount: '',
  paid_at: '',
  note: ''
})

const categories = computed(() => {
  const set = new Set()
  items.value.forEach(item => {
    if (item.category) set.add(item.category)
  })
  return Array.from(set)
})

const filteredItems = computed(() => {
  const search = filters.value.search.trim().toLowerCase()
  return items.value.filter(item => {
    if (search && !item.name?.toLowerCase().includes(search)) return false
    if (filters.value.category && item.category !== filters.value.category) return false
    return true
  })
})

const resetFilters = () => {
  filters.value = { search: '', category: '' }
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
  return date.toLocaleDateString('uz-UZ')
}

const itemName = (itemId) => {
  const match = items.value.find(item => Number(item.id) === Number(itemId))
  return match ? match.name : `#${itemId}`
}

const doctorLabel = (doctorId) => {
  if (!doctorId) return '-'
  const match = doctors.value.find(item => Number(item.id) === Number(doctorId))
  return match ? `${match.full_name} (#${match.id})` : `#${doctorId}`
}

const itemLowStock = (item) => {
  const stock = Number(item.current_stock) || 0
  const min = Number(item.min_stock) || 0
  return min > 0 && stock <= min
}

const loadItems = async () => {
  loading.value.items = true
  try {
    items.value = await listInventoryItems('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load inventory items:', error)
    items.value = []
  } finally {
    loading.value.items = false
  }
}

const loadMovements = async () => {
  loading.value.movements = true
  try {
    movements.value = await listInventoryMovements('order=created_at.desc&limit=100')
  } catch (error) {
    console.error('Failed to load inventory movements:', error)
    movements.value = []
  } finally {
    loading.value.movements = false
  }
}

const loadExpenses = async () => {
  loading.value.expenses = true
  try {
    expenses.value = await listExpenses('order=paid_at.desc&limit=100')
  } catch (error) {
    console.error('Failed to load expenses:', error)
    expenses.value = []
  } finally {
    loading.value.expenses = false
  }
}

const loadDoctors = async () => {
  try {
    doctors.value = await listDoctors()
  } catch (error) {
    console.error('Failed to load doctors:', error)
    doctors.value = []
  }
}

const openItemModal = (item = null) => {
  if (item) {
    itemForm.value = {
      id: item.id,
      name: item.name || '',
      category: item.category || '',
      unit: item.unit || '',
      cost_price: item.cost_price ?? '',
      current_stock: item.current_stock ?? '',
      min_stock: item.min_stock ?? ''
    }
  } else {
    itemForm.value = {
      id: null,
      name: '',
      category: '',
      unit: '',
      cost_price: '',
      current_stock: '',
      min_stock: ''
    }
  }
  modals.value.item = true
}

const closeItemModal = () => {
  modals.value.item = false
}

const saveItem = async () => {
  if (!itemForm.value.name) {
    toast.error(t('inventory.errorNameRequired'))
    return
  }
  const payload = {
    name: itemForm.value.name,
    category: itemForm.value.category || null,
    unit: itemForm.value.unit || null,
    cost_price: itemForm.value.cost_price ? Number(itemForm.value.cost_price) : null,
    current_stock: itemForm.value.current_stock ? Number(itemForm.value.current_stock) : 0,
    min_stock: itemForm.value.min_stock ? Number(itemForm.value.min_stock) : 0
  }

  try {
    if (itemForm.value.id) {
      await updateInventoryItem(itemForm.value.id, payload)
      toast.success(t('inventory.toastUpdated'))
    } else {
      await createInventoryItem(payload)
      toast.success(t('inventory.toastCreated'))
    }
    await loadItems()
    closeItemModal()
  } catch (error) {
    console.error('Failed to save item:', error)
    toast.error(t('inventory.errorSave'))
  }
}

const deleteItem = async (item) => {
  if (!window.confirm(t('inventory.confirmDelete'))) return
  try {
    await deleteInventoryItem(item.id)
    toast.success(t('inventory.toastDeleted'))
    await loadItems()
  } catch (error) {
    console.error('Failed to delete item:', error)
    toast.error(t('inventory.errorDelete'))
  }
}

const openMovementModal = () => {
  movementForm.value = {
    item_id: '',
    type: 'in',
    quantity: '',
    note: ''
  }
  modals.value.movement = true
}

const closeMovementModal = () => {
  modals.value.movement = false
}

const saveMovement = async () => {
  if (!movementForm.value.item_id) {
    toast.error(t('inventory.errorItemRequired'))
    return
  }
  const quantity = Number(movementForm.value.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    toast.error(t('inventory.errorQuantityRequired'))
    return
  }
  const payload = {
    item_id: Number(movementForm.value.item_id),
    type: movementForm.value.type,
    quantity,
    note: movementForm.value.note || null
  }

  try {
    await createInventoryMovement(payload)
    const target = items.value.find(item => Number(item.id) === Number(payload.item_id))
    if (target) {
      const currentStock = Number(target.current_stock) || 0
      const updatedStock = payload.type === 'in' ? currentStock + quantity : currentStock - quantity
      await updateInventoryItem(target.id, { current_stock: updatedStock })
    }
    toast.success(t('inventory.toastCreated'))
    await Promise.all([loadMovements(), loadItems()])
    closeMovementModal()
  } catch (error) {
    console.error('Failed to save movement:', error)
    toast.error(t('inventory.errorSave'))
  }
}

const openExpenseModal = () => {
  expenseForm.value = {
    category: '',
    amount: '',
    paid_at: '',
    note: ''
  }
  modals.value.expense = true
}

const closeExpenseModal = () => {
  modals.value.expense = false
}

const saveExpense = async () => {
  const amount = Number(expenseForm.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    toast.error(t('inventory.errorAmountRequired'))
    return
  }
  const payload = {
    category: expenseForm.value.category || null,
    amount,
    paid_at: expenseForm.value.paid_at ? `${expenseForm.value.paid_at}T00:00:00` : new Date().toISOString(),
    note: expenseForm.value.note || null
  }

  try {
    await createExpense(payload)
    toast.success(t('inventory.toastCreated'))
    await loadExpenses()
    closeExpenseModal()
  } catch (error) {
    console.error('Failed to save expense:', error)
    toast.error(t('inventory.errorSave'))
  }
}

onMounted(async () => {
  await Promise.all([loadItems(), loadMovements(), loadExpenses(), loadDoctors()])
})
</script>
