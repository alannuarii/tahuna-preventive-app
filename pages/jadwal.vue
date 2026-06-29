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

    <div v-if="viewMode === 'calendar'" class="flex justify-end mb-3 mobile-only">
      <button class="btn btn-secondary btn-sm" @click="showMobileFilter = !showMobileFilter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        {{ showMobileFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
      </button>
    </div>

    <div v-if="viewMode === 'calendar'" class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobileFilter }">
      <div class="card-body">
        <div class="form-group mb-4">
          <label class="form-label text-muted" style="font-size: 0.875rem;">Filter Unit</label>
          <div class="flex flex-wrap gap-4 items-center mt-2">
            <label class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :checked="selectedUnits.length === 0" @change="selectedUnits = []" class="form-checkbox" />
              <span class="text-sm font-medium">Semua</span>
            </label>
            <label v-for="engine in engines" :key="engine.unit" class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :value="engine.unit" v-model="selectedUnits" class="form-checkbox" />
              <span class="text-sm">Unit {{ engine.unit }}</span>
            </label>
          </div>
        </div>

        <div class="form-group mb-4">
          <label class="form-label text-muted" style="font-size: 0.875rem;">Filter Jenis PM</label>
          <div class="flex flex-wrap gap-4 items-center mt-2">
            <label class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :checked="selectedPMs.length === 0" @change="selectedPMs = []" class="form-checkbox" />
              <span class="text-sm font-medium">Semua</span>
            </label>
            <label v-for="pm in ['P1', 'P2', 'P3', 'P4', 'P5']" :key="pm" class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :value="pm" v-model="selectedPMs" class="form-checkbox" />
              <span class="text-sm">{{ pm }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end mt-2">
          <button class="btn btn-secondary btn-sm px-4" style="border-radius: 99px;" @click="resetFilter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Reset Filter
          </button>
        </div>
      </div>
    </div>
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    

    
    <PMCalendar v-if="!isLoading && !pending && viewMode === 'calendar'" :events="filteredPmSchedule" @event-click="handleEventClick" @month-change="handleMonthChange" @download="handleDownloadCalendar" />

    <EngineStatus v-if="!isLoading && !pending && viewMode === 'status'" />

    <div v-if="!isLoading && !pending && viewMode === 'calendar'" class="mt-6">
      <div class="card">
        <div class="table-wrapper">
          <table class="table table-mobile-optimized">
            <thead>
              <tr>
                <th style="min-width: 120px;">TANGGAL</th>
                <th>UNIT</th>
                <th>JENIS PM</th>
                <th class="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in currentMonthEvents" :key="event.id">
                <td class="whitespace-nowrap">{{ formatDate(event.start) }}</td>
                <td class="font-medium whitespace-nowrap">Unit {{ event.extendedProps.unit }}</td>
                <td>
                  <span :class="['badge', getPMBadgeClass(event.title.split(' ')[0])]">
                    {{ event.title.split(' ')[0] }}
                  </span>
                </td>
                <td class="text-right">
                  <button @click="handleEventClick(event)" class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 99px;">
                    Lihat Detail &rarr;
                  </button>
                </td>
              </tr>
              <tr v-if="currentMonthEvents.length === 0">
                <td colspan="4" class="text-center py-4 text-muted">Tidak ada jadwal PM di bulan ini.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { engines } = useEngines()

const router = useRouter()
const viewMode = ref('calendar')
const selectedUnits = ref<number[]>([])
const selectedPMs = ref<string[]>([])
const showMobileFilter = ref(false)

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
    pmSchedule.value = await fetchPMSchedule()
  } finally {
    pending.value = false
  }
}

const resetFilter = () => {
  selectedUnits.value = []
  selectedPMs.value = []
  loadSchedule()
}

const filteredPmSchedule = computed(() => {
  let filtered = pmSchedule.value

  if (selectedUnits.value.length > 0) {
    filtered = filtered.filter(event => selectedUnits.value.includes(event.extendedProps.unit))
  }

  if (selectedPMs.value.length > 0) {
    filtered = filtered.filter(event => {
      const jenisPM = event.title.split(' ')[0]
      return selectedPMs.value.includes(jenisPM)
    })
  }

  return filtered
})

const currentCalendarMonth = ref(new Date())

const handleMonthChange = (date: Date) => {
  currentCalendarMonth.value = date
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }).replace('.', '')
}

const getPMBadgeClass = (pm: string) => {
  const classes: Record<string, string> = { P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary' }
  return classes[pm] || 'badge-secondary'
}

const currentMonthEvents = computed(() => {
  const month = currentCalendarMonth.value.getMonth()
  const year = currentCalendarMonth.value.getFullYear()
  
  return filteredPmSchedule.value.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate.getMonth() === month && eventDate.getFullYear() === year
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
})

onMounted(() => {
  loadSchedule()
  fetchStatuses()
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

const handleDownloadCalendar = async (date: Date) => {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  
  try {
    const url = `/api/pm/download-rencana?month=${month}&year=${year}`
    const response = await fetch(url)
    
    if (!response.ok) throw new Error('Download failed')
      
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    
    const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
    a.download = `Rencana PM ${monthNames[month - 1]} ${year}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading rencana:', error)
    showAlert('Gagal mengunduh file Excel.', 'error')
  }
}

const listIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'

const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const statusIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'

const viewOptions = [
  { value: 'calendar', label: 'Kalender', icon: calendarIcon },
  { value: 'status', label: 'Status', icon: statusIcon }
]
</script>

<style>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}
</style>
