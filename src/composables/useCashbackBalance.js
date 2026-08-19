import { ref, computed, unref, watch } from 'vue'
import { getCashbackBalance } from '@/services/cashbackService'
import { useSubscriptionStore } from '@/stores/subscription'
import { FEATURE_KEYS } from '@/lib/subscriptionFeatures'

function readValue(source) {
  return typeof source === 'function' ? source() : unref(source)
}

/**
 * Bemor keshbek balansini ko'rsatish uchun (to'lov formasiz).
 * @param {import('vue').MaybeRefOrGetter} patientIdSource
 */
export function useCashbackBalance(patientIdSource) {
  const subscriptionStore = useSubscriptionStore()
  const featureEnabled = computed(() => subscriptionStore.checkFeature(FEATURE_KEYS.CASHBACK))

  const balance = ref(0)
  const loading = ref(false)
  const error = ref(false)
  const errorCode = ref(null)
  const configured = ref(false)

  const load = async () => {
    const pid = readValue(patientIdSource)
    if (!featureEnabled.value || pid == null || pid === '') {
      balance.value = 0
      error.value = false
      errorCode.value = null
      configured.value = false
      return
    }

    loading.value = true
    error.value = false
    try {
      const result = await getCashbackBalance(pid)
      if (!result.ok) {
        balance.value = 0
        errorCode.value = result.error || 'CASHBACK_ERROR'
        if (result.error === 'NOT_CONFIGURED') {
          configured.value = false
          error.value = false
        } else {
          configured.value = true
          error.value = true
        }
        return
      }
      if (result.data?.setup_required) {
        configured.value = true
        error.value = true
        errorCode.value = result.data.setup_reason || 'SETUP_REQUIRED'
        balance.value = 0
        return
      }
      errorCode.value = null
      configured.value = true
      balance.value = Number(result.data?.balance) || 0
    } catch (err) {
      console.warn('Cashback balance load failed:', err)
      configured.value = true
      error.value = true
      errorCode.value = 'NETWORK_ERROR'
      balance.value = 0
    } finally {
      loading.value = false
    }
  }

  watch(() => [readValue(patientIdSource), featureEnabled.value], load, { immediate: true })

  return {
    balance,
    loading,
    error,
    errorCode,
    configured,
    load,
  }
}
