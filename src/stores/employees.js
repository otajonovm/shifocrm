import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as employeesApi from '@/api/employeesApi'
import { hydrateEmployee } from '@/lib/staffHelpers'
import {
  createStaffBridged,
  updateStaffBridged,
  deleteStaffBridged,
} from '@/lib/staffBridge'
import { useDoctorsStore } from '@/stores/doctors'

async function refreshDoctorsForCalendar() {
  try {
    const doctorsStore = useDoctorsStore()
    await doctorsStore.fetchAll()
  } catch (error) {
    console.warn('[employees] Kalendar ro\'yxatini yangilashda xatolik:', error?.message)
  }
}

export const useEmployeesStore = defineStore('employees', () => {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null
    try {
      items.value = await employeesApi.getAllEmployees()
    } catch (err) {
      error.value = err.message || 'Xodimlarni yuklashda xatolik'
      console.error('Error fetching employees:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const create = async (employeeData, permissionsData, scheduleData) => {
    error.value = null
    try {
      const created = await createStaffBridged({
        employeeData,
        permissionsData,
        scheduleData,
      })
      if (created) items.value.unshift(created)
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
      return await employeesApi.getEmployeeById(id)
    } catch (err) {
      error.value = err.message || 'Xodimni olishda xatolik'
      throw err
    }
  }

  return { items, isLoading, error, fetchAll, create, update, remove, getById }
})
