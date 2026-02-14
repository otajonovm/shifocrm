<template>
  <MainLayout>
    <div class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t('reports.subtitle') }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">{{ t('reports.filtersTitle') }}</h2>
          <button 
            @click="resetFilters" 
            class="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors touch-target"
          >
            {{ t('reports.clearFilters') }}
          </button>
        </div>
        <div class="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ t('reports.startDate') }}</label>
            <input 
              v-model="filters.startDate" 
              type="date" 
              class="mobile-input w-full"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ t('reports.endDate') }}</label>
            <input 
              v-model="filters.endDate" 
              type="date" 
              class="mobile-input w-full"
            />
          </div>
          <div class="flex items-end gap-2">
            <button 
              @click="loadReports" 
              class="mobile-btn-primary flex-1 touch-target-lg"
              :disabled="loading.payments"
            >
              {{ loading.payments ? 'Yuklanmoqda...' : t('reports.applyFilters') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.totalPayments') }}</p>
          <p class="text-base sm:text-lg font-bold text-gray-900 truncate" :title="formatCurrency(summary.totalPayments)">{{ formatCurrency(summary.totalPayments) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.totalRefunds') }}</p>
          <p class="text-base sm:text-lg font-bold text-rose-600 truncate">{{ formatCurrency(summary.totalRefunds) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.netIncome') }}</p>
          <p class="text-base sm:text-lg font-bold text-emerald-600 truncate">{{ formatCurrency(summary.netIncome) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.totalDebt') }}</p>
          <p class="text-base sm:text-lg font-bold text-amber-600 truncate">{{ formatCurrency(summary.totalDebt) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.expensesTotal') }}</p>
          <p class="text-base sm:text-lg font-bold text-orange-600 truncate">{{ formatCurrency(summary.totalExpenses) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.movementsOutTotal') }}</p>
          <p class="text-base sm:text-lg font-bold text-slate-700 truncate">{{ summary.totalMovementsOut }} {{ t('reports.units') }}</p>
        </div>
      </div>

      <!-- Qo'shimcha xarajatlar (yakka doktorlar uchun) -->
      <div v-if="isSolo && additionalExpenses.length > 0" class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Qo'shimcha xarajatlar</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Ijara, ombor xizmatlari va boshqa xarajatlar</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Kategoriya
                </th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Sana
                </th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Summa
                </th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  To'lov usuli
                </th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Izoh
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr 
                v-for="expense in additionalExpenses" 
                :key="expense.id" 
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-medium" :class="getExpenseCategoryClass(expense.category)">
                    {{ getExpenseCategoryLabel(expense.category) }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-gray-600">
                  {{ formatDate(expense.paid_at) }}
                </td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-orange-600">
                  {{ formatCurrency(expense.amount) }}
                </td>
                <td class="px-4 sm:px-6 py-4 text-gray-600">
                  {{ getMethodLabel(expense.method) }}
                </td>
                <td class="px-4 sm:px-6 py-4 text-gray-600">
                  {{ removeCategoryFromNote(expense.note) || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="2" class="px-4 sm:px-6 py-3 text-sm font-semibold text-gray-900">
                  Jami:
                </td>
                <td class="px-4 sm:px-6 py-3 text-right text-sm font-bold text-orange-600">
                  {{ formatCurrency(summary.totalAdditionalExpenses) }}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Ombor harajatlari -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('reports.expensesTitle') }}</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('reports.expensesSubtitle') }}</p>
          </div>
        </div>
        <div v-if="loading.expenses" class="py-8 text-center text-gray-500 text-sm">{{ t('reports.loading') }}</div>
        <div v-else-if="expensesList.length === 0" class="py-8 text-center text-gray-500 text-sm rounded-lg bg-gray-50">{{ t('reports.noData') }}</div>
        <template v-else>
          <!-- Mobil: kartalar -->
          <div class="md:hidden space-y-3">
            <div
              v-for="e in expensesList"
              :key="e.id"
              class="p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-gray-900">{{ getExpenseCategoryLabel(e.category) }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ formatDateShort(e.paid_at) }}</p>
                  <p v-if="e.note" class="text-sm text-gray-600 mt-1 truncate">{{ e.note }}</p>
                </div>
                <p class="text-base font-semibold text-orange-600 flex-shrink-0">{{ formatCurrency(e.amount) }}</p>
              </div>
            </div>
          </div>
          <!-- Desktop: jadval -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.expenseCategory') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.date') }}</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{{ t('reports.total') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.expenseNote') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-for="e in expensesList" :key="e.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs font-medium" :class="getExpenseCategoryClass(e.category)">{{ getExpenseCategoryLabel(e.category) }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ formatDateShort(e.paid_at) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-orange-600">{{ formatCurrency(e.amount) }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ e.note || '-' }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="2" class="px-4 py-3 font-semibold text-gray-900">{{ t('reports.total') }}</td>
                  <td class="px-4 py-3 text-right font-bold text-orange-600">{{ formatCurrency(summary.totalExpenses) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </template>
      </div>

      <!-- Kirim / Chiqim -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('reports.movementsTitle') }}</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('reports.movementsSubtitle') }}</p>
          </div>
        </div>
        <div v-if="loading.movements" class="py-8 text-center text-gray-500 text-sm">{{ t('reports.loading') }}</div>
        <div v-else-if="movementsList.length === 0" class="py-8 text-center text-gray-500 text-sm rounded-lg bg-gray-50">{{ t('reports.noData') }}</div>
        <template v-else>
          <!-- Mobil: kartalar -->
          <div class="md:hidden space-y-3">
            <div
              v-for="m in movementsList"
              :key="m.id"
              class="p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900">{{ movementItemName(m.item_id) }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ formatDateShort(m.created_at) }}</p>
                  <span :class="m.type === 'in' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'" class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium">
                    {{ m.type === 'in' ? t('reports.movementIn') : t('reports.movementOut') }}
                  </span>
                  <p v-if="m.note" class="text-sm text-gray-600 mt-1 truncate">{{ m.note }}</p>
                </div>
                <p class="text-base font-semibold text-gray-900 flex-shrink-0">{{ m.quantity }} {{ t('reports.units') }}</p>
              </div>
            </div>
          </div>
          <!-- Desktop: jadval -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.date') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.movementItem') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('reports.movementType') }}</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{{ t('reports.quantity') }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{{ t('inventory.note') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-for="m in movementsList" :key="m.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-gray-600">{{ formatDateShort(m.created_at) }}</td>
                  <td class="px-4 py-3 font-medium text-gray-900">{{ movementItemName(m.item_id) }}</td>
                  <td class="px-4 py-3">
                    <span :class="m.type === 'in' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'" class="px-2 py-0.5 rounded text-xs font-medium">
                      {{ m.type === 'in' ? t('reports.movementIn') : t('reports.movementOut') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-medium">{{ m.quantity }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ m.note || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- 1. Daromad dinamikasi (Line Chart) - Kun/Hafta/Oy toggle -->
      <div class="mobile-card">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Daromad dinamikasi</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Daromad o'sishi yoki tushishi</p>
          </div>
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              v-for="period in ['day', 'week', 'month']"
              :key="period"
              @click="revenuePeriod = period"
              :class="[
                'px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all touch-target',
                revenuePeriod === period
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              {{ period === 'day' ? 'Kunlik' : period === 'week' ? 'Haftalik' : 'Oylik' }}
            </button>
          </div>
        </div>
        <div v-if="revenueData.length > 0" class="mb-4">
          <ApexChart 
            type="line" 
            height="300" 
            :options="revenueChartOptions" 
            :series="revenueChartSeries" 
          />
        </div>
        <div v-else class="py-12 text-center">
          <p class="text-sm text-gray-500">Ma'lumotlar yo'q</p>
        </div>
      </div>

      <!-- 2. Xizmatlar bo'yicha tushum (Bar Chart) -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Xizmatlar bo'yicha tushum</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Qaysi xizmat ko'p pul keltiryapti</p>
          </div>
        </div>
        <div v-if="topServices.length > 0" class="mb-6">
          <ApexChart 
            type="bar" 
            height="300" 
            :options="servicesChartOptions" 
            :series="servicesChartSeries" 
          />
        </div>
        <div v-else class="py-12 text-center mb-6">
          <p class="text-sm text-gray-500">Ma'lumotlar yo'q</p>
        </div>
        <!-- Jadval -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.service') }}
                </th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.count') }}
                </th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.total') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loading.services">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
              </tr>
              <tr v-else-if="topServices.length === 0">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
              </tr>
              <tr 
                v-for="row in topServices" 
                :key="row.service_name" 
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 font-medium text-gray-900">{{ row.service_name || 'Noma\'lum' }}</td>
                <td class="px-4 sm:px-6 py-4 text-gray-600">{{ row.total_count || 0 }}</td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">
                  {{ formatCurrency(row.total_revenue) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. To'lov usullari (Donut Chart) -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">To'lov usullari</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Naqd, karta, o'tkazma</p>
          </div>
        </div>
        <div v-if="paymentMethods.length > 0" class="mb-6">
          <ApexChart 
            type="donut" 
            height="300" 
            :options="paymentMethodsChartOptions" 
            :series="paymentMethodsChartSeries" 
          />
        </div>
        <div v-else class="py-12 text-center mb-6">
          <p class="text-sm text-gray-500">Ma'lumotlar yo'q</p>
        </div>
        <!-- Jadval -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.method') }}
                </th>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.count') }}
                </th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.total') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loading.payments">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="3">{{ t('reports.loading') }}</td>
              </tr>
              <tr v-else-if="paymentMethods.length === 0">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="3">{{ t('reports.noData') }}</td>
              </tr>
              <tr 
                v-for="row in paymentMethods" 
                :key="row.method" 
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 font-medium text-gray-900">{{ row.label }}</td>
                <td class="px-4 sm:px-6 py-4 text-gray-600">{{ row.count }}</td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">
                  {{ formatCurrency(row.total) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Qarzdorlar ro'yxati (Faqat jadval, chart yo'q) -->
      <div class="mobile-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Qarzdorlar</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Qarz miqdori bo'yicha tartiblangan</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.patient') }}
                </th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {{ t('reports.total') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loading.debts">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="2">{{ t('reports.loading') }}</td>
              </tr>
              <tr v-else-if="debtors.length === 0">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="2">{{ t('reports.noData') }}</td>
              </tr>
              <tr 
                v-for="row in debtors" 
                :key="row.patient_id" 
                class="hover:bg-red-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4">
                  <router-link 
                    :to="`/patients/${row.patient_id}`"
                    class="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {{ row.label }}
                  </router-link>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-red-600">
                  {{ formatCurrency(row.total) }}
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
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ApexChart from 'vue3-apexcharts'
import { useToast } from '@/composables/useToast'
import { listDoctors } from '@/api/doctorsApi'
import { listPatients } from '@/api/patientsApi'
import * as paymentsApi from '@/api/paymentsApi'
import { parseCategoryFromNote, removeCategoryFromNote } from '@/api/paymentsApi'
import * as visitsApi from '@/api/visitsApi'
import { getTopServices } from '@/api/servicesApi'
import { listExpenses, listInventoryMovements, listInventoryItems } from '@/api/inventoryApi'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const isSolo = computed(() => authStore.userRole === 'solo')

const filters = ref({
  startDate: '',
  endDate: ''
})

const revenuePeriod = ref('day') // 'day', 'week', 'month'

const loading = ref({
  payments: false,
  income: false,
  debts: false,
  services: false,
  expenses: false,
  movements: false
})

const summary = ref({
  totalPayments: 0,
  totalRefunds: 0,
  netIncome: 0,
  totalDebt: 0,
  totalAdditionalExpenses: 0,
  totalExpenses: 0,
  totalMovementsOut: 0
})

const payments = ref([])
const paymentMethods = ref([])
const debtors = ref([])
const topServices = ref([])
const revenueData = ref([])
const doctors = ref([])
const patients = ref([])
const additionalExpenses = ref([])
const expensesList = ref([])
const movementsList = ref([])
const inventoryItems = ref([])

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' so\'m'
}

const resetFilters = () => {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  const start = new Date(today)
  start.setDate(today.getDate() - 30)
  filters.value = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end
  }
}

// Daromad dinamikasi chart
const revenueChartSeries = computed(() => [
  {
    name: 'Daromad',
    data: revenueData.value.map(row => Number(row.net_income) || 0)
  }
])

const revenueChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    colors: ['#0ea5e9']
  },
  markers: {
    size: 4,
    colors: ['#0ea5e9'],
    strokeColors: '#fff',
    strokeWidth: 2
  },
  xaxis: {
    categories: revenueData.value.map(row => {
      if (revenuePeriod.value === 'day') {
        return new Date(row.day).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
      } else if (revenuePeriod.value === 'week') {
        return row.week || row.day
      } else {
        return new Date(row.month).toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' })
      }
    }),
    labels: {
      style: {
        fontSize: '12px',
        colors: '#6b7280'
      }
    }
  },
  yaxis: {
    labels: {
      formatter: (val) => formatCurrency(val)
    }
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val)
    }
  },
  colors: ['#0ea5e9'],
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4
  }
}))

// Xizmatlar chart
const servicesChartSeries = computed(() => [
  {
    name: 'Tushum',
    data: topServices.value.map(row => Number(row.total_revenue) || 0)
  }
])

const servicesChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false }
  },
  xaxis: {
    categories: topServices.value.map(row => row.service_name || 'Noma\'lum'),
    labels: {
      style: {
        fontSize: '11px',
        colors: '#6b7280'
      },
      rotate: -45,
      rotateAlways: false
    }
  },
  yaxis: {
    labels: {
      formatter: (val) => formatCurrency(val)
    }
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val)
    }
  },
  colors: ['#10b981'],
  dataLabels: {
    enabled: false
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: false
    }
  }
}))

