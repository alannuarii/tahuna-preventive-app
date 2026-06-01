
export const useEngines = () => {
  const engines = useState<any[]>('engines', () => [])
  const loading = ref(false)

  const fetchEngines = async () => {
    if (engines.value.length > 0) return
    loading.value = true
    try {
      const data = await $fetch<any[]>('/api/pm/engines')
      if (data) {
        engines.value = data
      }
    } catch (err) {
      console.error('Failed to fetch engines:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    engines,
    loading,
    fetchEngines
  }
}
