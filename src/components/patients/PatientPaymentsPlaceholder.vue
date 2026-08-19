<template>
  <div class="space-y-6">
    <!-- Summary cards + Actions: mobil — kartalar 2x2, tugmalar pastda; desktop — bir qatorda -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-1 min-w-0">
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.totalPayments') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-primary-600" :title="formatCurrency(totalPayments)">{{ formatCurrency(totalPayments) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.lastPayment') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-violet-600">
            {{ latestPaymentEntry ? getFormattedAmount(latestPaymentEntry) : formatCurrency(0) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t('patientPayments.totalServices') }}</p>
          <p class="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-900" :title="formatCurrency(totalServices)">{{ formatCurrency(totalServices) }}</p>
        </div>
        <div
          v-if="summaryCashbackConfigured"
          class="rounded-xl border border-amber-100 bg-amber-50/70 p-3 sm:p-4 shadow-sm"
        >
          <p class="text-xs font-medium text-amber-700 uppercase tracking-wide">{{ t('patientPayments.cashbackBalance') }}</p>
          <p v-if="summaryCashbackLoading" class="mt-1 sm:mt-2 text-sm text-gray-400">{{ t('patientPayments.cashbackLoading') }}</p>
          <p v-else-if="summaryCashbackError" class="mt-1 sm:mt-2 text-sm text-gray-400">
            {{ t(summaryCashbackErrorCode === 'UNAUTHORIZED' ? 'patientPayments.cashbackUnauthorized' : 'patientPayments.cashbackUnavailable') }}
          </p>
          <p
            v-else
            class="mt-1 sm:mt-2 text-base sm:text-lg font-bold"
            :class="summaryCashbackBalance > 0 ? 'text-amber-700' : 'text-gray-500'"
            :title="formatCurrency(summaryCashbackBalance)"
          >
            {{ formatCurrency(summaryCashbackBalance) }}
            <span v-if="summaryCashbackBalance <= 0" class="block text-xs font-medium text-gray-400 mt-0.5">
              {{ t('patientPayments.cashbackNone') }}
            </span>
          </p>
        </div>
      </div>

      <!-- Harakatlar: asosiy 2 tugma + «Boshqa» menyusi -->
      <div v-if="canManagePayments" class="flex flex-col gap-2 shrink-0 md:ml-4 md:items-end">
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-600 px-4 py-3 sm:py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all touch-manipulation min-h-[44px]"
            @click="openDiscountModal"
          >
            <TagIcon class="w-5 h-5 shrink-0" />
            {{ t('patientPayments.cashbackWithdraw') }}
          </button>
          <button
            v-if="hasIncompleteVisits"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 sm:py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 touch-manipulation min-h-[44px]"
            :disabled="completingAll"
            @click="completeAllVisits"
          >
            <CheckCircleIcon v-if="!completingAll" class="w-5 h-5 shrink-0" />
            <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            {{ completingAll ? t('patientPayments.completing') : t('patientPayments.yakunlash') }}
          </button>
        </div>

        <div ref="moreMenuRef" class="relative w-full sm:w-auto">
          <button
            type="button"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px]"
            :class="moreMenuOpen ? 'ring-2 ring-primary-200 border-primary-300' : ''"
            @click="moreMenuOpen = !moreMenuOpen"
          >
            <EllipsisHorizontalIcon class="w-5 h-5 text-gray-500" />
            {{ t('patientPayments.moreActions') }}
            <ChevronDownIcon class="w-4 h-4 text-gray-400 transition-transform" :class="moreMenuOpen ? 'rotate-180' : ''" />
          </button>

          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="moreMenuOpen"
              class="absolute right-0 left-0 sm:left-auto sm:min-w-[220px] top-full mt-1.5 z-30 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5"
            >
              <p class="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {{ t('patientPayments.printSection') }}
              </p>
              <button
                v-if="canPrintDocuments"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="runMoreAction(handlePrintA4)"
              >
                <DocumentTextIcon class="w-5 h-5 text-gray-500 shrink-0" />
                {{ t('patientPayments.printA4') }}
              </button>
              <button
                v-if="canPrintDocuments"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="runMoreAction(handlePrintReceipt)"
              >
                <PrinterIcon class="w-5 h-5 text-amber-500 shrink-0" />
                {{ t('patientPayments.printReceipt') }}
              </button>
              <button
                v-if="lastCompletionSummary"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-800 transition-colors text-left"
                @click="runMoreAction(printLastCompletion)"
              >
                <ClipboardDocumentCheckIcon class="w-5 h-5 text-sky-500 shrink-0" />
                {{ t('patientPayments.printLastSummary') }}
              </button>
              <p v-if="!canPrintDocuments && !lastCompletionSummary" class="px-4 py-2 text-xs text-gray-400">
                {{ t('patientPayments.printUnavailable') }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Yagona ro'yxat: bajarilgan xizmatlar -->
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-900">{{ t('patientPayments.services') }}</h3>
      <button
        v-if="canManagePayments && latestPaymentEntry"
        type="button"
        class="text-xs font-medium text-primary-600 hover:text-primary-700"
        @click="openEditModal(latestPaymentEntry)"
      >
        Oxirgi to'lovni tahrirlash
      </button>
    </div>

    <div class="md:hidden space-y-3">
      <div
        v-if="servicesLoading"
        class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500"
      >
        {{ t('patientPayments.loading') }}
      </div>
      <div
        v-else-if="services.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500"
      >
        {{ t('patientPayments.noServices') }}
      </div>
      <div
        v-for="service in printServices"
        :key="`mobile-service-${service.id}`"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.visitId') }}</p>
            <p class="text-sm font-semibold text-slate-900">#{{ service.visit_id }}</p>
          </div>
          <div v-if="canManagePayments">
            <button
              type="button"
              class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
              :disabled="serviceDeleting === service.id"
              :title="t('patientPayments.delete')"
              @click="confirmDeleteService(service)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="mt-2 text-sm font-medium text-slate-800">{{ service.service_name }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.tooth') }}</p>
            <p class="text-slate-700">{{ service.tooth_id ? `#${service.tooth_id}` : '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.price') }}</p>
            <p class="font-semibold text-slate-900">{{ formatCurrency(service.price) }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.doctor') }}</p>
            <p class="text-slate-700">{{ service.performed_by || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">{{ t('patientPayments.date') }}</p>
            <p class="text-slate-700">{{ formatDate(service.created_at) }}</p>
          </div>
        </div>
      </div>
      <div
        v-if="!servicesLoading && printServices.length > 0"
        class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2"
      >
        <div class="flex justify-between"><span class="text-slate-600">Jami xizmatlar</span><span class="font-semibold">{{ formatCurrency(totalServices) }}</span></div>
        <div v-if="totalDiscountAmount > 0" class="flex justify-between text-violet-700"><span>Chegirma</span><span class="font-semibold">-{{ formatCurrency(totalDiscountAmount) }}</span></div>
        <div v-if="totalCashbackUsed > 0" class="flex justify-between text-amber-800"><span>{{ t('patientPayments.cashback') }}</span><span class="font-semibold">-{{ formatCurrency(totalCashbackUsed) }}</span></div>
        <div class="flex justify-between"><span class="text-slate-600">To'langan</span><span class="font-semibold text-emerald-700">{{ formatCurrency(totalPaidNet) }}</span></div>
      </div>
    </div>

    <div class="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('patientPayments.visitId') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.services') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.tooth') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.price') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.doctor') }}</th>
            <th class="px-4 py-3">{{ t('patientPayments.date') }}</th>
            <th v-if="canManagePayments" class="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="servicesLoading">
            <td class="px-4 py-4 text-slate-500" :colspan="canManagePayments ? 7 : 6">{{ t('patientPayments.loading') }}</td>
          </tr>
          <tr v-else-if="services.length === 0">
            <td class="px-4 py-4 text-slate-500" :colspan="canManagePayments ? 7 : 6">{{ t('patientPayments.noServices') }}</td>
          </tr>
          <tr v-for="service in printServices" :key="service.id" class="bg-white">
            <td class="px-4 py-3 text-slate-700">#{{ service.visit_id }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.service_name }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.tooth_id ? `#${service.tooth_id}` : '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatCurrency(service.price) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ service.performed_by || '-' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ formatDate(service.created_at) }}</td>
            <td v-if="canManagePayments" class="px-4 py-3">
              <button
                type="button"
                class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                :disabled="serviceDeleting === service.id"
                :title="t('patientPayments.delete')"
                @click="confirmDeleteService(service)"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="printServices.length > 0" class="bg-slate-50 text-sm font-semibold text-slate-800">
          <tr class="border-t-2 border-slate-200">
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 3">Jami xizmatlar</td>
            <td class="px-4 py-2">{{ formatCurrency(totalServices) }}</td>
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 2"></td>
          </tr>
          <tr v-if="totalDiscountAmount > 0">
            <td class="px-4 py-2 text-violet-700" :colspan="canManagePayments ? 3 : 3">Chegirma</td>
            <td class="px-4 py-2 text-violet-700">-{{ formatCurrency(totalDiscountAmount) }}</td>
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 2"></td>
          </tr>
          <tr v-if="totalCashbackUsed > 0">
            <td class="px-4 py-2 text-amber-800" :colspan="canManagePayments ? 3 : 3">{{ t('patientPayments.cashback') }}</td>
            <td class="px-4 py-2 text-amber-800">-{{ formatCurrency(totalCashbackUsed) }}</td>
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 2"></td>
          </tr>
          <tr>
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 3">To'langan</td>
            <td class="px-4 py-2 text-emerald-700">{{ formatCurrency(totalPaidNet) }}</td>
            <td class="px-4 py-2" :colspan="canManagePayments ? 3 : 2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <VisitExpensePanel
      v-if="showVisitExpenses && expenseVisitId"
      class="mt-2"
      :visit-id="expenseVisitId"
      :doctor-id="expenseDoctorId"
      :patient-id="patientId"
    />

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isDiscountMode ? t('patientPayments.cashbackWithdraw') : t('patientPayments.editPayment') }}
              </h3>
              <button class="text-gray-400 hover:text-gray-600" @click="closeModal">×</button>
            </div>
            <div class="px-6 py-4 space-y-4">
              <div v-if="isDiscountMode" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.visitId') }}</label>
                  <select v-model="form.visit_id" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">{{ t('patientPayments.visitIdPlaceholder') }}</option>
                    <option v-for="visit in visits" :key="visit.id" :value="String(visit.id)">
                      #{{ visit.id }}{{ visit.visit_date ? ` · ${formatDate(visit.visit_date || visit.created_at)}` : '' }}
                    </option>
                  </select>
                </div>
                <div class="rounded-lg border border-amber-100 bg-amber-50/70 p-4 space-y-3">
                  <p v-if="cashbackLoading" class="text-sm text-gray-500">{{ t('patientPayments.cashbackLoading') }}</p>
                  <p v-else-if="cashbackError || !showCashback" class="text-sm text-gray-500">{{ t('patientPayments.cashbackUnavailable') }}</p>
                  <template v-else>
                    <div class="flex items-center space-x-2">
                      <input
                        id="patient-use-cashback"
                        v-model="useCashback"
                        type="checkbox"
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        :disabled="cashbackCapAmount <= 0 || cashbackBalance <= 0"
                      />
                      <label for="patient-use-cashback" class="text-sm font-medium text-gray-800">
                        {{ t('patientPayments.cashbackWithdraw') }}
                      </label>
                    </div>
                    <p class="text-xs text-gray-500">{{ t('patientPayments.cashbackWithdrawHint') }}</p>
                    <div class="text-sm space-y-1.5">
                      <div class="flex justify-between gap-3">
                        <span class="text-gray-600">{{ t('patientPayments.cashbackLastPayment') }}</span>
                        <span class="font-semibold text-gray-900">{{ formatCurrency(lastPaymentAmount) }}</span>
                      </div>
                      <div class="flex justify-between gap-3">
                        <span class="text-gray-600">{{ t('patientPayments.cashback') }}</span>
                        <span class="font-semibold text-amber-800">{{ formatCurrency(displayedCashback) }}</span>
                      </div>
                      <div class="flex justify-between gap-3 border-t border-amber-200/80 pt-1.5">
                        <span class="text-gray-700 font-medium">{{ t('patientPayments.cashbackAfterLast') }}</span>
                        <span class="font-bold text-emerald-700">{{ formatCurrency(lastPaymentRemaining) }}</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div v-else class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.visitId') }}</label>
                  <input v-model="form.visit_id" type="number" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.visitIdPlaceholder')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.paidAt') }}</label>
                  <input v-model="form.paid_at" type="datetime-local" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.type') }}</label>
                  <select v-model="form.payment_type" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="payment">{{ t('patientPayments.typePayment') }}</option>
                    <option value="refund">{{ t('patientPayments.typeRefund') }}</option>
                    <option value="adjustment">{{ t('patientPayments.typeAdjustment') }}</option>
                    <option value="discount">{{ t('patientPayments.typeDiscount') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.method') }}</label>
                  <select v-model="form.method" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="cash">{{ t('patientPayments.methodCash') }}</option>
                    <option value="card">{{ t('patientPayments.methodCard') }}</option>
                    <option value="transfer">{{ t('patientPayments.methodTransfer') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.amount') }}</label>
                  <input
                    v-model="form.amount"
                    type="number"
                    :min="0"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    :placeholder="t('patientPayments.amountPlaceholder')"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('patientPayments.note') }}</label>
                  <input v-model="form.note" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" :placeholder="t('patientPayments.notePlaceholder')" />
                </div>
              </div>
              <p v-if="!isDiscountMode && visitPreviewLoading" class="text-sm text-gray-500">{{ t('patientPayments.loadingVisit') }}</p>
              <div v-if="!isDiscountMode && visitPreview" class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                <p class="font-medium text-gray-700">{{ t('patientPayments.visitSummary') }}</p>
                <div class="mt-1 flex flex-wrap gap-4">
                  <span>{{ t('patientPayments.visitPrice') }}: {{ formatCurrency(visitPreview.price || 0) }}</span>
                  <span>{{ t('patientPayments.visitPaid') }}: {{ formatCurrency(visitPreview.paid_amount || 0) }}</span>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" @click="closeModal">
                {{ t('patientPayments.cancel') }}
              </button>
              <button
                class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="savingPayment || (isDiscountMode && displayedCashback <= 0)"
                @click="savePayment"
              >
                {{ t('patientPayments.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  TrashIcon,
  TagIcon,
  PrinterIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { canManagePatientBilling, isSolo } from '@/lib/roles'
import { useClinicStore } from '@/stores/clinic'
import { createPayment, updatePayment, deletePayment, getPaymentsByPatientId } from '@/api/paymentsApi'
import { getVisitServicesByPatientId, getVisitServicesByVisitId, deleteVisitServiceById } from '@/api/visitServicesApi'
import { getVisitById, getVisitsByPatientId } from '@/api/visitsApi'
import { listClinicInventoryItems } from '@/lib/inventoryBridge'
import { updatePatient } from '@/api/patientsApi'
import { completeAllPatientVisits } from '@/lib/completePatientVisits'
import { openPatientCompletionPreview } from '@/lib/patientCompletionPrint'
import {
  buildPaymentPrintPayload,
  openA4Print,
  openReceiptPrint,
} from '@/lib/patientPaymentPrint'
import { useToast } from '@/composables/useToast'
import { usePaymentCashback } from '@/composables/usePaymentCashback'
import { useCashbackBalance } from '@/composables/useCashbackBalance'
import { sendPatientCompletionSummary } from '@/api/telegramApi'
import VisitExpensePanel from '@/components/patients/VisitExpensePanel.vue'
import { syncVisitAfterPayment } from '@/services/paymentService'
import { applyPaymentCashback } from '@/services/cashbackService'
import {
  DISCOUNT_NOTE_PREFIX,
  DISCOUNT_PERCENT_PREFIX,
  cashCollected,
  cashbackUsedTotal,
  discountTotal,
  isDiscountEntry,
  lastPaymentAfterCashback,
  parseCashbackUsed,
  parsePrice,
  paymentDisplayAmount,
  servicesTotalDeduped,
  withCashbackUsedNote,
} from '@/lib/paymentTotals'

const authStore = useAuthStore()
const clinicStore = useClinicStore()
const canManagePayments = computed(() => canManagePatientBilling(authStore))

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true
  },
  patientName: {
    type: String,
    default: ''
  },
  patientMedId: {
    type: [String, Number],
    default: ''
  },
  patientPhone: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update-status', 'cashback-updated'])

const payments = ref([])
const loading = ref(false)
const services = ref([])
const servicesLoading = ref(false)
const serviceDeleting = ref(null)
const visits = ref([])
const completingAll = ref(false)
const inventoryItems = ref([])
const { t } = useI18n()
const toast = useToast()
const showPaymentModal = ref(false)
const isEditing = ref(false)
const isDiscountMode = ref(false)
const visitPreview = ref(null)
const visitPreviewLoading = ref(false)
const lastCompletionSummary = ref(null)
const moreMenuOpen = ref(false)
const moreMenuRef = ref(null)
const savingPayment = ref(false)

const canPrintDocuments = computed(() => printServices.value.length > 0 || totalPaidNet.value > 0)

const closeMoreMenu = () => { moreMenuOpen.value = false }

const runMoreAction = (fn) => {
  closeMoreMenu()
  fn()
}

const onDocumentClick = (event) => {
  if (!moreMenuOpen.value) return
  const el = moreMenuRef.value
  if (el && !el.contains(event.target)) closeMoreMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  loadAll()
})

const form = ref({
  id: null,
  visit_id: '',
  amount: '',
  discount_percent: '',
  payment_type: 'payment',
  method: 'cash',
  note: '',
  paid_at: ''
})

const cashbackEnabled = computed(() =>
  showPaymentModal.value
  && !isEditing.value
  && isDiscountMode.value
)

/** Oxirgi haqiqiy to‘lov (chegirma/qaytarim emas), tanlangan tashrif bo‘yicha. */
const lastRealPayment = computed(() => {
  const visitId = Number(form.value.visit_id)
  const scoped = Number.isFinite(visitId) && visitId > 0
    ? payments.value.filter((entry) => Number(entry.visit_id) === visitId)
    : payments.value
  return scoped.find((entry) => entry.payment_type === 'payment' && !isDiscountEntry(entry)) || null
})

const lastPaymentAlreadyUsed = computed(() => parseCashbackUsed(lastRealPayment.value))

const lastPaymentAmount = computed(() => {
  const entry = lastRealPayment.value
  if (entry) return Math.max(0, Number(entry.amount) || 0)
  const visitId = Number(form.value.visit_id)
  const fromServices = Number.isFinite(visitId) && visitId > 0
    ? servicesTotalDeduped(
        services.value.filter((item) => Number(item.visit_id) === visitId),
      )
    : 0
  if (fromServices > 0) return fromServices
  return Math.max(0, Number(visitPreview.value?.price) || 0)
})

const cashbackCapAmount = computed(() =>
  Math.max(0, lastPaymentAmount.value - lastPaymentAlreadyUsed.value),
)

const {
  balance: cashbackBalance,
  balanceLoading: cashbackLoading,
  balanceError: cashbackError,
  useCashback,
  cashbackUsed,
  showCashback,
  reset: resetCashbackForm,
} = usePaymentCashback({
  patientId: () => props.patientId,
  paymentAmount: () => cashbackCapAmount.value,
  enabled: cashbackEnabled,
  autoFillMax: () => lastPaymentAlreadyUsed.value <= 0,
})

const displayedCashback = computed(() =>
  lastPaymentAfterCashback({
    amount: lastPaymentAmount.value,
    alreadyUsed: lastPaymentAlreadyUsed.value,
    additionalUsed: useCashback.value ? cashbackUsed.value : 0,
  }).cashback,
)

const lastPaymentRemaining = computed(() =>
  lastPaymentAfterCashback({
    amount: lastPaymentAmount.value,
    alreadyUsed: lastPaymentAlreadyUsed.value,
    additionalUsed: useCashback.value ? cashbackUsed.value : 0,
  }).remaining,
)

const {
  balance: summaryCashbackBalance,
  loading: summaryCashbackLoading,
  error: summaryCashbackError,
  errorCode: summaryCashbackErrorCode,
  configured: summaryCashbackConfigured,
  load: loadSummaryCashback,
} = useCashbackBalance(() => props.patientId)

const showVisitExpenses = computed(() => isSolo(authStore) || canManagePayments.value)
const expenseVisitId = computed(() => {
  const fromForm = Number(form.value?.visit_id)
  if (Number.isFinite(fromForm) && fromForm > 0) return fromForm
  const fromPreview = Number(visitPreview.value?.id)
  if (Number.isFinite(fromPreview) && fromPreview > 0) return fromPreview
  const latestVisit = (visits.value || [])[0]
  const fromLatest = Number(latestVisit?.id)
  return Number.isFinite(fromLatest) && fromLatest > 0 ? fromLatest : null
})
const expenseDoctorId = computed(() => {
  const fromVisit = Number(visitPreview.value?.doctor_id || visits.value?.[0]?.doctor_id)
  if (Number.isFinite(fromVisit) && fromVisit > 0) return fromVisit
  const fromUser = Number(authStore.user?.id)
  return Number.isFinite(fromUser) && fromUser > 0 ? fromUser : null
})

const totalPayments = computed(() =>
  payments.value.reduce((sum, entry) => {
    if (entry.payment_type !== 'payment' || isDiscountEntry(entry)) return sum
    return sum + Math.max(0, (Number(entry.amount) || 0) - parseCashbackUsed(entry))
  }, 0)
)

const latestPaymentEntry = computed(() => payments.value[0] || null)

/** Chek/A4 va joriy hisob: faqat ochiq yoki qarzdor tashriflar (yakunlangan eski tashriflar emas) */
const isVisitBillable = (visit) => {
  if (!visit) return false
  if (visit.status === 'cancelled' || visit.status === 'no_show') return false
  const debt = Number(visit.debt_amount) || 0
  if (visit.status === 'completed_paid' && debt <= 0) return false
  if (visit.status === 'completed_debt' || debt > 0) return true
  return ['in_progress', 'pending', 'arrived'].includes(visit.status)
}

const billingVisitIds = computed(() => {
  const ids = new Set()
  for (const v of visits.value) {
    const vid = Number(v.id)
    if (Number.isFinite(vid) && isVisitBillable(v)) ids.add(vid)
  }
  if (ids.size > 0) return ids

  const visitIdsWithServices = [
    ...new Set(services.value.map((s) => Number(s.visit_id)).filter(Number.isFinite)),
  ]
  if (visitIdsWithServices.length === 0) return ids

  const latestVisitId = visitIdsWithServices.reduce(
    (max, id) => (id > max ? id : max),
    visitIdsWithServices[0]
  )
  ids.add(latestVisitId)
  return ids
})

const paymentsForBilling = computed(() =>
  payments.value.filter((entry) => {
    const vid = Number(entry.visit_id)
    return Number.isFinite(vid) && billingVisitIds.value.has(vid)
  })
)

const totalDiscountAmount = computed(() => discountTotal(paymentsForBilling.value))
const totalCashbackUsed = computed(() => cashbackUsedTotal(paymentsForBilling.value))
const totalPaidNet = computed(() => cashCollected(paymentsForBilling.value))

const dedupeVisitToothServices = (items) => {
  const seen = new Set()
  const list = []
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )
  for (const s of sorted) {
    const vid = s.visit_id
    if (vid == null) continue
    const tid = s.tooth_id
    const key = tid != null ? `v${vid}t${tid}` : `v${vid}s${s.id}`
    if (seen.has(key)) continue
    seen.add(key)
    list.push(s)
  }
  return list
}

/** Joriy hisobdagi xizmatlar (faqat billing tashriflari, har tish bo'yicha oxirgi) */
const printServices = computed(() => {
  const scoped = services.value.filter((s) =>
    billingVisitIds.value.has(Number(s.visit_id))
  )
  return dedupeVisitToothServices(scoped)
})

const remainingDebt = computed(() =>
  Math.max(0, totalServices.value - totalDiscountAmount.value - totalPaidNet.value - totalCashbackUsed.value)
)

const primaryDoctorName = computed(() => {
  const scopedVisits = visits.value.filter((v) => billingVisitIds.value.has(Number(v.id)))
  const fromService = printServices.value.find((s) => s.performed_by)?.performed_by
  if (fromService) return fromService
  const fromVisit = scopedVisits.find((v) => v.doctor_name)?.doctor_name
  if (fromVisit) return fromVisit
  const fromAny = visits.value.find((v) => v.doctor_name)?.doctor_name
  return fromAny || '-'
})

const printDocumentNumber = computed(() => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const pid = String(props.patientId || '').slice(-4).padStart(4, '0')
  return `CHK-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pid}`
})

const loadInventoryItems = async () => {
  try {
    inventoryItems.value = await listClinicInventoryItems(authStore)
  } catch (error) {
    console.error('Failed to load inventory items for billing:', error)
    inventoryItems.value = []
  }
}

// Yakunlanmagan tashriflar bor-yo'qligini tekshirish
const hasIncompleteVisits = computed(() => {
  // Agar xizmatlar mavjud bo'lsa va to'lovlar bo'lmasa, yakunlash tugmasi ko'rinishi kerak
  if (totalServices.value > 0 && payments.value.length === 0) return true

  // Yoki yakunlanmagan tashriflar bo'lsa
  return visits.value.some(v =>
    v.status === 'in_progress' ||
    v.status === 'completed_debt' ||
    (v.status === 'completed_paid' && (Number(v.debt_amount) || 0) > 0)
  )
})

// Joriy billing tashriflari: har tish uchun faqat oxirgi xizmat narxi
const totalServices = computed(() =>
  printServices.value.reduce((sum, e) => {
    if (e.tooth_id == null || e.visit_id == null) return sum
    return sum + parsePrice(e.price)
  }, 0)
)

const formatCurrency = (amount) => {
  if (!amount) return '0 so\'m'
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('UZS', t('common.currencySuffix'))
}

const getFormattedAmount = (entry) => formatCurrency(paymentDisplayAmount(entry))

const getTypeLabel = (type) => {
  if (type === 'refund') return t('patientPayments.typeRefund')
  if (type === 'adjustment') return t('patientPayments.typeAdjustment')
  return t('patientPayments.typePayment')
}

const normalizeNoteForPrint = (note) => {
  if (!note) return '-'
  return String(note)
    .replace(/^\s*\[DISCOUNT\]\s*/i, '')
    .replace(/^\s*\[DISCOUNT_PERCENT:[^\]]+\]\s*/i, '')
    .replace(/^\s*\[CATEGORY:[^\]]+\]\s*/i, '')
    .trim() || '-'
}

