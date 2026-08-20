import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDoctorsStore } from '@/stores/doctors'
import { useToast } from '@/composables/useToast'
import {
  buildAdditionalExpenses,
  buildPaymentMethodRows,
  buildReportSummary,
  buildRevenueData,
  defaultReportRange,
  loadClinicReportsBundle,
  reportCacheKey,
} from '@/services/reportsService'
import { canViewClinicProfit } from '@/lib/roles'

const emptySummary = () => ({
  totalPayments: 0,
  totalRefunds: 0,
  netIncome: 0,
  totalAdditionalExpenses: 0,
  totalExpenses: 0,
  totalMovementsOut: 0,
})

const emptyLoading = () => ({
  payments: false,
  income: false,
  services: false,
  expenses: false,
  movements: false,
  week: false,
})

export const useReportsStore = defineStore('reports', () => {
  const toast = useToast()
  const authStore = useAuthStore()
  const doctorsStore = useDoctorsStore()

  const filters = ref({ startDate: '', endDate: '' })
  const revenuePeriod = ref('day')
  const loading = ref(emptyLoading())
  const summary = ref(emptySummary())
  const payments = ref([])
  const paymentMethods = ref([])
  const topServices = ref([])
  const revenueData = ref([])
  const doctors = ref([])
  const additionalExpenses = ref([])
  const expensesList = ref([])
  const movementsList = ref([])
  const inventoryItems = ref([])
  const weekRows = ref([])
  const weekUniquePatients = ref(0)
  const weekTotalRevenue = ref(0)

  const snapshots = new Map()
  const cacheKey = ref('')
  let inflight = null
  let inflightKey = ''
  let epoch = 0

  const setLoading = (value) => {
    loading.value = {
      payments: value,
      income: value,
      services: value,
      expenses: value,
      movements: value,
      week: value,
    }
  }

  const ensureDefaultFilters = () => {
    if (!filters.value.startDate || !filters.value.endDate) {
      filters.value = defaultReportRange()
    }
  }

  const resetFilters = () => {
    filters.value = defaultReportRange()
  }

  const captureSnapshot = () => ({
    payments: payments.value,
    paymentMethods: paymentMethods.value,
    topServices: topServices.value,
    revenueData: revenueData.value,
    doctors: doctors.value,
    additionalExpenses: additionalExpenses.value,
    expensesList: expensesList.value,
    movementsList: movementsList.value,
    inventoryItems: inventoryItems.value,
    weekRows: weekRows.value,
    weekUniquePatients: weekUniquePatients.value,
    weekTotalRevenue: weekTotalRevenue.value,
    summary: { ...summary.value },
  })

  const applySnapshot = (snap) => {
    if (!snap) return
    payments.value = snap.payments || []
    paymentMethods.value = snap.paymentMethods || []
    topServices.value = snap.topServices || []
    revenueData.value = snap.revenueData || []
    doctors.value = snap.doctors || []
    additionalExpenses.value = snap.additionalExpenses || []
    expensesList.value = snap.expensesList || []
    movementsList.value = snap.movementsList || []
    if (snap.inventoryItems?.length) {
      inventoryItems.value = snap.inventoryItems
    }
    weekRows.value = snap.weekRows || []
    weekUniquePatients.value = Number(snap.weekUniquePatients) || 0
    weekTotalRevenue.value = Number(snap.weekTotalRevenue) || 0
    summary.value = { ...emptySummary(), ...(snap.summary || {}) }
  }

  const rebuildDerived = () => {
    const expenseRows = expensesList.value || []
    const movementRows = movementsList.value || []
    const nextSummary = buildReportSummary({
      payments: payments.value,
      expenses: expenseRows,
      subtractExpenses: canViewClinicProfit(authStore),
    })
    nextSummary.totalMovementsOut = movementRows
      .filter((m) => m.type === 'out')
      .reduce((s, m) => s + (Number(m.quantity) || 0), 0)
    summary.value = nextSummary
    paymentMethods.value = buildPaymentMethodRows(payments.value)
    revenueData.value = buildRevenueData(payments.value, revenuePeriod.value)
    additionalExpenses.value = authStore.userRole === 'solo'
      ? buildAdditionalExpenses(payments.value)
      : []
  }

  const applyBundle = (bundle) => {
    payments.value = bundle.payments || []
    doctors.value = doctorsStore.items || []
    topServices.value = bundle.topServices || []
    if (bundle.inventoryItems?.length || !inventoryItems.value.length) {
      inventoryItems.value = bundle.inventoryItems || []
    }
    expensesList.value = (bundle.expenses || [])
      .slice()
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
    movementsList.value = (bundle.movements || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    weekRows.value = bundle.week?.dailyBreakdown || []
    weekUniquePatients.value = Number(bundle.week?.uniquePatients) || 0
    weekTotalRevenue.value = Number(bundle.week?.totalRevenue) || 0
    rebuildDerived()
  }

  const rebuildRevenueData = () => {
    revenueData.value = buildRevenueData(payments.value, revenuePeriod.value)
    const key = cacheKey.value
    if (key && snapshots.has(key)) {
      snapshots.set(key, captureSnapshot())
    }
  }

  const revalidate = (key, startDate, endDate) => {
    const myEpoch = epoch
    if (inflight && inflightKey === key) return inflight

    inflightKey = key
    inflight = Promise.all([
      loadClinicReportsBundle({ startDate, endDate }),
      doctorsStore.fetchAll().catch(() => doctorsStore.items || []),
    ])
      .then(([bundle]) => {
        if (myEpoch !== epoch) return
        applyBundle(bundle)
        cacheKey.value = key
        snapshots.set(key, captureSnapshot())
      })
      .catch((err) => {
        if (myEpoch !== epoch) return
        console.error('Failed to load reports:', err)
        if (!snapshots.has(key)) {
          toast.error("Hisobotlarni yuklashda xatolik yuz berdi")
        }
        throw err
      })
      .finally(() => {
        if (myEpoch !== epoch) return
        inflight = null
        inflightKey = ''
        setLoading(false)
      })

    return inflight
  }

  const fetchReports = async ({ force = false } = {}) => {
    ensureDefaultFilters()
    const { startDate, endDate } = filters.value
    const key = reportCacheKey(authStore.userClinicId, startDate, endDate)
    const cached = snapshots.get(key)

    if (cached && !force) {
      applySnapshot(cached)
      cacheKey.value = key
      revalidate(key, startDate, endDate).catch(() => {})
      return
    }

    if (inflight && inflightKey === key && !force) {
      setLoading(!cached)
      try {
        await inflight
      } catch {
        setLoading(false)
      }
      return
    }

    if (key !== inflightKey && key !== cacheKey.value) {
      epoch += 1
      inflight = null
      inflightKey = ''
    }

    if (cached) {
      applySnapshot(cached)
      cacheKey.value = key
    } else {
      setLoading(true)
    }

    try {
      await revalidate(key, startDate, endDate)
    } catch {
      setLoading(false)
    }
  }

  const reset = () => {
    epoch += 1
    inflight = null
    inflightKey = ''
    snapshots.clear()
    cacheKey.value = ''
    filters.value = { startDate: '', endDate: '' }
    revenuePeriod.value = 'day'
    loading.value = emptyLoading()
    summary.value = emptySummary()
    payments.value = []
    paymentMethods.value = []
    topServices.value = []
    revenueData.value = []
    doctors.value = []
    additionalExpenses.value = []
    expensesList.value = []
    movementsList.value = []
    inventoryItems.value = []
    weekRows.value = []
    weekUniquePatients.value = 0
    weekTotalRevenue.value = 0
  }

  return {
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
    ensureDefaultFilters,
    resetFilters,
    fetchReports,
    rebuildRevenueData,
    reset,
  }
})
