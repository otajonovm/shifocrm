<template>
  <MainLayout>
    <ReportsSoloView v-if="isSolo" />
    <div v-else class="space-y-4 sm:space-y-6 animate-fade-in pb-6 pb-safe">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t('reports.subtitle') }}</p>
        </div>
        <div v-if="canExport" class="flex items-center gap-2">
          <button
            @click="exportDoctorRevenueExcel"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors touch-target"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            {{ t('reports.exportExcel') }}
          </button>
          <button
            @click="exportDoctorRevenuePdf"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors touch-target"
          >
            <DocumentArrowDownIcon class="w-4 h-4" />
            {{ t('reports.exportPdf') }}
          </button>
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
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.expensesTotal') }}</p>
          <p class="text-base sm:text-lg font-bold text-orange-600 truncate">{{ formatCurrency(summary.totalExpenses) }}</p>
        </div>
        <div class="mobile-card">
          <p class="text-xs text-gray-500 mb-1">{{ t('reports.movementsOutTotal') }}</p>
          <p class="text-base sm:text-lg font-bold text-slate-700 truncate">{{ summary.totalMovementsOut }} {{ t('reports.units') }}</p>
        </div>
      </div>

      <ReportsWeekTable
        :rows="weekRows"
        :loading="loading.week"
        :unique-patients="weekUniquePatients"
        :total-revenue="weekTotalRevenue"
      />

      <!-- Shifokorlar kesimida tushum va KPI (maosh) hisoboti -->
      <div class="mobile-card">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t('reports.doctorRevenueTitle') }}</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ t('reports.doctorRevenueSubtitle') }}</p>
          </div>
          <div v-if="canExport" class="flex items-center gap-2">
            <button
              @click="exportDoctorRevenueExcel"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
              {{ t('reports.exportExcel') }}
            </button>
            <button
              @click="exportDoctorRevenuePdf"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <DocumentArrowDownIcon class="w-4 h-4" />
              {{ t('reports.exportPdf') }}
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.doctor') }}</th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.paymentsCount') }}</th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.grossRevenue') }}</th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.kpiPercent') }}</th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.doctorShare') }}</th>
                <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reports.clinicShare') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loading.payments">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="6">{{ t('reports.loading') }}</td>
              </tr>
              <tr v-else-if="doctorRevenueRows.length === 0">
                <td class="px-4 sm:px-6 py-4 text-gray-500" colspan="6">{{ t('reports.noData') }}</td>
              </tr>
              <tr
                v-for="row in doctorRevenueRows"
                :key="row.doctorId ?? 'none'"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 sm:px-6 py-4 font-medium text-gray-900">{{ row.name }}</td>
                <td class="px-4 sm:px-6 py-4 text-right text-gray-600">{{ row.visitsCount }}</td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">{{ formatCurrency(row.gross) }}</td>
                <td class="px-4 sm:px-6 py-4 text-right text-gray-600">{{ row.salaryPercentage }}%</td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-sky-700">{{ formatCurrency(row.doctorShare) }}</td>
                <td class="px-4 sm:px-6 py-4 text-right font-semibold text-emerald-700">{{ formatCurrency(row.clinicShare) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="doctorRevenueRows.length > 0" class="bg-gray-50 border-t-2 border-gray-200">
              <tr class="font-bold text-gray-900">
                <td class="px-4 sm:px-6 py-3">{{ t('reports.total') }}</td>
                <td class="px-4 sm:px-6 py-3 text-right">{{ doctorRevenueTotals.visitsCount }}</td>
                <td class="px-4 sm:px-6 py-3 text-right">{{ formatCurrency(doctorRevenueTotals.gross) }}</td>
                <td class="px-4 sm:px-6 py-3 text-right">—</td>
                <td class="px-4 sm:px-6 py-3 text-right text-sky-700">{{ formatCurrency(doctorRevenueTotals.doctorShare) }}</td>
                <td class="px-4 sm:px-6 py-3 text-right text-emerald-700">{{ formatCurrency(doctorRevenueTotals.clinicShare) }}</td>
              </tr>
            </tfoot>
          </table>
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
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import ReportsSoloView from '@/views/ReportsSoloView.vue'
import ReportsWeekTable from '@/components/reports/ReportsWeekTable.vue'
import { computed, onActivated, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import ApexChart from 'vue3-apexcharts'
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { removeCategoryFromNote } from '@/api/paymentsApi'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'
import { useDataPermissionGuard, useDataPermission } from '@/composables/useDataPermission'
import { usePermission } from '@/composables/usePermission'
import { exportToCsv, exportToPdf } from '@/lib/exportData'
import { buildDoctorRevenueRows, summarizeDoctorRevenueRows } from '@/lib/doctorRevenueKpi'

defineOptions({ name: 'ReportsView' })

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const reportsStore = useReportsStore()

useDataPermissionGuard('can_view_revenue', {
  message: "Hisobotlar bo'limiga kirish huquqingiz yo'q.",
})

const { allowed: legacyCanExport } = useDataPermission('can_export_data')
const { can } = usePermission()
const canExport = computed(() => legacyCanExport.value && can('reports', 'create'))

const isSolo = computed(() => authStore.userRole === 'solo')

const {
  filters,
  revenuePeriod,
  loading,
  summary,
  payments,
  paymentMethods,
  topServices,
  revenueData,
  doctors,
  additionalExpenses,
  expensesList,
  movementsList,
  inventoryItems,
  weekRows,
  weekUniquePatients,
  weekTotalRevenue,
} = storeToRefs(reportsStore)

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' so\'m'
}

const resetFilters = () => {
  reportsStore.resetFilters()
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

watch(revenuePeriod, () => {
  reportsStore.rebuildRevenueData()
})

const movementItemName = (itemId) => {
  const item = inventoryItems.value.find(i => Number(i.id) === Number(itemId))
  return item ? item.name : `#${itemId}`
}

// ===== Shifokorlar kesimida tushum va KPI (distinct visit, net collected) =====
const doctorRevenueRows = computed(() =>
  buildDoctorRevenueRows({ payments: payments.value, doctors: doctors.value }),
)

const doctorRevenueTotals = computed(() =>
  summarizeDoctorRevenueRows(doctorRevenueRows.value),
)

// ===== Eksport (Excel / PDF) — can_export_data huquqi bilan himoyalangan =====
const ensureExportAllowed = () => {
  if (!canExport.value) {
    toast.error("Sizda ma'lumotlarni eksport qilish huquqi yo'q.")
    return false
  }
  return true
}

const exportPeriodLabel = () => {
  const { startDate, endDate } = filters.value
  if (!startDate && !endDate) return ''
  return `${formatDateShort(startDate)} — ${formatDateShort(endDate)}`
}

const doctorRevenueColumns = [
  { key: 'name', label: 'Shifokor' },
  { key: 'visitsCount', label: "To'lovlar soni", type: 'number' },
  { key: 'gross', label: 'Jami tushum', type: 'number', value: (r) => formatCurrency(r.gross) },
  { key: 'salaryPercentage', label: 'Ulush (%)', type: 'number', value: (r) => `${r.salaryPercentage}%` },
  { key: 'doctorShare', label: 'Shifokor ulushi', type: 'number', value: (r) => formatCurrency(r.doctorShare) },
  { key: 'clinicShare', label: 'Klinika foydasi', type: 'number', value: (r) => formatCurrency(r.clinicShare) },
]

const doctorRevenueSummary = () => {
  const tt = doctorRevenueTotals.value
  return [
    { label: 'Jami tushum', value: formatCurrency(tt.gross) },
    { label: 'Shifokorlar ulushi (jami)', value: formatCurrency(tt.doctorShare) },
    { label: 'Klinika sof foydasi', value: formatCurrency(tt.clinicShare) },
  ]
}

const exportDoctorRevenueExcel = () => {
  if (!ensureExportAllowed()) return
  try {
    if (!doctorRevenueRows.value.length) {
      toast.error(t('reports.noData'))
      return
    }
    exportToCsv('shifokorlar_hisoboti', doctorRevenueColumns, doctorRevenueRows.value)
    toast.success('Excel fayl yuklab olindi')
  } catch (error) {
    console.error('Doctor revenue Excel export failed:', error)
    toast.error("Eksport qilishda xatolik yuz berdi")
  }
}

const exportDoctorRevenuePdf = () => {
  if (!ensureExportAllowed()) return
  try {
    if (!doctorRevenueRows.value.length) {
      toast.error(t('reports.noData'))
      return
    }
    exportToPdf({
      title: 'Shifokorlar kesimida tushum va KPI hisoboti',
      subtitle: exportPeriodLabel(),
      columns: doctorRevenueColumns,
      rows: doctorRevenueRows.value,
      summary: doctorRevenueSummary(),
    })
  } catch (error) {
    console.error('Doctor revenue PDF export failed:', error)
    toast.error(error.message || 'Eksport qilishda xatolik yuz berdi')
  }
}

const loadReports = () => reportsStore.fetchReports()

onMounted(() => {
  reportsStore.ensureDefaultFilters()
  reportsStore.fetchReports()
})

onActivated(() => {
  reportsStore.fetchReports()
})
</script>