// To'lov usullari chart
const paymentMethodsChartSeries = computed(() => 
  paymentMethods.value.map(row => Number(row.total) || 0)
)

const paymentMethodsChartOptions = computed(() => ({
  chart: {
    type: 'donut'
  },
  labels: paymentMethods.value.map(row => row.label),
  legend: {
    position: 'bottom',
    fontSize: '12px'
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => `${val.toFixed(1)}%`
  },
  tooltip: {
    y: {
      formatter: (val) => formatCurrency(val)
    }
  },
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
}))

const applySummary = () => {
  const totals = payments.value.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount) || 0
      if (entry.payment_type === 'payment') acc.totalPayments += amount
      if (entry.payment_type === 'refund') acc.totalRefunds += amount
      if (entry.payment_type === 'expense') {
        acc.totalAdditionalExpenses += amount
        acc.netIncome -= amount // Xarajatlar daromaddan ayiriladi
      } else if (entry.payment_type === 'refund') {
        acc.netIncome -= amount
      } else {
        acc.netIncome += amount
      }
      return acc
    },
    { totalPayments: 0, totalRefunds: 0, netIncome: 0, totalAdditionalExpenses: 0 }
  )
  summary.value.totalPayments = totals.totalPayments
  summary.value.totalRefunds = totals.totalRefunds
  summary.value.netIncome = totals.netIncome
  summary.value.totalAdditionalExpenses = totals.totalAdditionalExpenses
}

