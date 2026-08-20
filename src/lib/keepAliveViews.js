export const KEEP_ALIVE_VIEWS = [
  'DashboardView',
  'PatientsView',
  'PatientDetailView',
  'AppointmentsView',
  'PaymentsView',
  'ServicesView',
  'ReportsView',
  'ReportsSoloView',
  'DoctorsView',
  'LeadsView',
  'WarehouseView',
  'SettingsView',
  'TreatmentPlansView',
  'AuditLogView',
  'ManagementCenterView',
  'DoctorProfileView',
]

export function keepAliveKey(route) {
  if (!route) return 'app'
  if (route.name === 'patient-detail') {
    return `patient-detail:${route.params?.id || ''}`
  }
  return String(route.name || route.path)
}