const getPaymentKindLabel = (entry) => {
  if (!entry) return '-'
  if (isDiscountEntry(entry)) return 'Chegirma'
  if (entry.payment_type === 'payment') return 'To\'lov'
  if (entry.payment_type === 'refund') return 'Refund'
  if (entry.payment_type === 'adjustment') return Number(entry.amount) < 0 ? 'Xarajat' : 'Qo\'shimcha'
  return entry.payment_type || '-'
}

const buildPrintPaymentDetails = (summary) => {
  const visitIds = new Set([
    ...(summary?.services || []).map(item => Number(item.visitId)).filter(Number.isFinite),
    ...(summary?.discounts || []).map(item => Number(item.visitId)).filter(Number.isFinite)
  ])

  const scoped = payments.value.filter(entry => visitIds.size === 0 || visitIds.has(Number(entry.visit_id)))

  return scoped.map(entry => ({
    method: entry.method || '-',
    kind: getPaymentKindLabel(entry),
    amount: Math.abs(Number(entry.amount) || 0),
    note: normalizeNoteForPrint(entry.note)
  }))
}

const getTypeDisplayLabel = (entry) => {
  if (isDiscountEntry(entry)) return t('patientPayments.typeDiscount')
  if (entry.payment_type === 'adjustment' && Number(entry.amount) < 0) return t('patientPayments.typeDiscount')
  return getTypeLabel(entry.payment_type)
}

