export const useMaintenanceData = () => {
  const serviceHours = ref<any[]>([])
  const isLoading = ref(false)

  // Oil change cycles per unit
  const gantiOliCycles = [500, 250, 250, 500, 500, 250, 250]
  const overhaulCycles = [6000, 6000, 6000, 5000, 5000, 6000, 6000]

  const refreshServiceHours = async () => {
    isLoading.value = true
    try {
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
    fetchPMSchedule
  }
}
