import { ref, computed, unref, watch } from 'vue'
import { getCashbackBalance, getCashbackConfig } from '@/services/cashbackService'
import { useSubscriptionStore } from '@/stores/subscription'
import { FEATURE_KEYS } from '@/lib/subscriptionFeatures'

function readValue(source) {
  return typeof source === 'function' ? source() : unref(source)
}

/**
 * To'lov modalida keshbek balansi va "keshbekdan to'lash" holati.
 * @param {object} options
 * @param {import('vue').MaybeRefOrGetter} options.patientId
 * @param {import('vue').MaybeRefOrGetter} options.paymentAmount
 * @param {import('vue').MaybeRefOrGetter<boolean>} options.enabled
 */
export function usePaymentCashback({ patientId, paymentAmount, enabled, autoFillMax = true }) {
  const subscriptionStore = useSubscriptionStore()
  const featureEnabled = computed(() => subscriptionStore.checkFeature(FEATURE_KEYS.CASHBACK))
  const isEnabled = computed(() => Boolean(readValue(enabled)) && featureEnabled.value)

  const balance = ref(0)
  const balanceLoading = ref(false)
  const balanceError = ref(false)
  const useCashback = ref(false)
  const cashbackAmount = ref('')
  const cashbackPercent = ref(5)
  const hidden = ref(false)

  const showCashback = computed(() => isEnabled.value && !hidden.value)

  const maxCashback = computed(() => {
    const amount = Math.max(0, Number(readValue(paymentAmount)) || 0)
    return Math.min(amount, Math.max(0, Number(balance.value) || 0))
  })

  const cashbackUsed = computed(() => {
    if (!useCashback.value) return 0
    const raw = Number(cashbackAmount.value)
    if (!Number.isFinite(raw) || raw <= 0) return 0
    return Math.min(raw, maxCashback.value)
  })

  const remainingCash = computed(() => {
    const amount = Math.max(0, Number(readValue(paymentAmount)) || 0)
    return Math.max(0, amount - cashbackUsed.value)
  })

  const reset = () => {
    useCashback.value = false
    cashbackAmount.value = ''
    balance.value = 0
    balanceError.value = false
    balanceLoading.value = false
    hidden.value = false
  }

  const loadBalance = async () => {
    const pid = readValue(patientId)
    if (!isEnabled.value || pid == null || pid === '') {
      balance.value = 0
      balanceError.value = false
      return
    }

    balanceLoading.value = true
    balanceError.value = false
    try {
      const [balanceResult, configResult] = await Promise.all([
        getCashbackBalance(pid),
        getCashbackConfig(),
      ])
      if (!balanceResult.ok) {
        balance.value = 0
        if (balanceResult.error === 'NOT_CONFIGURED') {
          hidden.value = true
          balanceError.value = false
        } else {
          hidden.value = false
          balanceError.value = true
        }
      } else {
        hidden.value = false
        balance.value = Number(balanceResult.data?.balance) || 0
      }
      if (configResult.ok && configResult.data?.cashback_percent) {
        cashbackPercent.value = Number(configResult.data.cashback_percent) || 5
      }
    } catch (error) {
      console.warn('Cashback balance load failed:', error)
      balance.value = 0
      balanceError.value = true
    } finally {
      balanceLoading.value = false
    }
  }

  watch(useCashback, (on) => {
    if (on) {
      if (readValue(autoFillMax) === false) {
        cashbackAmount.value = cashbackAmount.value || ''
        return
      }
      cashbackAmount.value = maxCashback.value > 0 ? String(maxCashback.value) : ''
    } else {
      cashbackAmount.value = ''
    }
  })

  watch(maxCashback, (max) => {
    if (!useCashback.value) return
    const current = Number(cashbackAmount.value) || 0
    if (current > max) {
      cashbackAmount.value = max > 0 ? String(max) : ''
    }
  })

  watch(
    () => [readValue(patientId), isEnabled.value],
    ([nextPatient, enabledNow], previous) => {
      const prevPatient = previous?.[0]
      if (prevPatient != null && prevPatient !== nextPatient) {
        useCashback.value = false
        cashbackAmount.value = ''
      }
      if (enabledNow) {
        loadBalance()
      } else {
        reset()
      }
    },
  )

  return {
    balance,
    balanceLoading,
    balanceError,
    useCashback,
    cashbackAmount,
    cashbackPercent,
    maxCashback,
    cashbackUsed,
    remainingCash,
    showCashback,
    loadBalance,
    reset,
  }
}
