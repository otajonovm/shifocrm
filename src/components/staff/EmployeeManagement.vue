<template>
  <div>
    <!-- Yangi xodim formasi -->
    <div v-if="canManageStaff" class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Klinikaga yangi xodim qo'shish
      </h2>

      <form @submit.prevent="handleCreate" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
              Ism-sharifi *
            </label>
            <input
              id="full_name"
              v-model="form.full_name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Masalan: Dr. Aliyev"
            />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
              Telefon raqami *
            </label>
            <input
              id="phone"
              :value="form.phone"
              type="tel"
              required
              autocomplete="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              :placeholder="UZ_PHONE_PLACEHOLDER"
              @input="onPhoneInput($event, 'create')"
              @focus="ensurePhonePrefix('create')"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email manzili
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="doctor@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Tizimga kirish paroli *
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showCreatePassword ? 'text' : 'password'"
                required
                minlength="6"
                class="w-full px-4 py-2 pr-11 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Kamida 6 ta belgi"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                :aria-label="showCreatePassword ? 'Parolni yashirish' : 'Parolni ko\'rish'"
                @click="showCreatePassword = !showCreatePassword"
              >
                <EyeSlashIcon v-if="showCreatePassword" class="h-5 w-5" />
                <EyeIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label for="specialization" class="block text-sm font-medium text-gray-700 mb-2">
              Klinikadagi mutaxassisligi (Roli)
            </label>
            <select
              id="specialization"
              v-model="form.specialization"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              @change="onSpecializationChange('create')"
            >
              <option value="">Mutaxassislikni tanlang</option>
              <option v-for="option in specializationOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <div v-if="isDoctorRole(form.specialization)">
            <label for="salary_percentage" class="block text-sm font-medium text-gray-700 mb-2">
              Shifokor ulushi / Foiz stavkasi (%)
            </label>
            <input
              id="salary_percentage"
              v-model="form.salary_percentage"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Masalan: 30"
            />
          </div>

          <div v-else-if="form.specialization">
            <label for="fixed_salary_amount" class="block text-sm font-medium text-gray-700 mb-2">
              Fiksirlangan oylik maosh (so'm)
            </label>
            <input
              id="fixed_salary_amount"
              v-model="form.fixed_salary_amount"
              type="number"
              min="0"
              step="1000"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Masalan: 5000000"
            />
          </div>

          <div v-if="isDoctorRole(form.specialization)">
            <label for="chair" class="block text-sm font-medium text-gray-700 mb-2">
              Biriktirilgan Stomatologik Kreslo (Kabinet) *
            </label>
            <select
              id="chair"
              v-model="form.chair"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Kresloni tanlang</option>
              <option v-for="opt in chairOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="flex items-end">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700">Xodim faol (Aktiv)</span>
            </label>
          </div>
        </div>

        <!-- Haftalik ish jadvali (faqat shifokorlar) -->
        <div v-if="isDoctorRole(form.specialization)" class="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Haftalik ish jadvali</h3>
          <div class="space-y-3">
            <div
              v-for="day in weekDays"
              :key="day.key"
              class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
            >
              <label class="flex items-center gap-2 min-w-[120px] cursor-pointer">
                <input
                  v-model="form.work_schedule.days[day.key].enabled"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-800">{{ day.label }}</span>
              </label>
              <template v-if="form.work_schedule.days[day.key].enabled">
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500">Boshlanishi</label>
                  <input
                    v-model="form.work_schedule.days[day.key].start"
                    type="time"
                    class="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500">Tugashi</label>
                  <input
                    v-model="form.work_schedule.days[day.key].end"
                    type="time"
                    class="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ formError }}</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? 'Saqlanmoqda...' : 'Xodimni saqlash' }}
        </button>
      </form>
    </div>

    <div v-else class="bg-white rounded-lg shadow-md p-6 mb-8">
      <p class="text-sm text-gray-600">
        {{ isClinicAdminOnly ? "Xodim qo'shish Sozlamalar bo'limida mavjud." : "Sizda xodim qo'shish huquqi yo'q." }}
      </p>
    </div>

    <!-- Xodimlar jadvali -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Xodimlar va Ish grafiklari paneli</h2>
        <button
          @click="refreshEmployees"
          :disabled="employeesStore.isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Yangilash
        </button>
      </div>

      <div v-if="employeesStore.error" class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-600">{{ employeesStore.error }}</p>
      </div>

      <div v-if="employeesStore.isLoading" class="text-center py-8">
        <LoadingSpinner message="Xodimlar yuklanmoqda..." />
      </div>

      <div v-else-if="employeesStore.items.length === 0" class="text-center py-8">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p class="text-gray-600">Xodimlar topilmadi</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Xodim ismi
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
              <th
                v-if="canManageStaff"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mutaxassisligi
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kreslo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ish kunlari
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ish soatlari
              </th>
              <th
                v-if="canManageStaff"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                KPI %
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th
                v-if="canManageStaff"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amallar
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="employee in employeesStore.items" :key="employee.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ employee.full_name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ displayPhone(employee.phone) }}</div>
              </td>
              <td v-if="canManageStaff" class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ employee.email || '—' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm text-gray-600">{{ employee.specialization || '—' }}</span>
                  <span
                    v-if="getChairLabel(employee) !== '—'"
                    class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {{ getChairLabel(employee) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ getChairLabel(employee) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-700">{{ getWorkDaysShort(employee) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ getWorkHoursSummary(employee) }}</div>
              </td>
              <td v-if="canManageStaff" class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ getKpiLabel(employee) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    employee.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  ]"
                >
                  {{ employee.is_active ? 'Faol' : 'Nofaol' }}
                </span>
              </td>
              <td v-if="canManageStaff" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditModal(employee)"
                  class="text-gray-600 hover:text-gray-900 mr-3"
                >
                  Tahrirlash
                </button>
                <button
                  @click="openPermissionsModal(employee)"
                  class="text-blue-600 hover:text-blue-900 mr-3"
                  title="Huquqlarni boshqarish"
                >
                  Huquqlar
                </button>
                <button
                  @click="handleDeleteEmployee(employee.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  O'chirish
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tahrirlash modali -->
    <div
      v-if="isEditOpen && canManageStaff"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeEditModal"
    >
      <div class="w-full max-w-3xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <h3 class="text-base font-semibold text-gray-900">Xodimni tahrirlash</h3>
          <button
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="closeEditModal"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <form class="px-6 py-5 overflow-y-auto flex-1 space-y-5" @submit.prevent="handleUpdate">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ism-sharifi *</label>
              <input
                v-model="editForm.full_name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Telefon raqami *</label>
              <input
                :value="editForm.phone"
                type="tel"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                :placeholder="UZ_PHONE_PLACEHOLDER"
                @input="onPhoneInput($event, 'edit')"
                @focus="ensurePhonePrefix('edit')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                v-model="editForm.email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Yangi parol (ixtiyoriy)</label>
              <div class="relative">
                <input
                  v-model="editForm.password"
                  :type="showEditPassword ? 'text' : 'password'"
                  minlength="6"
                  class="w-full px-4 py-2 pr-11 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="O'zgartirmasangiz bo'sh qoldiring"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  @click="showEditPassword = !showEditPassword"
                >
                  <EyeSlashIcon v-if="showEditPassword" class="h-5 w-5" />
                  <EyeIcon v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mutaxassisligi (Roli)</label>
              <select
                v-model="editForm.specialization"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                @change="onSpecializationChange('edit')"
              >
                <option value="">Mutaxassislikni tanlang</option>
                <option v-for="option in specializationOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            <div v-if="isDoctorRole(editForm.specialization)">
              <label class="block text-sm font-medium text-gray-700 mb-2">Shifokor ulushi (%)</label>
              <input
                v-model="editForm.salary_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div v-else-if="editForm.specialization">
              <label class="block text-sm font-medium text-gray-700 mb-2">Fiksirlangan oylik maosh (so'm)</label>
              <input
                v-model="editForm.fixed_salary_amount"
                type="number"
                min="0"
                step="1000"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Masalan: 5000000"
              />
            </div>
            <div v-if="isDoctorRole(editForm.specialization)">
              <label class="block text-sm font-medium text-gray-700 mb-2">Biriktirilgan kreslo *</label>
              <select
                v-model="editForm.chair"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Kresloni tanlang</option>
                <option v-for="opt in chairOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex items-end">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="editForm.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">Faol</span>
              </label>
            </div>
          </div>

          <div v-if="isDoctorRole(editForm.specialization)" class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Haftalik ish jadvali</h4>
            <div class="space-y-3">
              <div
                v-for="day in weekDays"
                :key="`edit-${day.key}`"
                class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2"
              >
                <label class="flex items-center gap-2 min-w-[120px] cursor-pointer">
                  <input
                    v-model="editForm.work_schedule.days[day.key].enabled"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-800">{{ day.label }}</span>
                </label>
                <template v-if="editForm.work_schedule.days[day.key].enabled">
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500">Boshlanishi</label>
                    <input
                      v-model="editForm.work_schedule.days[day.key].start"
                      type="time"
                      class="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-gray-500">Tugashi</label>
                    <input
                      v-model="editForm.work_schedule.days[day.key].end"
                      type="time"
                      class="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div v-if="editError" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ editError }}</p>
          </div>
        </form>

        <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 flex-shrink-0">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            @click="closeEditModal"
          >
            Bekor qilish
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="editSaving"
            @click="handleUpdate"
          >
            {{ editSaving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Huquqlar modali -->
    <div
      v-if="isPermissionsOpen && canManageStaff"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closePermissionsModal"
    >
      <div class="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {{ (selectedEmployee?.full_name || '?')[0].toUpperCase() }}
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">{{ selectedEmployee?.full_name || '' }}</h3>
              <p class="text-xs text-gray-500">{{ selectedEmployee?.specialization || 'Mutaxassislik ko\'rsatilmagan' }}</p>
            </div>
          </div>
          <button
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="closePermissionsModal"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <div class="border-b border-gray-100 px-6 flex-shrink-0">
          <nav class="flex gap-1">
            <button
              class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="activePermissionsTab === 'info'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'"
              @click="activePermissionsTab = 'info'"
            >
              Asosiy ma'lumot
            </button>
            <button
              class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="activePermissionsTab === 'modules'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'"
              @click="activePermissionsTab = 'modules'"
            >
              Modullar
              <span class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {{ activeModulesCount }}/{{ totalModulesCount }}
              </span>
            </button>
            <button
              class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              :class="activePermissionsTab === 'permissions'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'"
              @click="activePermissionsTab = 'permissions'"
            >
              Ma'lumot huquqlari
            </button>
          </nav>
        </div>

        <div class="px-6 py-5 overflow-y-auto flex-1">
          <div v-if="activePermissionsTab === 'info'" class="space-y-3">
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 mb-1">Mutaxassisligi/Roli</p>
              <p class="text-sm font-medium text-gray-900">{{ selectedEmployee?.specialization || '—' }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 mb-1">Telefon</p>
              <p class="text-sm font-medium text-gray-900">{{ displayPhone(selectedEmployee?.phone) }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 mb-1">Kreslo</p>
              <p class="text-sm font-medium text-gray-900">{{ getChairLabel(selectedEmployee) }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 mb-1">Ish jadvali</p>
              <p class="text-sm font-medium text-gray-900">
                {{ getWorkDaysShort(selectedEmployee) }} · {{ getWorkHoursSummary(selectedEmployee) }}
              </p>
            </div>
          </div>

          <div v-else-if="activePermissionsTab === 'modules'" class="space-y-2">
            <p class="text-xs text-gray-500 mb-4">
              Quyidagi modullardan faqat belgilanganlari xodimning yon menyusida ko'rinadi.
            </p>
            <div
              v-for="mod in modulePermissionDefs"
              :key="mod.key"
              class="flex items-center justify-between rounded-xl border p-4 transition-colors"
              :class="mod.alwaysEnabled
                ? 'border-gray-100 bg-gray-50 opacity-70'
                : moduleForm[mod.key]
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="moduleForm[mod.key] ? 'bg-blue-100' : 'bg-gray-100'"
                >
                  <svg v-if="moduleForm[mod.key]" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ mod.labelUz }}</p>
                  <p class="text-xs text-gray-500">{{ mod.descUz }}</p>
                  <span v-if="mod.alwaysEnabled" class="inline-block mt-1 text-xs text-blue-600 font-medium">Har doim yoqilgan</span>
                </div>
              </div>
              <button
                type="button"
                :disabled="mod.alwaysEnabled"
                @click="!mod.alwaysEnabled && (moduleForm[mod.key] = !moduleForm[mod.key])"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="[
                  mod.alwaysEnabled || moduleForm[mod.key] ? 'bg-blue-600' : 'bg-gray-200',
                  mod.alwaysEnabled ? 'cursor-not-allowed' : 'cursor-pointer',
                ]"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                  :class="mod.alwaysEnabled || moduleForm[mod.key] ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                @click="enableAllModules"
                class="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Barchasini yoqish
              </button>
              <button
                type="button"
                @click="disableNonEssentialModules"
                class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Minimal ruxsat
              </button>
            </div>
          </div>

          <div v-else class="space-y-3">
            <p class="text-xs text-gray-500 mb-4">
              Ma'lumot va tibbiy yozuvlarga kirish huquqlarini boshqaring.
            </p>
            <label
              v-for="perm in dataPermissionDefs"
              :key="perm.key"
              class="flex items-start gap-3 rounded-lg border border-gray-100 p-4 transition-colors"
              :class="perm.disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:border-blue-200 cursor-pointer'"
            >
              <input
                v-model="permissionsForm[perm.key]"
                type="checkbox"
                :disabled="perm.disabled"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">{{ perm.labelUz }}</p>
                <p class="text-xs text-gray-500">{{ perm.descUz }}</p>
              </div>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 flex-shrink-0">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            @click="closePermissionsModal"
          >
            Bekor qilish
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="permissionsSaving"
            @click="savePermissions"
          >
            {{ permissionsSaving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { canManageStaff as checkCanManageStaff, isClinicAdmin } from '@/lib/roles'
import { useEmployeesStore } from '@/stores/employees'
import { useDoctorsStore } from '@/stores/doctors'
import { useEmployeePermissionsStore } from '@/stores/employeePermissions'
import {
  MODULE_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  DEFAULT_DATA_PERMISSIONS,
  DATA_PERMISSION_DEFS,
} from '@/stores/doctorPermissions'
import { syncDoctorPermissionsFromEmployee } from '@/lib/staffBridge'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import {
  UZ_PHONE_PLACEHOLDER,
  formatPhoneUzDisplay,
  formatPhoneForStorage,
  isValidUzPhone,
} from '@/lib/phoneUz'
import {
  SPECIALIZATION_OPTIONS,
  CHAIR_OPTIONS,
  WEEK_FORM_DAYS_FIXED,
  isDoctorRole,
  specialtyToRole,
  buildDefaultWorkSchedule,
  schedulesToFormState,
  buildSchedulePayload,
  validateScheduleConflicts,
  formatChairConflictMessage,
  getChairLabel,
  getWorkDaysShort,
  getWorkHoursSummary,
} from '@/lib/staffHelpers'

const authStore = useAuthStore()
const employeesStore = useEmployeesStore()
const doctorsStore = useDoctorsStore()
const employeePermsStore = useEmployeePermissionsStore()
const toast = useToast()

const canManageStaff = computed(() => checkCanManageStaff(authStore))
const isClinicAdminOnly = computed(() => isClinicAdmin(authStore))

const specializationOptions = SPECIALIZATION_OPTIONS
const chairOptions = CHAIR_OPTIONS
const weekDays = WEEK_FORM_DAYS_FIXED
const modulePermissionDefs = MODULE_PERMISSIONS
const dataPermissionDefs = DATA_PERMISSION_DEFS

const showCreatePassword = ref(false)
const showEditPassword = ref(false)

const emptyFormState = () => {
  const { days } = buildDefaultWorkSchedule()
  return {
    full_name: '',
    phone: '',
    email: '',
    password: '',
    specialization: '',
    salary_percentage: '',
    fixed_salary_amount: '',
    chair: '',
    is_active: true,
    work_schedule: { days },
  }
}

const form = ref(emptyFormState())
const isSubmitting = ref(false)
const formError = ref('')

const isEditOpen = ref(false)
const editingEmployeeId = ref(null)
const editForm = ref(emptyFormState())
const editSaving = ref(false)
const editError = ref('')

const isPermissionsOpen = ref(false)
const selectedEmployee = ref(null)
const permissionsSaving = ref(false)
const activePermissionsTab = ref('modules')
const permissionsForm = ref({ ...DEFAULT_DATA_PERMISSIONS })
const moduleForm = ref({ ...DEFAULT_PERMISSIONS })

const totalModulesCount = computed(() =>
  MODULE_PERMISSIONS.filter((m) => !m.alwaysEnabled).length
)
const activeModulesCount = computed(() =>
  MODULE_PERMISSIONS.filter((m) => !m.alwaysEnabled && moduleForm.value[m.key]).length
)

const displayPhone = (phone) => {
  if (!phone) return '—'
  return formatPhoneUzDisplay(phone)
}

const getKpiLabel = (employee) => {
  if (isDoctorRole(employee?.specialization)) {
    const value = employee?.salary_percentage
    if (value == null || value === '') return '—'
    const numeric = Number(value)
    return Number.isFinite(numeric) ? `${numeric}%` : String(value)
  }
  const fixed = employee?.fixed_salary_amount
  if (fixed == null || fixed === '') return '—'
  const amount = Number(fixed)
  return Number.isFinite(amount)
    ? `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`
    : String(fixed)
}

const onPhoneInput = (event, mode) => {
  const formatted = formatPhoneUzDisplay(event.target.value)
  if (mode === 'create') {
    form.value.phone = formatted
  } else {
    editForm.value.phone = formatted
  }
  event.target.value = formatted
}

const ensurePhonePrefix = (mode) => {
  const target = mode === 'create' ? form.value : editForm.value
  if (!target.phone) {
    target.phone = '+998'
  }
}

const onSpecializationChange = (mode) => {
  const target = mode === 'create' ? form.value : editForm.value
  if (isDoctorRole(target.specialization)) {
    target.fixed_salary_amount = ''
  } else {
    target.salary_percentage = ''
    target.chair = ''
    const { days } = buildDefaultWorkSchedule()
    Object.keys(days).forEach((key) => {
      days[key].enabled = false
    })
    target.work_schedule = { days }
  }
}

const validateSalary = (salary, specialization) => {
  if (!isDoctorRole(specialization)) return null
  if (salary === '' || salary == null) return null
  const percentage = Number(salary)
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return "Foiz stavkasi 0 dan 100 gacha bo'lishi kerak."
  }
  return null
}

const validateForm = (data, { requirePassword = true } = {}) => {
  if (!data.full_name?.trim()) {
    throw new Error("Ism-sharifi majburiy.")
  }
  if (!isValidUzPhone(data.phone)) {
    throw new Error(`Telefon raqami noto'g'ri. Format: ${UZ_PHONE_PLACEHOLDER}`)
  }
  if (requirePassword && (!data.password || data.password.length < 6)) {
    throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.')
  }
  if (!requirePassword && data.password && data.password.length < 6) {
    throw new Error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.')
  }
  const salaryError = validateSalary(data.salary_percentage, data.specialization)
  if (salaryError) throw new Error(salaryError)

  if (!isDoctorRole(data.specialization) && data.fixed_salary_amount !== '' && data.fixed_salary_amount != null) {
    const amount = Number(data.fixed_salary_amount)
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Oylik maosh noto'g'ri kiritilgan.")
    }
  }
}

const assertNoChairConflict = (scheduleData, excludeEmployeeId = null, excludeLegacyDoctorId = null) => {
  if (!scheduleData?.length) return

  const conflict = validateScheduleConflicts(
    employeesStore.items,
    scheduleData,
    excludeEmployeeId,
    {
      legacyDoctors: doctorsStore.items,
      excludeLegacyDoctorId,
    }
  )
  if (conflict) {
    throw new Error(formatChairConflictMessage(conflict))
  }
}

const buildEmployeeRecord = (data, clinicId, { includePassword = true } = {}) => {
  const record = {
    full_name: data.full_name.trim(),
    phone: formatPhoneForStorage(data.phone),
    email: data.email?.trim() || null,
    specialty: data.specialization || null,
    role: specialtyToRole(data.specialization),
    is_active: !!data.is_active,
    ...(clinicId != null ? { clinic_id: Number(clinicId) } : {}),
  }

  if (isDoctorRole(data.specialization)) {
    record.salary_percentage = data.salary_percentage !== '' && data.salary_percentage != null
      ? Number(data.salary_percentage)
      : null
    record.fixed_salary_amount = null
  } else {
    record.salary_percentage = null
    record.fixed_salary_amount = data.fixed_salary_amount !== '' && data.fixed_salary_amount != null
      ? Number(data.fixed_salary_amount)
      : null
  }

  if (includePassword && data.password) {
    record.password = data.password
  }

  return record
}

const buildInitialPermissions = () => ({
  module_permissions: { ...DEFAULT_PERMISSIONS },
  ...DEFAULT_DATA_PERMISSIONS,
})

const handleCreate = async () => {
  if (!canManageStaff.value) return
  isSubmitting.value = true
  formError.value = ''

  try {
    validateForm(form.value, { requirePassword: true })
    const clinicId = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
      ? Number(authStore.userClinicId)
      : null

    const employeeData = buildEmployeeRecord(form.value, clinicId, { includePassword: true })
    const doctorRole = isDoctorRole(form.value.specialization)
    const scheduleData = buildSchedulePayload(form.value, null, { isDoctor: doctorRole })
    assertNoChairConflict(scheduleData)
    const permissionsData = buildInitialPermissions()

    await employeesStore.create(employeeData, permissionsData, scheduleData)

    form.value = emptyFormState()
    showCreatePassword.value = false
    toast.success("Xodim qo'shildi")
  } catch (error) {
    formError.value = employeesStore.error || error?.message || "Xodim qo'shishda xatolik yuz berdi"
    toast.error(formError.value)
    await refreshEmployees()
  } finally {
    isSubmitting.value = false
  }
}

const openEditModal = (employee) => {
  if (!canManageStaff.value) return
  const { chair, days } = schedulesToFormState(employee.doctor_schedules)
  editingEmployeeId.value = employee.id
  editForm.value = {
    full_name: employee.full_name || '',
    phone: formatPhoneUzDisplay(employee.phone),
    email: employee.email || '',
    password: '',
    specialization: employee.specialization || '',
    salary_percentage: employee.salary_percentage ?? '',
    fixed_salary_amount: employee.fixed_salary_amount ?? '',
    chair,
    is_active: !!employee.is_active,
    work_schedule: { days },
  }
  editError.value = ''
  showEditPassword.value = false
  isEditOpen.value = true
}

const closeEditModal = () => {
  isEditOpen.value = false
  editingEmployeeId.value = null
  editForm.value = emptyFormState()
}

const handleUpdate = async () => {
  if (!canManageStaff.value || !editingEmployeeId.value) return
  editSaving.value = true
  editError.value = ''

  try {
    validateForm(editForm.value, { requirePassword: false })
    const clinicId = authStore.userClinicId != null && Number.isFinite(Number(authStore.userClinicId))
      ? Number(authStore.userClinicId)
      : null

    const employeeData = buildEmployeeRecord(editForm.value, clinicId, {
      includePassword: !!editForm.value.password,
    })
    if (!editForm.value.password) {
      delete employeeData.password
    }

    const doctorRole = isDoctorRole(editForm.value.specialization)
    const scheduleData = buildSchedulePayload(editForm.value, editingEmployeeId.value, {
      isDoctor: doctorRole,
    })
    const existing = employeesStore.items.find((e) => e.id === editingEmployeeId.value)
    assertNoChairConflict(
      scheduleData,
      editingEmployeeId.value,
      existing?.legacy_doctor_id ?? null
    )
    await employeesStore.update(
      editingEmployeeId.value,
      employeeData,
      scheduleData,
      existing
    )
    toast.success('Xodim ma\'lumotlari yangilandi')
    closeEditModal()
  } catch (error) {
    editError.value = employeesStore.error || error?.message || 'Tahrirlashda xatolik yuz berdi'
    toast.error(editError.value)
  } finally {
    editSaving.value = false
  }
}

const handleDeleteEmployee = async (id) => {
  if (!canManageStaff.value) return
  if (!confirm("Xodimni o'chirishni tasdiqlaysizmi?")) return

  try {
    await employeesStore.remove(id)
    toast.success("Xodim o'chirildi")
  } catch (error) {
    console.error('Failed to delete employee:', error)
    toast.error("Xodimni o'chirishda xatolik yuz berdi")
  }
}

const refreshEmployees = async () => {
  try {
    await Promise.all([
      employeesStore.fetchAll(),
      doctorsStore.fetchAll().catch(() => {}),
    ])
    employeesStore.items.forEach((employee) => {
      employeePermsStore.loadFromEmployee(employee)
    })
  } catch (error) {
    console.error('Failed to refresh employees:', error)
    toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi")
  }
}

const openPermissionsModal = (employee) => {
  if (!canManageStaff.value) return
  selectedEmployee.value = employee
  employeePermsStore.loadFromEmployee(employee)

  permissionsForm.value = { ...employeePermsStore.getDataPermissions(employee.id) }
  moduleForm.value = { ...employeePermsStore.getPermissions(employee.id) }

  activePermissionsTab.value = 'modules'
  isPermissionsOpen.value = true
}

const closePermissionsModal = () => {
  isPermissionsOpen.value = false
  selectedEmployee.value = null
}

const enableAllModules = () => {
  MODULE_PERMISSIONS.forEach((m) => { moduleForm.value[m.key] = true })
}

const disableNonEssentialModules = () => {
  MODULE_PERMISSIONS.forEach((m) => {
    moduleForm.value[m.key] = !!(m.alwaysEnabled ||
      m.key === 'can_edit_profile' ||
      m.key === 'can_view_patients' ||
      m.key === 'can_add_patients')
  })
}

const savePermissions = async () => {
  if (!selectedEmployee.value || !canManageStaff.value) return
  permissionsSaving.value = true

  try {
    const employeeId = selectedEmployee.value.id
    await employeePermsStore.savePermissions(
      employeeId,
      moduleForm.value,
      permissionsForm.value
    )
    await syncDoctorPermissionsFromEmployee(selectedEmployee.value, {
      module_permissions: moduleForm.value,
      data_permissions: permissionsForm.value,
    })
    await refreshEmployees()
    toast.success('Ruxsatlar saqlandi ✓')
    closePermissionsModal()
  } catch (error) {
    console.error('Failed to save permissions:', error)
    toast.error(error?.message || "Ruxsatlarni saqlashda xatolik yuz berdi")
  } finally {
    permissionsSaving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    refreshEmployees(),
    doctorsStore.fetchAll().catch(() => {}),
  ])
})
</script>
