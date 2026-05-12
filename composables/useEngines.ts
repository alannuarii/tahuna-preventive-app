
export const useEngines = () => {
  const engines = useState<any[]>('engines', () => [])
  const loading = ref(false)

  const fetchEngines = async () => {
    if (engines.value.length > 0) return
    loading.value = true
    try {
      const { data } = await useFetch('/api/pm/engines')
      if (data.value) {
        engines.value = data.value as any[]
      }
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
