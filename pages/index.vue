<template>
  <div class="animate-fade-in">
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <MaintenanceTable v-if="!isLoading && !pending" :data="tableData" />
  </div>
</template>

<script setup lang="ts">
import { engines } from '~/utils/pmCycles'

const router = useRouter()

const { serviceHours, isLoading, gantiOliCycles, overhaulCycles, fetchPMSchedule } = useMaintenanceData()

const pmSchedule = ref<any[]>([])
const engineStatuses = ref<any[]>([])
const pending = ref(false)

const getEngineName = (unit: number) => `Unit ${unit}`

const fetchStatuses = async () => {
  try {
    const res = await fetch('/api/pm/status')
    if (res.ok) {
      engineStatuses.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch statuses', err)
  }
}

const loadSchedule = async () => {
  pending.value = true
  try {
    pmSchedule.value = await fetchPMSchedule(null, null)
  } finally {
    pending.value = false
  }
}



onMounted(() => {
  loadSchedule()
  fetchStatuses()
})

const tableData = computed(() => {
  const sh = serviceHours.value
  if (!sh || sh.length === 0) return []
  
  return sh.map((item: any, index: number) => {
    const pm = pmSchedule.value?.find(pm => pm.extendedProps?.unit === item.unit) || {
      title: 'No PM Scheduled',
      id: '',
      extendedProps: { daysFromToday: 0, targetHours: 0, currentHours: 0 }
    }

    const statusRecord = engineStatuses.value.find(s => s.unit === item.unit)
    let currentStatus = 'Normal'
    if (statusRecord && statusRecord.status !== 'Normal') {
      const today = new Date().setHours(0,0,0,0)
      if (!statusRecord.end_date || new Date(statusRecord.end_date) >= new Date(today)) {
        currentStatus = statusRecord.status
      }
    }
    
    return {
      ...item,
      pm,
      currentStatus,
      gantiOliCycles: gantiOliCycles[index] || 250,
      overhaulCycles: overhaulCycles[index] || 6000,
      mesin: getEngineName(item.unit)
    }
  })
})


</script>

<style>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}
</style>