const getTypeClass = (entry) => {
  if (isDiscountEntry(entry)) return 'text-violet-600 font-medium'
  const type = entry?.payment_type
  if (type === 'refund') return 'text-rose-600 font-medium'
  if (type === 'adjustment') {
    return (Number(entry?.amount) || 0) < 0 ? 'text-violet-600 font-medium' : 'text-amber-600 font-medium'
  }
  return 'text-emerald-600 font-medium'
}

const getDiscountPercent = (entry) => {
  if (!entry?.note) return ''
  const match = String(entry.note).match(/\[DISCOUNT_PERCENT:([\d.]+)\]/i)
  return match?.[1] || ''
}

const getDisplayNote = (entry) => {
  if (!entry?.note) return '-'
  return normalizeNoteForPrint(entry.note)
}

const getVisitServicesTotal = (visitId) => {
  const targetVisitId = Number(visitId)
  if (!Number.isFinite(targetVisitId)) return 0
  return servicesTotalDeduped(
    services.value.filter((item) => Number(item.visit_id) === targetVisitId),
  )
}

const fetchVisitServicesTotal = async (visitId) => {
  const targetVisitId = Number(visitId)
  if (!Number.isFinite(targetVisitId)) return 0
  const rows = await getVisitServicesByVisitId(targetVisitId)
  return servicesTotalDeduped(rows)
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const formatDatetime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

const formatTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

const loadPayments = async () => {
  loading.value = true
  try {
    payments.value = await getPaymentsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load payments:', error)
    payments.value = []
    toast.error(t('patientPayments.errorLoad') || 'To\'lovlarni yuklashda xatolik')
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  servicesLoading.value = true
  try {
    services.value = await getVisitServicesByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visit services:', error)
    services.value = []
  } finally {
    servicesLoading.value = false
  }
}

const loadVisits = async () => {
  try {
    visits.value = await getVisitsByPatientId(props.patientId)
  } catch (error) {
    console.error('Failed to load visits:', error)
    visits.value = []
  }
}

const loadAll = async () => {
  await Promise.all([loadPayments(), loadServices(), loadVisits(), loadInventoryItems()])
}

const completeAllVisits = async () => {
  if (!window.confirm(t('patientPayments.confirmCompleteAll') || 'Barcha tashriflarni yakunlashni tasdiqlaysizmi?')) return

  completingAll.value = true
  try {
    const doctorId = authStore.user?.id || null
    const result = await completeAllPatientVisits(props.patientId, doctorId)

    if (result.success) {
      toast.success(t('patientPayments.toastAllCompleted') || `Muvaffaqiyatli yakunlandi: ${result.completed} ta tashrif`)
      lastCompletionSummary.value = result.summary || null

      if (result.summary) {
        const tg = await sendPatientCompletionSummary({
          patientId: props.patientId,
          doctorName: result.summary.doctorName,
          visitDate: result.summary.visitDate,
          services: result.summary.services,
          discounts: result.summary.discounts,
          totalBeforeDiscount: result.summary.totalBeforeDiscount,
          totalDiscount: result.summary.totalDiscount,
          totalAfterDiscount: result.summary.totalAfterDiscount,
          paid: result.summary.paid,
          remaining: result.summary.remaining
        })
        if (!tg.ok) {
          console.warn('Telegram completion summary was not sent:', tg.error)
        }
      }

      await loadAll() // Ma'lumotlarni yangilash
    } else {
      toast.error(result.error || t('patientPayments.errorCompleteAll'))
    }
  } catch (error) {
    console.error('Failed to complete all visits:', error)
    toast.error(t('patientPayments.errorCompleteAll'))
  } finally {
    completingAll.value = false
  }
}

const printLastCompletion = () => {
  if (!lastCompletionSummary.value) {
    toast.error('Pechat uchun yakuniy hisobot topilmadi')
    return
  }

  const summary = lastCompletionSummary.value
  const servicesSum = (summary.services || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  const printResult = openPatientCompletionPreview({
    clinicName: clinicStore.displayName || 'SHIFOCRM',
    clinicLogo: clinicStore.logoUrl || '',
    patientName: props.patientName || `Bemor #${props.patientId}`,
    patientMedId: props.patientMedId || '-',
    doctorName: summary.doctorName,
    responsibleName: authStore.user?.full_name || authStore.user?.name || 'Mas\'ul xodim',
    visitDate: summary.visitDate,
    services: (summary.services || []).map(item => ({
      ...item,
      quantity: 1,
      unitPrice: Number(item.price) || 0,
      totalPrice: Number(item.price) || 0,
      performedBy: summary.doctorName || ''
    })),
    discounts: (summary.discounts || []).map(item => ({
      ...item,
      percent: parseDiscountPercentFromNote(item.note),
      note: normalizeNoteForPrint(item.note)
    })),
    paymentDetails: buildPrintPaymentDetails(summary),
    totalBeforeDiscount: summary.totalBeforeDiscount,
    totalDiscount: summary.totalDiscount,
    totalAfterDiscount: summary.totalAfterDiscount,
    paid: summary.paid,
    remaining: summary.remaining,
    extraCharges: Math.max(0, (Number(summary.totalBeforeDiscount) || 0) - servicesSum),
    template: 'full'
  })

  if (!printResult.ok) {
    toast.error('Pechat oynasi bloklandi. Brauzerda pop-upga ruxsat bering.')
  }
}

const buildPrintData = () =>
  buildPaymentPrintPayload({
    clinicStore,
    patientId: props.patientId,
    patientName: props.patientName,
    patientMedId: props.patientMedId,
    patientPhone: props.patientPhone,
    doctorName: primaryDoctorName.value,
    printServices: printServices.value,
    totalServices: totalServices.value,
    totalDiscountAmount: totalDiscountAmount.value,
    totalCashbackUsed: totalCashbackUsed.value,
    totalPaidNet: totalPaidNet.value,
    remainingDebt: remainingDebt.value,
    documentNumber: printDocumentNumber.value,
  })

const handlePrintA4 = () => {
  try {
    const result = openA4Print(buildPrintData())
    if (!result.ok) {
      toast.error('Chop etish oynasi bloklandi. Brauzerda pop-up ruxsatini yoqing.')
    }
  } catch (error) {
    console.error('A4 print failed:', error)
    toast.error('A4 chop etishda xatolik yuz berdi')
  }
}

const handlePrintReceipt = () => {
  try {
    const result = openReceiptPrint(buildPrintData())
    if (!result.ok) {
      toast.error('Chop etish oynasi bloklandi. Brauzerda pop-up ruxsatini yoqing.')
    }
  } catch (error) {
    console.error('Receipt print failed:', error)
    toast.error('Chek chop etishda xatolik yuz berdi')
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

watch(
  () => [cashbackEnabled.value, lastPaymentAlreadyUsed.value],
  ([enabled, already]) => {
    if (enabled && already > 0 && !useCashback.value) {
      useCashback.value = true
    }
  },
)

const openDiscountModal = () => {
  isEditing.value = false
  isDiscountMode.value = true

  const lastPay = payments.value.find(
    (entry) => entry.payment_type === 'payment' && !isDiscountEntry(entry),
  )
  let autoVisitId = lastPay?.visit_id ? String(lastPay.visit_id) : ''
  if (!autoVisitId && visits.value && visits.value.length > 0) {
    const activeVisit = [...visits.value].sort((a, b) => b.id - a.id)[0]
    autoVisitId = String(activeVisit.id)
  } else if (!autoVisitId && services.value && services.value.length > 0) {
    const activeService = [...services.value].sort((a, b) => b.visit_id - a.visit_id)[0]
    autoVisitId = String(activeService.visit_id)
  }

  form.value = {
    id: null,
    visit_id: autoVisitId,
    amount: '',
    discount_percent: '',
    payment_type: 'payment',
    method: 'cash',
    note: '',
    paid_at: new Date().toISOString().slice(0, 16)
  }
  visitPreview.value = null
  resetCashbackForm()
  showPaymentModal.value = true
}

const stripDiscountNotePrefix = (note) => {
  if (!note) return ''
  return String(note)
    .replace(/^\s*\[DISCOUNT\]\s*/i, '')
    .replace(/^\s*\[DISCOUNT_PERCENT:[^\]]+\]\s*/i, '')
    .trim()
}

const parseDiscountPercentFromNote = (note) => {
  if (!note) return ''
  const match = String(note).match(/\[DISCOUNT_PERCENT:([\d.]+)\]/i)
  return match?.[1] || ''
}

const openEditModal = (payment) => {
  isEditing.value = true
  isDiscountMode.value = false
  const amt = Number(payment.amount) || 0
  const isDiscount = isDiscountEntry(payment)
  form.value = {
    id: payment.id,
    visit_id: payment.visit_id ? String(payment.visit_id) : '',
    amount: isDiscount ? Math.abs(amt) : (payment.amount ?? ''),
    discount_percent: isDiscount ? parseDiscountPercentFromNote(payment.note) : '',
    payment_type: isDiscount ? 'discount' : (payment.payment_type || 'payment'),
    method: payment.method || 'cash',
    note: isDiscount ? stripDiscountNotePrefix(payment.note) : (payment.note || ''),
    paid_at: payment.paid_at ? payment.paid_at.slice(0, 16) : ''
  }
  showPaymentModal.value = true
}

const closeModal = () => {
  showPaymentModal.value = false
  isDiscountMode.value = false
  visitPreview.value = null
  resetCashbackForm()
}

const savePayment = async () => {
  const visitId = Number(form.value.visit_id)
  if (!Number.isFinite(visitId)) {
    toast.error(t('patientPayments.errorVisitRequired'))
    return
  }

  const paidAt = form.value.paid_at ? new Date(form.value.paid_at).toISOString() : null
  const patientId = Number(props.patientId)

  if (isDiscountMode.value && !isEditing.value) {
    const lastPay = lastRealPayment.value
    const already = parseCashbackUsed(lastPay)
    const additional = useCashback.value ? cashbackUsed.value : 0
    if (already <= 0 && additional <= 0) {
      toast.error(t('patientPayments.errorCashbackRequired'))
      return
    }
    if (already > 0 && additional <= 0) {
      toast.success(t('patientPayments.cashbackAlreadyApplied'))
      closeModal()
      return
    }

    savingPayment.value = true

    try {
      if (lastPay?.id) {
        const spendResult = await applyPaymentCashback({
          patientId,
          paymentId: lastPay.id,
          totalAmount: additional,
          cashbackUsed: additional,
        })
        if (!spendResult.ok && !spendResult.duplicate) {
          toast.warning(t('patientPayments.cashbackWarning'))
          return
        }
        const applied = Math.min(
          lastPaymentAmount.value,
          spendResult.duplicate ? Math.max(already, additional) : already + additional,
        )
        const note = withCashbackUsedNote(lastPay.note, applied)
        try {
          await updatePayment(lastPay.id, {
            cashback_used: applied,
            note,
          })
        } catch (updateError) {
          console.warn('cashback_used column update failed, note only:', updateError)
          await updatePayment(lastPay.id, { note })
        }
      } else {
        const created = await createPayment({
          visit_id: visitId,
          patient_id: patientId,
          amount: additional,
          payment_type: 'payment',
          method: 'cash',
          note: t('patientPayments.cashbackWithdrawNote'),
          paid_at: paidAt,
          cashback_used: additional,
        })
        if (created?.cashback?.ok === false) {
          toast.warning(t('patientPayments.cashbackWarning'))
        }
      }
      toast.success(t('patientPayments.toastCashbackWithdrawn'))
      await loadPayments()
      await loadSummaryCashback()
      emit('cashback-updated')
      await syncVisitPaymentState(visitId)
      await loadVisits()
      closeModal()
    } catch (error) {
      console.error('Failed to save payment:', error)
      toast.error(t('patientPayments.errorSave'))
    } finally {
      savingPayment.value = false
    }
    return
  }

  let amount = Number(form.value.amount)
  const hasManualAmount = Number.isFinite(amount) && amount > 0
  let paymentType = form.value.payment_type
  let note = form.value.note || null

  // DB da amount faqat musbat (payments_amount_check); chegirani refund sifatida musbat summa bilan saqlaymiz
  if (paymentType === 'discount') {
    const percent = Number(form.value.discount_percent)
    const hasPercent = Number.isFinite(percent) && percent > 0

    if (hasPercent && percent > 100) {
      toast.error('Chegirma foizi 100 dan katta bo\'lmasligi kerak')
      return
    }

    if (hasPercent) {
      let baseAmount = getVisitServicesTotal(visitId)
      if (baseAmount <= 0) {
        try {
          baseAmount = await fetchVisitServicesTotal(visitId)
        } catch (error) {
          console.warn('Visit services total fetch failed:', error)
        }
      }
      if (baseAmount <= 0) {
        const visit = visitPreview.value || await getVisitById(visitId)
        baseAmount = Number(visit?.price) || 0
      }

      if (baseAmount <= 0) {
        toast.error('Foizli chegirma uchun tashrifdagi xizmatlar summasi topilmadi')
        return
      }

      amount = Math.round((baseAmount * percent) / 100)
      if (amount <= 0) {
        toast.error('Chegirma summasi 0 dan katta bo\'lishi kerak')
        return
      }
      note = note
        ? `${DISCOUNT_PERCENT_PREFIX}${percent}] ${note}`
        : `${DISCOUNT_PERCENT_PREFIX}${percent}]`
    } else if (!hasManualAmount) {
      toast.error('Chegirma uchun summa kiriting yoki foiz kiriting')
      return
    }

    paymentType = 'refund'
    amount = Math.abs(amount)
    note = note ? `${DISCOUNT_NOTE_PREFIX} ${note}` : DISCOUNT_NOTE_PREFIX
  } else if (!hasManualAmount) {
    toast.error(t('patientPayments.errorAmountRequired'))
    return
  }

  const payload = {
    visit_id: visitId,
    patient_id: patientId,
    amount,
    payment_type: paymentType,
    method: form.value.method || null,
    note,
    paid_at: paidAt,
    cashback_used: 0,
  }

  try {
    if (isEditing.value && form.value.id) {
      await updatePayment(form.value.id, payload)
      toast.success(t('patientPayments.toastUpdated'))
    } else {
      const created = await createPayment(payload)
      toast.success(t('patientPayments.toastCreated'))
      if (created?.cashback && created.cashback.ok === false) {
        toast.warning(t('patientPayments.cashbackWarning'))
      }
    }
    await loadPayments()
    await loadSummaryCashback()
    await syncVisitPaymentState(visitId)
    await loadVisits()
    closeModal()
  } catch (error) {
    console.error('Failed to save payment:', error)
    toast.error(t('patientPayments.errorSave'))
  }
}

// To'lov to'liq bo'lsa visitni "To'liq yakunlangan" qilish va bemor statusini yangilash
const syncVisitPaymentState = async (visitId) => {
  try {
    await syncVisitAfterPayment(visitId)
    const visit = await getVisitById(visitId)
    if (!visit) return
    const debtAmount = Number(visit.debt_amount) || 0

    if (debtAmount <= 0) {

      // Bemor statusini yangilash — agar barcha tashriflar to'liq to'langan bo'lsa "completed"ga o'tkazish
      try {
        const allVisits = visits.value.map((v) =>
          Number(v.id) === Number(visitId) ? visit : v,
        )
        const hasRemainingDebt = allVisits.some(v =>
          v.status === 'completed_debt' ||
          (v.status !== 'completed_paid' && v.status !== 'cancelled' && v.status !== 'no_show')
        )

        if (!hasRemainingDebt) {
          // Bemor barcha to'lovlarni qilgan — statusini "completed"ga o'tkazish
          await updatePatient(props.patientId, {
            status: 'completed',
            last_visit: new Date().toISOString().split('T')[0]
          })
          // Parent'ni yangilash haqida xabar berish
          emit('update-status', 'completed')
        }
      } catch (e) {
        console.warn('Failed to update patient status after payment:', e)
      }
    }
  } catch (e) {
    console.warn('syncVisitPaymentState:', e)
  }
}

const confirmDelete = async (payment) => {
  const confirmed = window.confirm(t('patientPayments.confirmDelete'))
  if (!confirmed) return
  try {
    await deletePayment(payment.id)
    toast.success(t('patientPayments.toastDeleted'))
    await loadPayments()
    if (Number.isFinite(Number(payment.visit_id))) {
      await syncVisitPaymentState(Number(payment.visit_id))
      await loadVisits()
    }
  } catch (error) {
    console.error('Failed to delete payment:', error)
    toast.error(t('patientPayments.errorDelete'))
  }
}

const confirmDeleteService = async (service) => {
  if (!window.confirm(t('patientPayments.confirmDeleteService'))) return
  serviceDeleting.value = service.id
  try {
    await deleteVisitServiceById(service.id)
    toast.success(t('patientPayments.toastServiceDeleted'))
    await loadServices()
  } catch (error) {
    console.error('Failed to delete visit service:', error)
    toast.error(t('patientPayments.errorServiceDelete'))
  } finally {
    serviceDeleting.value = null
  }
}

const loadVisitPreview = async (visitId) => {
  if (!Number.isFinite(visitId)) {
    visitPreview.value = null
    return
  }
  visitPreviewLoading.value = true
  try {
    visitPreview.value = await getVisitById(visitId)
  } catch (error) {
    console.error('Failed to load visit preview:', error)
    visitPreview.value = null
  } finally {
    visitPreviewLoading.value = false
  }
}

watch(
  () => form.value.visit_id,
  (newValue) => {
    if (newValue === '') {
      visitPreview.value = null
      return
    }
    const visitId = Number(newValue)
    loadVisitPreview(visitId)
  }
)
</script>
