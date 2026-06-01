
export const usePmCycles = () => {
  const pmCycles = useState<any[]>('pmCycles', () => [])
  const loading = ref(false)

  const fetchPmCycles = async () => {
    if (pmCycles.value.length > 0) return
    loading.value = true
    try {
      const data = await $fetch<any[]>('/api/pm/cycles')
      if (data) {
        pmCycles.value = data
      }
    } catch (err) {
      console.error('Failed to fetch pm cycles:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    pmCycles,
    loading,
    fetchPmCycles
  }
}
