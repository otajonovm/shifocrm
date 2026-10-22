const { loadEnv } = require('./env')

loadEnv()

const { supabase } = require('../supabase')
const { resolveClinicId } = require('./booking')

const CACHE_MS = 5 * 60 * 1000
let cached = null
let cachedAt = 0

function formatSom(value) {
  const amount = Number(value) || 0
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function hasOpenDay(schedule) {
  let value = schedule
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return false
    }
  }
  const days = value && typeof value === 'object' ? value.days : null
  if (!days || typeof days !== 'object') return false
  return Object.values(days).some((day) => day?.enabled && day.start && day.end)
}

function serviceLines(services) {
  if (!services.length) return 'Narxlar shifokor ko\'rigidan so\'ng aytiladi.'
  return services
    .map((service) => `${service.name}: ${formatSom(service.price)} so'mdan boshlanadi`)
    .join('\n')
}

async function loadClinicContext() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached

  const clinicId = await resolveClinicId()
  const fallback = {
    clinicId,
    name: 'ShifoAI',
    address: '',
    phone: '',
    services: [],
    doctors: [],
    serviceText: 'Narxlar shifokor ko\'rigidan so\'ng aytiladi.',
  }
  if (!clinicId) {
    cached = fallback
    cachedAt = Date.now()
    return cached
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id,name,address,work_schedule')
    .eq('id', clinicId)
    .maybeSingle()

  const schedule = clinic?.work_schedule && typeof clinic.work_schedule === 'object'
    ? clinic.work_schedule
    : {}

  const { data: services } = await supabase
    .from('services')
    .select('name,base_price')
    .eq('clinic_id', clinicId)
    .order('name')

  const { data: doctors } = await supabase
    .from('doctors')
    .select('id,full_name,is_active,work_schedule')
    .eq('clinic_id', clinicId)

  const bookable = (doctors || [])
    .filter((doctor) => doctor.is_active !== false && hasOpenDay(doctor.work_schedule))
    .map((doctor) => ({
      id: Number(doctor.id),
      name: doctor.full_name || `Shifokor #${doctor.id}`,
    }))

  const list = (services || [])
    .filter((row) => row?.name)
    .map((row) => ({ name: row.name, price: Number(row.base_price) || 0 }))

  cached = {
    clinicId,
    name: clinic?.name || fallback.name,
    address: clinic?.address || '',
    phone: String(schedule.clinic_phone || '').trim(),
    doctors: bookable,
    services: list,
    serviceText: serviceLines(list),
  }
  cachedAt = Date.now()
  return cached
}

module.exports = {
  loadClinicContext,
  formatSom,
}