const buildPaymentMethodStats = () => {
  const map = new Map()
  payments.value.forEach(entry => {
    const method = entry.method || 'unknown'
    if (!map.has(method)) {
      map.set(method, { method, total: 0, count: 0 })
    }
    const row = map.get(method)
    row.total += Number(entry.amount) || 0
    row.count += 1
  })
  paymentMethods.value = Array.from(map.values()).map(row => ({
    ...row,
    label: resolveMethodLabel(row.method)
  }))
}

const resolveMethodLabel = (method) => {
  const labels = {
    cash: 'Naqd',
    card: 'Karta',
    transfer: 'O\'tkazma',
    unknown: 'Noma\'lum'
  }
  return labels[method] || method
}

const getMethodLabel = (method) => {
  return resolveMethodLabel(method)
}

const getExpenseCategoryLabel = (category) => {
  const labels = {
    rent: 'Ijara',
    inventory: 'Ombor xizmatlari',
    other: 'Boshqa'
  }
  return labels[category] || category || 'Noma\'lum'
}

const getExpenseCategoryClass = (category) => {
  const classes = {
    rent: 'text-purple-700 bg-purple-50',
    inventory: 'text-blue-700 bg-blue-50',
    other: 'text-gray-700 bg-gray-50'
  }
  return classes[category] || 'text-gray-700 bg-gray-50'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const formatDateShort = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('uz-UZ')
}

