<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <h1 class="home-title m-0">Jadwal Preventive Maintenance</h1>
      <div class="page-header-actions">
        <SegmentedControl 
          :options="viewOptions" 
          v-model="viewMode"
        />
      </div>
    </div>

    <div v-if="viewMode === 'calendar'" class="filter-bar">
      <input 
        type="date" 
        v-model="startDate"
        class="form-input form-input-sm"
        placeholder="Start"
      />
      <input 
        type="date" 
        v-model="endDate"
        class="form-input form-input-sm"
        placeholder="End"
      />
      <button class="btn btn-primary btn-sm" @click="loadSchedule">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Filter
      </button>
    </div>
    
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <MaintenanceTable v-if="!isLoading && !pending && viewMode === 'table'" :data="tableData" />
    
    <PMCalendar v-if="!isLoading && !pending && viewMode === 'calendar'" :events="pmSchedule" @event-click="handleEventClick" />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const viewMode = ref('table')
const startDate = ref('')
const endDate = ref('')

const { serviceHours, isLoading, gantiOliCycles, overhaulCycles, fetchPMSchedule } = useMaintenanceData()

const pmSchedule = ref<any[]>([])
const pending = ref(false)

const getEngineName = (unit: number) => `Unit ${unit}`

const loadSchedule = async () => {
  pending.value = true
  try {
    pmSchedule.value = await fetchPMSchedule(startDate.value || null, endDate.value || null)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadSchedule()
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
    
    return {
      ...item,
      gantiOliCycles: gantiOliCycles[index] || 250,
      overhaulCycles: overhaulCycles[index] || 6000,
      mesin: getEngineName(item.unit),
      pm
    }
  })
})

const handleEventClick = (event: any) => {
  const eventData = {
    id: event.id,
    pm: event.title.split(' ')[0],
    unit: event.extendedProps.unit,
    ...event.extendedProps
  }
  localStorage.setItem('selectedEvent', JSON.stringify(eventData))
  router.push(`/detail/${event.id}`)
}

const listIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'

const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const viewOptions = [
  { value: 'table', label: 'Data', icon: listIcon },
  { value: 'calendar', label: 'Kalender', icon: calendarIcon }
]
</script>
