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
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg active:shadow-md transition-all touch-manipulation min-h-[44px]"
          @click="openServiceModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newService') }}
        </button>
        <button
          v-else-if="activeTab === 'packages'"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg active:shadow-md transition-all touch-manipulation min-h-[44px]"
          @click="openPackageModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newPackage') }}
        </button>
        <button
          v-else-if="activeTab === 'discounts'"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg active:shadow-md transition-all touch-manipulation min-h-[44px]"
          @click="openDiscountModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newDiscount') }}
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

          <!-- Packages tab -->
          <div v-else-if="activeTab === 'packages'" class="space-y-4">
            <div v-if="loading.packages" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
            <div
              v-else-if="packages.length === 0"
              class="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100"
            >
              <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <ArchiveBoxIcon class="w-8 h-8 text-primary-600" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ t('services.packagesEmptyTitle') }}</h3>
              <p class="text-sm text-gray-500 text-center max-w-sm mb-6">{{ t('services.packagesEmptyHint') }}</p>
              <button
                @click="openPackageModal()"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation min-h-[44px]"
              >
                <PlusIcon class="w-5 h-5" />
                {{ t('services.newPackage') }}
              </button>
            </div>
            <template v-else>
              <div class="md:hidden space-y-3">
                <div
                  v-for="pkg in packages"
                  :key="pkg.id"
                  class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm active:bg-slate-50 transition-colors"
                >
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <h4 class="font-semibold text-gray-900">{{ pkg.name }}</h4>
                    <span
                      class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="pkg.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ pkg.is_active ? t('services.active') : t('services.inactive') }}
                    </span>
                  </div>
                  <div class="space-y-1 text-sm text-slate-600 mb-4">
                    <p><span class="text-slate-500">{{ t('services.price') }}:</span> {{ formatCurrency(pkg.base_price) }}</p>
                    <p><span class="text-slate-500">{{ t('services.discount') }}:</span> {{ formatDiscount(pkg.discount_type, pkg.discount_value) }}</p>
                  </div>
                <div class="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    @click="openPackageModal(pkg)"
                    class="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 active:bg-primary-200 transition-colors touch-manipulation"
                    :title="t('services.edit')"
                  >
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="deletePackageRow(pkg)"
                    class="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 active:bg-rose-200 transition-colors touch-manipulation"
                    :title="t('services.delete')"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
                </div>
              </div>
              <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('services.packageName') }}</th>
                    <th class="px-4 py-3">{{ t('services.price') }}</th>
                    <th class="px-4 py-3">{{ t('services.discount') }}</th>
                    <th class="px-4 py-3">{{ t('services.status') }}</th>
                    <th class="px-4 py-3 text-right">{{ t('services.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="pkg in packages" :key="pkg.id" class="bg-white hover:bg-slate-50/50 transition-colors">
                    <td class="px-4 py-3 text-slate-700 font-medium">{{ pkg.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(pkg.base_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                        {{ formatDiscount(pkg.discount_type, pkg.discount_value) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="pkg.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ pkg.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          :title="t('services.edit')"
                          @click="openPackageModal(pkg)"
                        >
                          <PencilSquareIcon class="w-5 h-5" />
                        </button>
                        <button
                          class="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          :title="t('services.delete')"
                          @click="deletePackageRow(pkg)"
                        >
                          <TrashIcon class="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            </template>
          </div>

          <!-- Discounts tab -->
          <div v-else-if="activeTab === 'discounts'" class="space-y-4">
            <!-- Loading -->
            <div v-if="loading.discounts" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>

            <!-- Empty state — doktor uchun tushunarli, CTA bilan -->
            <div
              v-else-if="discountRules.length === 0"
              class="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100"
            >
              <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <ReceiptPercentIcon class="w-8 h-8 text-primary-600" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ t('services.discountsEmptyTitle') }}</h3>
              <p class="text-sm text-gray-500 text-center max-w-sm mb-6">{{ t('services.discountsEmptyHint') }}</p>
              <button
                @click="openDiscountModal()"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation min-h-[44px]"
              >
                <PlusIcon class="w-5 h-5" />
                {{ t('services.newDiscount') }}
              </button>
            </div>

            <!-- Mobile card list + Desktop table -->
            <template v-else>
              <div class="md:hidden space-y-3">
                <div
                  v-for="rule in discountRules"
                  :key="rule.id"
                  class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm active:bg-slate-50 transition-colors"
                >
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <h4 class="font-semibold text-gray-900">{{ rule.name }}</h4>
                    <span
                      class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ rule.is_active ? t('services.active') : t('services.inactive') }}
                    </span>
                  </div>
                  <div class="space-y-1 text-sm text-slate-600 mb-4">
                    <p><span class="text-slate-500">{{ t('services.scope') }}:</span> {{ formatScope(rule) }}</p>
                    <p><span class="text-slate-500">{{ t('services.discount') }}:</span> {{ formatDiscount(rule.discount_type, rule.discount_value) }}</p>
                  </div>
                <div class="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    @click="openDiscountModal(rule)"
                    class="flex-1 inline-flex items-center justify-center py-2.5 text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 active:bg-primary-200 transition-colors touch-manipulation"
                    :title="t('services.edit')"
                  >
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="deleteDiscountRow(rule)"
                    class="flex-1 inline-flex items-center justify-center py-2.5 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 active:bg-rose-200 transition-colors touch-manipulation"
                    :title="t('services.delete')"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
                </div>
              </div>

              <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('services.discountName') }}</th>
                    <th class="px-4 py-3">{{ t('services.scope') }}</th>
                    <th class="px-4 py-3">{{ t('services.discount') }}</th>
                    <th class="px-4 py-3">{{ t('services.status') }}</th>
                    <th class="px-4 py-3 text-right">{{ t('services.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="rule in discountRules" :key="rule.id" class="bg-white hover:bg-slate-50/50 transition-colors">
                    <td class="px-4 py-3 text-slate-700 font-medium">{{ rule.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatScope(rule) }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                        {{ formatDiscount(rule.discount_type, rule.discount_value) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="rule.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ rule.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          :title="t('services.edit')"
                          @click="openDiscountModal(rule)"
                        >
                          <PencilSquareIcon class="w-5 h-5" />
                        </button>
                        <button
                          class="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          :title="t('services.delete')"
                          @click="deleteDiscountRow(rule)"
                        >
                          <TrashIcon class="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            </template>
          </div>

          <!-- Audit tab -->
          <div v-else-if="activeTab === 'audit'" class="space-y-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">{{ t('services.auditService') }}</th>
                    <th class="px-4 py-3">{{ t('services.auditOldPrice') }}</th>
                    <th class="px-4 py-3">{{ t('services.auditNewPrice') }}</th>
                    <th class="px-4 py-3">{{ t('services.auditChangedBy') }}</th>
                    <th class="px-4 py-3">{{ t('services.auditChangedAt') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.audit">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.loading') }}</td>
                  </tr>
                  <tr v-else-if="auditEntries.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.noAudit') }}</td>
                  </tr>
                  <tr v-for="entry in auditEntries" :key="entry.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ serviceName(entry.service_id) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(entry.old_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(entry.new_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ entry.changed_by || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatDate(entry.changed_at) }}</td>
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

    <!-- Package modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.package" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closePackageModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ packageForm.id ? t('services.editPackage') : t('services.newPackage') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closePackageModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.packageName') }}</label>
                  <input v-model="packageForm.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.price') }}</label>
                  <input v-model="packageForm.base_price" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountType') }}</label>
                  <select v-model="packageForm.discount_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="fixed">{{ t('services.discountFixed') }}</option>
                    <option value="percent">{{ t('services.discountPercent') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountValue') }}</label>
                  <input v-model="packageForm.discount_value" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.notes') }}</label>
                  <textarea v-model="packageForm.description" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"></textarea>
                </div>
                <div class="md:col-span-2">
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input v-model="packageForm.is_active" type="checkbox" class="rounded border-gray-300" />
                    {{ t('services.active') }}
                  </label>
                </div>
              </div>

              <div class="rounded-lg border border-gray-100 p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-gray-700">{{ t('services.packageItems') }}</h4>
                  <button class="text-sm text-primary-600 hover:text-primary-700" @click="addPackageItem">
                    {{ t('services.addItem') }}
                  </button>
                </div>
                <div v-if="packageForm.items.length === 0" class="text-sm text-gray-500">
                  {{ t('services.noPackageItems') }}
                </div>
                <div v-for="(item, index) in packageForm.items" :key="index" class="grid gap-3 md:grid-cols-3 items-center mb-2">
                  <select v-model="item.service_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('services.selectService') }}</option>
                    <option v-for="service in services" :key="service.id" :value="String(service.id)">
                      {{ service.name }}
                    </option>
                  </select>
                  <input v-model="item.quantity" type="number" min="1" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <button class="text-rose-600 text-sm" @click="removePackageItem(index)">
                    {{ t('services.remove') }}
                  </button>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closePackageModal">
                {{ t('services.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="savePackage">
                {{ t('services.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Discount modal -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modals.discount" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeDiscountModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-6 sm:py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ discountForm.id ? t('services.editDiscount') : t('services.newDiscount') }}
              </h3>
              <button class="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 touch-manipulation" @click="closeDiscountModal">×</button>
            </div>
            <div class="px-4 sm:px-6 py-4 overflow-y-auto flex-1 space-y-6">
              <!-- Asosiy — doktor tez kiritadi -->
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-gray-800">{{ t('services.discountMainSection') }}</h4>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountName') }}</label>
                    <input v-model="discountForm.name" type="text" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" :placeholder="t('services.discountNamePlaceholder')" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountType') }}</label>
                    <select v-model="discountForm.discount_type" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="percent">{{ t('services.discountPercent') }}</option>
                      <option value="fixed">{{ t('services.discountFixed') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountValue') }}</label>
                    <input v-model="discountForm.discount_value" type="number" min="0" step="1" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" :placeholder="discountForm.discount_type === 'percent' ? '10' : '50000'" />
                  </div>
                </div>
              </div>

              <!-- Qo'llanish sohasi -->
              <div class="space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <h4 class="text-sm font-semibold text-gray-800">{{ t('services.scope') }}</h4>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.scope') }}</label>
                  <select v-model="discountForm.scope" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="service">{{ t('services.scopeService') }}</option>
                    <option value="category">{{ t('services.scopeCategory') }}</option>
                    <option value="package">{{ t('services.scopePackage') }}</option>
                    <option value="visit_total">{{ t('services.scopeVisitTotal') }}</option>
                  </select>
                </div>
                <div v-if="discountForm.scope === 'service'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.service') }}</label>
                  <select v-model="discountForm.service_id" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">{{ t('services.selectService') }}</option>
                    <option v-for="service in services" :key="service.id" :value="String(service.id)">
                      {{ service.name }}
                    </option>
                  </select>
                </div>
                <div v-else-if="discountForm.scope === 'package'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.package') }}</label>
                  <select v-model="discountForm.package_id" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">{{ t('services.selectPackage') }}</option>
                    <option v-for="pkg in packages" :key="pkg.id" :value="String(pkg.id)">
                      {{ pkg.name }}
                    </option>
                  </select>
                </div>
                <div v-else-if="discountForm.scope === 'category'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.category') }}</label>
                  <input v-model="discountForm.category" type="text" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" :placeholder="t('services.categoryPlaceholder')" />
                </div>
              </div>

              <!-- Qo'shimcha (ixtiyoriy) -->
              <details class="rounded-xl border border-gray-100">
                <summary class="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-xl">
                  {{ t('services.discountOptionalSection') }}
                </summary>
                <div class="px-4 pb-4 pt-2 space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.minAmount') }}</label>
                      <input v-model="discountForm.min_amount" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.minServicesCount') }}</label>
                      <input v-model="discountForm.min_services_count" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.validFrom') }}</label>
                      <input v-model="discountForm.valid_from" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.validTo') }}</label>
                      <input v-model="discountForm.valid_to" type="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              </details>

              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input v-model="discountForm.is_active" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                {{ t('services.active') }}
              </label>
            </div>
            <div class="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 flex-shrink-0">
              <button class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]" @click="closeDiscountModal">
                {{ t('services.cancel') }}
              </button>
              <button class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation min-h-[44px]" @click="saveDiscount">
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
import { PlusIcon, ReceiptPercentIcon, ArchiveBoxIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import {
  listServices,
  createService,
  updateService,
  deleteService,
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  listPackageItemsByPackageId,
  createPackageItem,
  deletePackageItem,
  listDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
  listServicePriceAudit,
  getTopServices,
  getServiceRevenueMonthly
} from '@/api/servicesApi'

const { t } = useI18n()
const toast = useToast()

const tabs = [
  { id: 'services', label: 'services.tabServices' },
  { id: 'packages', label: 'services.tabPackages' },
  { id: 'discounts', label: 'services.tabDiscounts' },
  { id: 'audit', label: 'services.tabAudit' },
  { id: 'stats', label: 'services.tabStats' }
]

const activeTab = ref('services')
const services = ref([])
const packages = ref([])
const discountRules = ref([])
const auditEntries = ref([])
const topServices = ref([])
const monthlyRevenue = ref([])

const loading = ref({
  services: false,
  packages: false,
  discounts: false,
  audit: false,
  stats: false
})

const filters = ref({
  search: '',
  category: '',
  status: ''
})

const modals = ref({
  service: false,
  package: false,
  discount: false
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

const packageForm = ref({
  id: null,
  name: '',
  description: '',
  base_price: '',
  discount_type: 'fixed',
  discount_value: 0,
  is_active: true,
  items: []
})

const discountForm = ref({
  id: null,
  name: '',
  scope: 'service',
  service_id: '',
  category: '',
  package_id: '',
  discount_type: 'fixed',
  discount_value: 0,
  min_amount: '',
  min_services_count: '',
  valid_from: '',
  valid_to: '',
  is_active: true
})

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

const loadPackages = async () => {
  loading.value.packages = true
  try {
    packages.value = await listPackages('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load packages:', error)
    packages.value = []
  } finally {
    loading.value.packages = false
  }
}

const loadDiscounts = async () => {
  loading.value.discounts = true
  try {
    discountRules.value = await listDiscountRules('order=created_at.desc')
  } catch (error) {
    console.error('Failed to load discounts:', error)
    discountRules.value = []
  } finally {
    loading.value.discounts = false
  }
}

const loadAudit = async () => {
  loading.value.audit = true
  try {
    auditEntries.value = await listServicePriceAudit('order=changed_at.desc&limit=50')
  } catch (error) {
    console.error('Failed to load audit:', error)
    auditEntries.value = []
  } finally {
    loading.value.audit = false
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

const openPackageModal = async (pkg = null) => {
  if (pkg) {
    packageForm.value = {
      id: pkg.id,
      name: pkg.name || '',
      description: pkg.description || '',
      base_price: pkg.base_price ?? '',
      discount_type: pkg.discount_type || 'fixed',
      discount_value: pkg.discount_value ?? 0,
      is_active: Boolean(pkg.is_active),
      items: []
    }
    try {
      const items = await listPackageItemsByPackageId(pkg.id)
      packageForm.value.items = items.map(item => ({
        service_id: item.service_id ? String(item.service_id) : '',
        quantity: item.quantity || 1,
        id: item.id
      }))
    } catch (error) {
      console.error('Failed to load package items:', error)
    }
  } else {
    packageForm.value = {
      id: null,
      name: '',
      description: '',
      base_price: '',
      discount_type: 'fixed',
      discount_value: 0,
      is_active: true,
      items: []
    }
  }
  modals.value.package = true
}

const closePackageModal = () => {
  modals.value.package = false
}

const addPackageItem = () => {
  packageForm.value.items.push({ service_id: '', quantity: 1 })
}

const removePackageItem = (index) => {
  packageForm.value.items.splice(index, 1)
}

const savePackage = async () => {
  if (!packageForm.value.name) {
    toast.error(t('services.errorNameRequired'))
    return
  }
  const payload = {
    name: packageForm.value.name,
    description: packageForm.value.description || null,
    base_price: Number(packageForm.value.base_price) || 0,
    discount_type: packageForm.value.discount_type,
    discount_value: Number(packageForm.value.discount_value) || 0,
    is_active: Boolean(packageForm.value.is_active)
  }

  try {
    let savedPackageId = packageForm.value.id
    if (packageForm.value.id) {
      await updatePackage(packageForm.value.id, payload)
    } else {
      const created = await createPackage(payload)
      savedPackageId = created.id
    }

    const existingItems = savedPackageId ? await listPackageItemsByPackageId(savedPackageId) : []
    for (const item of existingItems) {
      await deletePackageItem(item.id)
    }
    for (const item of packageForm.value.items) {
      if (!item.service_id) continue
      await createPackageItem({
        package_id: savedPackageId,
        service_id: Number(item.service_id),
        quantity: Number(item.quantity) || 1,
        is_required: true
      })
    }

    toast.success(packageForm.value.id ? t('services.toastUpdated') : t('services.toastCreated'))
    await loadPackages()
    closePackageModal()
  } catch (error) {
    console.error('Failed to save package:', error)
    toast.error(t('services.errorSave'))
  }
}

const deletePackageRow = async (pkg) => {
  if (!window.confirm(t('services.confirmDelete'))) return
  try {
    await deletePackage(pkg.id)
    toast.success(t('services.toastDeleted'))
    await loadPackages()
  } catch (error) {
    console.error('Failed to delete package:', error)
    toast.error(t('services.errorDelete'))
  }
}

const openDiscountModal = (rule = null) => {
  if (rule) {
    discountForm.value = {
      id: rule.id,
      name: rule.name || '',
      scope: rule.scope || 'service',
      service_id: rule.service_id ? String(rule.service_id) : '',
      category: rule.category || '',
      package_id: rule.package_id ? String(rule.package_id) : '',
      discount_type: rule.discount_type || 'fixed',
      discount_value: rule.discount_value ?? 0,
      min_amount: rule.min_amount ?? '',
      min_services_count: rule.min_services_count ?? '',
      valid_from: rule.valid_from || '',
      valid_to: rule.valid_to || '',
      is_active: Boolean(rule.is_active)
    }
  } else {
    discountForm.value = {
      id: null,
      name: '',
      scope: 'service',
      service_id: '',
      category: '',
      package_id: '',
      discount_type: 'fixed',
      discount_value: 0,
      min_amount: '',
      min_services_count: '',
      valid_from: '',
      valid_to: '',
      is_active: true
    }
  }
  modals.value.discount = true
}

const closeDiscountModal = () => {
  modals.value.discount = false
}

const saveDiscount = async () => {
  if (!discountForm.value.name) {
    toast.error(t('services.errorNameRequired'))
    return
  }
  const payload = {
    name: discountForm.value.name,
    scope: discountForm.value.scope,
    service_id: discountForm.value.service_id ? Number(discountForm.value.service_id) : null,
    category: discountForm.value.category || null,
    package_id: discountForm.value.package_id ? Number(discountForm.value.package_id) : null,
    discount_type: discountForm.value.discount_type,
    discount_value: Number(discountForm.value.discount_value) || 0,
    min_amount: discountForm.value.min_amount ? Number(discountForm.value.min_amount) : null,
    min_services_count: discountForm.value.min_services_count ? Number(discountForm.value.min_services_count) : null,
    valid_from: discountForm.value.valid_from || null,
    valid_to: discountForm.value.valid_to || null,
    is_active: Boolean(discountForm.value.is_active)
  }

  try {
    if (discountForm.value.id) {
      await updateDiscountRule(discountForm.value.id, payload)
      toast.success(t('services.toastUpdated'))
    } else {
      await createDiscountRule(payload)
      toast.success(t('services.toastCreated'))
    }
    await loadDiscounts()
    closeDiscountModal()
  } catch (error) {
    console.error('Failed to save discount:', error)
    toast.error(t('services.errorSave'))
  }
}

const deleteDiscountRow = async (rule) => {
  if (!window.confirm(t('services.confirmDelete'))) return
  try {
    await deleteDiscountRule(rule.id)
    toast.success(t('services.toastDeleted'))
    await loadDiscounts()
  } catch (error) {
    console.error('Failed to delete discount:', error)
    toast.error(t('services.errorDelete'))
  }
}

onMounted(async () => {
  await Promise.all([loadServices(), loadPackages(), loadDiscounts(), loadAudit(), loadStats()])
})
</script>
