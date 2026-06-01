import { useEngines } from './useEngines'

export const useMaintenanceData = () => {
  const { engines, fetchEngines } = useEngines()
  const serviceHours = ref<any[]>([])
  const isLoading = ref(false)

  const gantiOliCycles = computed(() => {
    return engines.value.map((e: any) => e.ganti_oli_cycle || 500)
  })
  const overhaulCycles = computed(() => {
    return engines.value.map((e: any) => e.overhaul_cycle || 6000)
  })

  const refreshServiceHours = async () => {
    isLoading.value = true
    try {
      await fetchEngines()
      const res = await fetch('/api/service-hours')
      if (res.ok) serviceHours.value = await res.json()
    } finally {
      isLoading.value = false
    }
  }

  // Initial fetch on client
  onMounted(() => {
    refreshServiceHours()
  })

  const fetchPMSchedule = async (startDate: string | null = null, endDate: string | null = null) => {
    const query = new URLSearchParams()
    if (startDate) query.append('start', startDate)
    if (endDate) query.append('end', endDate)
    const res = await fetch(`/api/pm/schedule?${query.toString()}`)
    return await res.json()
  }

  return {
    serviceHours,
    isLoading,
    refreshServiceHours,
    gantiOliCycles,
    overhaulCycles,
    engines,
    fetchPMSchedule
  }
}
