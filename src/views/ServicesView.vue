<template>
  <MainLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('services.title') }}</h1>
          <p class="text-gray-500">{{ t('services.subtitle') }}</p>
        </div>
        <button
          v-if="activeTab === 'services'"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          @click="openServiceModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newService') }}
        </button>
        <button
          v-else-if="activeTab === 'packages'"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          @click="openPackageModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newPackage') }}
        </button>
        <button
          v-else-if="activeTab === 'discounts'"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-cyan-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          @click="openDiscountModal()"
        >
          <PlusIcon class="w-5 h-5" />
          {{ t('services.newDiscount') }}
        </button>
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
                    <th class="px-4 py-3">{{ t('services.status') }}</th>
                    <th class="px-4 py-3 text-right">{{ t('services.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="loading.services">
                    <td class="px-4 py-4 text-slate-500" colspan="6">{{ t('services.loading') }}</td>
                  </tr>
                  <tr v-else-if="filteredServices.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="6">{{ t('services.noServices') }}</td>
                  </tr>
                  <tr v-for="service in filteredServices" :key="service.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ service.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ service.category || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(service.base_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ service.duration_minutes || '-' }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="service.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ service.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button class="text-primary-600 hover:text-primary-700 text-sm mr-3" @click="openServiceModal(service)">
                        {{ t('services.edit') }}
                      </button>
                      <button class="text-rose-600 hover:text-rose-700 text-sm" @click="deleteServiceRow(service)">
                        {{ t('services.delete') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Packages tab -->
          <div v-else-if="activeTab === 'packages'" class="space-y-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200">
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
                  <tr v-if="loading.packages">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.loading') }}</td>
                  </tr>
                  <tr v-else-if="packages.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.noPackages') }}</td>
                  </tr>
                  <tr v-for="pkg in packages" :key="pkg.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ pkg.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatCurrency(pkg.base_price) }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      {{ formatDiscount(pkg.discount_type, pkg.discount_value) }}
                    </td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="pkg.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ pkg.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button class="text-primary-600 hover:text-primary-700 text-sm mr-3" @click="openPackageModal(pkg)">
                        {{ t('services.edit') }}
                      </button>
                      <button class="text-rose-600 hover:text-rose-700 text-sm" @click="deletePackageRow(pkg)">
                        {{ t('services.delete') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Discounts tab -->
          <div v-else-if="activeTab === 'discounts'" class="space-y-4">
            <div class="overflow-x-auto rounded-xl border border-slate-200">
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
                  <tr v-if="loading.discounts">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.loading') }}</td>
                  </tr>
                  <tr v-else-if="discountRules.length === 0">
                    <td class="px-4 py-4 text-slate-500" colspan="5">{{ t('services.noDiscounts') }}</td>
                  </tr>
                  <tr v-for="rule in discountRules" :key="rule.id" class="bg-white">
                    <td class="px-4 py-3 text-slate-700">{{ rule.name }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatScope(rule) }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ formatDiscount(rule.discount_type, rule.discount_value) }}</td>
                    <td class="px-4 py-3 text-slate-700">
                      <span
                        :class="rule.is_active ? 'text-emerald-600 font-medium' : 'text-gray-500'"
                      >
                        {{ rule.is_active ? t('services.active') : t('services.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button class="text-primary-600 hover:text-primary-700 text-sm mr-3" @click="openDiscountModal(rule)">
                        {{ t('services.edit') }}
                      </button>
                      <button class="text-rose-600 hover:text-rose-700 text-sm" @click="deleteDiscountRow(rule)">
                        {{ t('services.delete') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ discountForm.id ? t('services.editDiscount') : t('services.newDiscount') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeDiscountModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountName') }}</label>
                  <input v-model="discountForm.name" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.scope') }}</label>
                  <select v-model="discountForm.scope" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="service">{{ t('services.scopeService') }}</option>
                    <option value="category">{{ t('services.scopeCategory') }}</option>
                    <option value="package">{{ t('services.scopePackage') }}</option>
                    <option value="visit_total">{{ t('services.scopeVisitTotal') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.service') }}</label>
                  <select v-model="discountForm.service_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('services.selectService') }}</option>
                    <option v-for="service in services" :key="service.id" :value="String(service.id)">
                      {{ service.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.package') }}</label>
                  <select v-model="discountForm.package_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('services.selectPackage') }}</option>
                    <option v-for="pkg in packages" :key="pkg.id" :value="String(pkg.id)">
                      {{ pkg.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.category') }}</label>
                  <input v-model="discountForm.category" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountType') }}</label>
                  <select v-model="discountForm.discount_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="fixed">{{ t('services.discountFixed') }}</option>
                    <option value="percent">{{ t('services.discountPercent') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('services.discountValue') }}</label>
                  <input v-model="discountForm.discount_value" type="number" min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
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
                <div class="md:col-span-2">
                  <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input v-model="discountForm.is_active" type="checkbox" class="rounded border-gray-300" />
                    {{ t('services.active') }}
                  </label>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeDiscountModal">
                {{ t('services.cancel') }}
              </button>
              <button class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700" @click="saveDiscount">
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
import { PlusIcon } from '@heroicons/vue/24/outline'
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
  description: ''
})

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
      description: service.description || ''
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
      description: ''
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
  const payload = {
    name: serviceForm.value.name,
    category: serviceForm.value.category || null,
    base_price: Number(serviceForm.value.base_price) || 0,
    duration_minutes: serviceForm.value.duration_minutes ? Number(serviceForm.value.duration_minutes) : null,
    requires_tooth: Boolean(serviceForm.value.requires_tooth),
    is_active: Boolean(serviceForm.value.is_active),
    description: serviceForm.value.description || null
  }

  try {
    if (serviceForm.value.id) {
      await updateService(serviceForm.value.id, payload)
      toast.success(t('services.toastUpdated'))
    } else {
      await createService(payload)
      toast.success(t('services.toastCreated'))
    }
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
