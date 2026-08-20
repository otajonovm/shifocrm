import { listPatientsPage } from '@/api/patientsApi'
import { getVisitsSummaryByPatientIds } from '@/api/visitsApi'

/**
 * Bemorlar ro'yxati: sahifa + qidiruv + tashrif qarzi (balans).
 */
export async function loadPatientsDirectory(filters = {}) {
  const page = await listPatientsPage(filters)
  const rows = page.data || []
  const summary = await getVisitsSummaryByPatientIds(rows.map((row) => row.id))

  const data = rows.map((patient) => {
    const id = Number(patient.id)
    const fromVisits = Number(summary.balanceByPatient[id])
    return {
      ...patient,
      balance: Number.isFinite(fromVisits) ? fromVisits : 0,
    }
  })

  return {
    data,
    total: Number(page.total) || 0,
    page: page.page,
    pageSize: page.pageSize,
    latestByPatient: summary.latestByPatient,
  }
}
