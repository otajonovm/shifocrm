import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as employeesApi from '@/api/employeesApi'
import {
  createStaffBridged,
  updateStaffBridged,
  deleteStaffBridged,
} from '@/lib/staffBridge'
import { createCachedListLoader, upsertById } from '@/lib/staleWhileRevalidate'
import { useDoctorsStore } from '@/stores/doctors'

async function refreshDoctorsForCalendar() {
  try {
    const doctorsStore = useDoctorsStore()
    await doctorsStore.fetchAll({ force: true })
  } catch (error) {
    console.warn('[employees] Kalendar ro\'yxatini yangilashda xatolik:', error?.message)
  }
}

export const useEmployeesStore = defineStore('employees', () => {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const cache = createCachedListLoader({ items, loading: isLoading, error })

  const fetchAll = async (options = {}) => {
    return cache.fetchCached(() => employeesApi.getAllEmployees(), { ...options, scope: 'all' })
  }

  const create = async (employeeData, permissionsData, scheduleData) => {
    error.value = null
    try {
      const created = await createStaffBridged({
        employeeData,
        permissionsData,
        scheduleData,
      })
      cache.bumpEpoch()
      if (created) upsertById(items, created)
      await refreshDoctorsForCalendar()
      return created
    } catch (err) {
      error.value = err.message || 'Xodim yaratishda xatolik'
      throw err
    }
  }

  const update = async (id, employeeData, scheduleData, existingEmployee = null) => {
    error.value = null
    try {
      const current = existingEmployee ?? items.value.find((e) => e.id === id)
      const updated = await updateStaffBridged({
        employeeId: id,
        existingEmployee: current,
        employeeData,
        scheduleData,
      })
      cache.bumpEpoch()
      const index = items.value.findIndex((e) => e.id === id)
      if (index !== -1 && updated) {
        items.value[index] = updated
      }
      await refreshDoctorsForCalendar()
      return updated
    } catch (err) {
      error.value = err.message || 'Xodimni yangilashda xatolik'
      throw err
    }
  }

  const remove = async (id) => {
    error.value = null
    try {
      const employee = items.value.find((e) => e.id === id)
      if (!employee) {
        throw new Error('Xodim topilmadi')
      }
      await deleteStaffBridged(employee)
      cache.bumpEpoch()
      items.value = items.value.filter((e) => e.id !== id)
      await refreshDoctorsForCalendar()
    } catch (err) {
      error.value = err.message || 'Xodimni o\'chirishda xatolik'
      throw err
    }
  }

  const getById = async (id) => {
    error.value = null
    try {
      const cached = items.value.find((e) => Number(e.id) === Number(id))
      if (cached) return cached
      return await employeesApi.getEmployeeById(id)
    } catch (err) {
      error.value = err.message || 'Xodimni olishda xatolik'
      throw err
    }
  }

  const reset = () => cache.reset()

  return { items, isLoading, error, fetchAll, create, update, remove, getById, reset }
})
