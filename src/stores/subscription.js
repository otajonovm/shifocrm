import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentClinicId } from '@/lib/clinicContext'
import { listClinicFeatures } from '@/services/subscriptionService'
import {
  PREMIUM_FEATURE_KEYS,
  isPremiumFeatureKey,
  isFeatureRowActive,
  buildFeaturesMap,
} from '@/lib/subscriptionFeatures'
import { isGlobalSuperAdmin } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth'

export const useSubscriptionStore = defineStore('subscription', () => {
  const featuresByKey = ref(buildFeaturesMap())
  const loading = ref(false)
  const loadedClinicId = ref(null)
  const error = ref(null)

  const hasLoaded = computed(() => loadedClinicId.value != null)

  const loadForClinic = async (clinicId) => {
    const cid = clinicId != null ? Number(clinicId) : await getCurrentClinicId()
    if (!Number.isFinite(cid)) {
      featuresByKey.value = buildFeaturesMap()
      loadedClinicId.value = null
      return
    }

    if (loadedClinicId.value === cid && !loading.value) {
      return
    }

    loading.value = true
    error.value = null
    try {
      const rows = await listClinicFeatures(cid)
      featuresByKey.value = buildFeaturesMap(rows)
      loadedClinicId.value = cid
    } catch (err) {
      error.value = err?.message || 'Obuna modullarini yuklashda xatolik'
      featuresByKey.value = buildFeaturesMap()
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    const cid = await getCurrentClinicId()
    loadedClinicId.value = null
    await loadForClinic(cid)
  }

  /**
   * @param {string} key — feature_key yoki route nomi
   * @param {{ bypassSuperAdmin?: boolean }} [opts]
   */
  const checkFeature = (key, opts = {}) => {
    const authStore = useAuthStore()
    if (!opts.bypassSuperAdmin && isGlobalSuperAdmin(authStore)) {
      return true
    }

    const featureKey = String(key || '').trim()
    if (!featureKey || !isPremiumFeatureKey(featureKey)) {
      return true
    }

    return isFeatureRowActive(featuresByKey.value[featureKey])
  }

  const activeFeatures = computed(() =>
    PREMIUM_FEATURE_KEYS.filter((k) => isFeatureRowActive(featuresByKey.value[k]))
  )

  const reset = () => {
    featuresByKey.value = buildFeaturesMap()
    loadedClinicId.value = null
    error.value = null
  }

  return {
    featuresByKey,
    loading,
    loadedClinicId,
    error,
    hasLoaded,
    activeFeatures,
    loadForClinic,
    refresh,
    checkFeature,
    reset,
  }
})
