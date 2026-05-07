<template>
  <div class="animate-fade-in">
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <!-- Real-time Clock -->
    <div v-if="!isLoading && !pending" class="realtime-clock">
      {{ formattedTime }}
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



const formattedTime = ref('')

const updateTime = () => {
  const now = new Date()
  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' })
  const dateNum = now.getDate()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long' })
  const yearNum = now.getFullYear()
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  formattedTime.value = `${dayName}, ${dateNum} ${monthName} ${yearNum} ${timeStr} WITA`
}

let timer: any = null

onMounted(() => {
  loadSchedule()
  fetchStatuses()
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
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
.realtime-clock {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-400);
  margin-bottom: var(--space-4);
  text-align: left;
  letter-spacing: 0.02em;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 480px) {
  .realtime-clock {
    font-size: 0.7rem;
    margin-bottom: var(--space-3);
  }
}

@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}
</style>