const buildDebtors = (debtVisits) => {
  const map = new Map()
  debtVisits.forEach(visit => {
    const patientId = visit.patient_id
    if (!map.has(patientId)) {
      map.set(patientId, { patient_id: patientId, total: 0 })
    }
    const row = map.get(patientId)
    row.total += Number(visit.debt_amount) || 0
  })
  debtors.value = Array.from(map.values())
    .map(row => ({
      ...row,
      label: patientLabel(row.patient_id)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20) // Top 20

  summary.value.totalDebt = debtors.value.reduce((sum, row) => sum + row.total, 0)
}

const patientLabel = (patientId) => {
  const match = patients.value.find(item => Number(item.id) === Number(patientId))
  return match ? `${match.full_name} (#${match.id})` : `#${patientId}`
}

// Daromad ma'lumotlarini yuklash (kun/hafta/oy bo'yicha)
const loadRevenueData = async () => {
  try {
    const { startDate, endDate } = filters.value
    const allPayments = await paymentsApi.getPaymentsByDateRange(startDate, endDate)
    
    if (revenuePeriod.value === 'day') {
      // Kunlik
      const byDay = new Map()
      allPayments.forEach(p => {
        const day = (p.paid_at || '').slice(0, 10)
        if (!day) return
        if (!byDay.has(day)) {
          byDay.set(day, { day, net_income: 0 })
        }
        const amt = Number(p.amount) || 0
        const isAdditionalExpense = p.payment_type === 'adjustment' && p.note && p.note.includes('[CATEGORY:')
        if (isAdditionalExpense) {
          byDay.get(day).net_income -= amt // Xarajatlar ayiriladi
        } else {
          byDay.get(day).net_income += p.payment_type === 'refund' ? -amt : amt
        }
      })
      revenueData.value = Array.from(byDay.values())
        .sort((a, b) => a.day.localeCompare(b.day))
    } else if (revenuePeriod.value === 'week') {
      // Haftalik
      const byWeek = new Map()
      allPayments.forEach(p => {
        const date = new Date(p.paid_at || '')
        if (isNaN(date.getTime())) return
        const weekStart = getWeekStart(date)
        const weekKey = weekStart.toISOString().slice(0, 10)
        if (!byWeek.has(weekKey)) {
          byWeek.set(weekKey, { 
            week: `Hafta ${weekStart.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}`,
            net_income: 0 
          })
        }
        const amt = Number(p.amount) || 0
        const isAdditionalExpense = p.payment_type === 'adjustment' && p.note && p.note.includes('[CATEGORY:')
        if (isAdditionalExpense) {
          byWeek.get(weekKey).net_income -= amt // Xarajatlar ayiriladi
        } else {
          byWeek.get(weekKey).net_income += p.payment_type === 'refund' ? -amt : amt
        }
      })
      revenueData.value = Array.from(byWeek.values())
        .sort((a, b) => a.week.localeCompare(b.week))
    } else {
      // Oylik
      const byMonth = new Map()
      allPayments.forEach(p => {
        const date = (p.paid_at || '').slice(0, 7) + '-01'
        if (!date) return
        if (!byMonth.has(date)) {
          byMonth.set(date, { month: date, net_income: 0 })
        }
        const amt = Number(p.amount) || 0
        const isAdditionalExpense = p.payment_type === 'adjustment' && p.note && p.note.includes('[CATEGORY:')
        if (isAdditionalExpense) {
          byMonth.get(date).net_income -= amt // Xarajatlar ayiriladi
        } else {
          byMonth.get(date).net_income += p.payment_type === 'refund' ? -amt : amt
        }
      })
      revenueData.value = Array.from(byMonth.values())
        .sort((a, b) => a.month.localeCompare(b.month))
    }
  } catch (error) {
    console.error('Failed to load revenue data:', error)
    revenueData.value = []
  }
}

const getWeekStart = (date) => {
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

// Period o'zgarganda ma'lumotlarni qayta yuklash
watch(revenuePeriod, () => {
  loadRevenueData()
})

const inDateRange = (dateStr, startDate, endDate) => {
  if (!dateStr || !startDate || !endDate) return true
  const d = (dateStr || '').slice(0, 10)
  return d >= startDate && d <= endDate
}

const movementItemName = (itemId) => {
  const item = inventoryItems.value.find(i => Number(i.id) === Number(itemId))
  return item ? item.name : `#${itemId}`
}

const loadReports = async () => {
  loading.value.payments = true
  loading.value.income = true
  loading.value.debts = true
  loading.value.services = true
  loading.value.expenses = true
  loading.value.movements = true

  try {
    const { startDate, endDate } = filters.value
    const [
      paymentsData,
      debtVisits,
      doctorsData,
      patientsData,
      topServicesData,
      expensesData,
      movementsData,
      itemsData
    ] = await Promise.all([
      paymentsApi.getPaymentsByDateRange(startDate, endDate),
      visitsApi.getDebtVisits(),
      listDoctors(),
      listPatients(),
      getTopServices(),
      listExpenses('order=paid_at.desc'),
      listInventoryMovements('order=created_at.desc'),
      listInventoryItems('order=name.asc')
    ])

    payments.value = paymentsData || []
    doctors.value = doctorsData || []
    patients.value = patientsData || []
    topServices.value = (topServicesData || []).slice(0, 10)
    inventoryItems.value = itemsData || []

    const allExpenses = expensesData || []
    const allMovements = movementsData || []
    expensesList.value = allExpenses
      .filter(e => inDateRange(e.paid_at, startDate, endDate))
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
    movementsList.value = allMovements
      .filter(m => inDateRange(m.created_at, startDate, endDate))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    summary.value.totalExpenses = expensesList.value.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    summary.value.totalMovementsOut = movementsList.value
      .filter(m => m.type === 'out')
      .reduce((s, m) => s + (Number(m.quantity) || 0), 0)

    if (isSolo.value) {
      additionalExpenses.value = payments.value
        .filter(p => p.payment_type === 'adjustment' && p.note && p.note.includes('[CATEGORY:') && parseCategoryFromNote(p.note))
        .map(p => ({
          ...p,
          category: parseCategoryFromNote(p.note) || 'other'
        }))
        .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
    } else {
      additionalExpenses.value = []
    }

    applySummary()
    buildPaymentMethodStats()
    buildDebtors(debtVisits || [])
    await loadRevenueData()
  } catch (error) {
    console.error('Failed to load reports:', error)
    toast.error(t('reports.errorLoad') || 'Xatolik yuz berdi')
  } finally {
    loading.value.payments = false
    loading.value.income = false
    loading.value.debts = false
    loading.value.services = false
    loading.value.expenses = false
    loading.value.movements = false
  }
}

onMounted(() => {
  resetFilters()
  loadReports()
})
</script>
