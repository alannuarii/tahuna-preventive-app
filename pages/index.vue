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

        <div class="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div class="grid grid-cols-2 gap-4 flex-1 w-full md:w-auto">
            <div class="form-group mb-0">
              <label class="form-label text-muted" style="font-size: 0.875rem;">Dari Tanggal</label>
              <input type="date" v-model="startDate" class="form-input form-input-sm mt-1 w-full" />
            </div>
            <div class="form-group mb-0">
              <label class="form-label text-muted" style="font-size: 0.875rem;">Sampai Tanggal</label>
              <input type="date" v-model="endDate" class="form-input form-input-sm mt-1 w-full" />
            </div>
          </div>
          
          <div class="form-group mb-0 flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <button class="btn btn-primary btn-sm flex-1 md:flex-none px-4" style="border-radius: 99px;" @click="loadSchedule">Filter</button>
            <button class="btn btn-secondary btn-sm flex-1 md:flex-none px-4" style="border-radius: 99px;" @click="resetFilter">Reset</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <MaintenanceTable v-if="!isLoading && !pending && viewMode === 'table'" :data="tableData" />
    
    <PMCalendar v-if="!isLoading && !pending && viewMode === 'calendar'" :events="filteredPmSchedule" @event-click="handleEventClick" @month-change="handleMonthChange" />

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
import { engines } from '~/utils/pmCycles'

const router = useRouter()
const viewMode = ref('table')
const startDate = ref('')
const endDate = ref('')
const selectedUnits = ref<number[]>([])
const selectedPMs = ref<string[]>([])
const showMobileFilter = ref(false)

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

const resetFilter = () => {
  startDate.value = ''
  endDate.value = ''
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
  }).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
})

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

<style>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}
</style>
