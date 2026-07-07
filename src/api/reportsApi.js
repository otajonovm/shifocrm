export async function getSoloSummary(doctorId) {
  const { getSoloDoctorStats } = await import('./soloStatsApi')
  const stats = await getSoloDoctorStats(doctorId)
  return {
    todayVisitsCount: stats.todayVisitsCount,
    todayVisits: [],
    dailyRevenue: stats.dailyRevenue,
    nextPatient: null,
    newPatientsCount: stats.weeklyPatients,
    dailyPatients: stats.dailyPatients,
    weeklyPatients: stats.weeklyPatients,
    weeklyRevenue: stats.weeklyRevenue,
    dailyBreakdown: stats.dailyBreakdown,
  }
}

export default { getSoloSummary }
