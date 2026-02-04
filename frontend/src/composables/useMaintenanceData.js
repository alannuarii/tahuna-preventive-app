import { ref } from 'vue'
import { api } from '../services/api'
import { engines, gantiOliHours, pmCycles } from '../data/static'

export const useMaintenanceData = () => {
    const serviceHours = ref([])
    const isLoading = ref(false)

    // Oil change cycles per unit
    const gantiOliCycles = [500, 250, 250, 500, 500, 250, 250]
    const overhaulCycles = [6000, 6000, 6000, 5000, 5000, 6000, 6000]

    // Get engine name by unit
    const getEngineName = (unit) => {
        const engine = engines.find(e => e.unit === unit)
        return engine ? `${engine.mesin} Unit ${engine.unit}` : `Unit ${unit}`
    }

    const refreshServiceHours = async () => {
        isLoading.value = true
        try {
            serviceHours.value = await api.getServiceHours()
        } finally {
            isLoading.value = false
        }
    }

    // Initial fetch
    refreshServiceHours()

    // Fetch PM schedule
    const fetchPMSchedule = async (startDate = null, endDate = null) => {
        return await api.getPMSchedule({ start: startDate, end: endDate })
    }

    return {
        serviceHours,
        isLoading,
        refreshServiceHours,
        gantiOliCycles,
        overhaulCycles,
        engines,
        getEngineName,
        fetchPMSchedule
    }
}
