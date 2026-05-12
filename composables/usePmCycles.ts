
export const usePmCycles = () => {
  const pmCycles = useState<any[]>('pmCycles', () => [])
  const loading = ref(false)

  const fetchPmCycles = async () => {
    if (pmCycles.value.length > 0) return
    loading.value = true
    try {
      const { data } = await useFetch('/api/pm/cycles')
      if (data.value) {
        pmCycles.value = data.value as any[]
      }
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
