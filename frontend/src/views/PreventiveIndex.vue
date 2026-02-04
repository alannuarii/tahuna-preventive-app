<template>
  <div class="animate-fade-in">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="home-title m-0">Jadwal Preventive Maintenance</h1>
      
      <div class="flex flex-col gap-3 w-full md:w-auto">
        <!-- View Toggle -->
        <div class="view-toggle self-start">
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'table' }"
            @click="viewMode = 'table'"
            title="Tampilan Tabel"
          >
            📋
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'calendar' }"
            @click="viewMode = 'calendar'"
            title="Tampilan Kalender"
          >
            📅
          </button>
        </div>

        <!-- Date Filters (Calendar View Only) -->
        <div v-if="viewMode === 'calendar'" class="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <input 
            type="date" 
            v-model="startDate" 
            class="form-input form-input-sm flex-1"
            style="min-width: 120px;"
            placeholder="Start"
          />
          <span class="text-muted hidden sm:inline">-</span>
          <input 
            type="date" 
            v-model="endDate" 
            class="form-input form-input-sm flex-1"
            style="min-width: 120px;"
            placeholder="End"
          />
          <button class="btn btn-primary btn-sm w-full sm:w-auto mt-1 sm:mt-0" @click="filterSchedule">
            Filter
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading || pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <!-- Table View -->
    <MaintenanceTable v-else-if="viewMode === 'table'" :data="tableData" />
    
    <!-- Calendar View -->
    <PMCalendar v-else :events="events || []" @event-click="handleEventClick" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMaintenanceData } from '../composables/useMaintenanceData'
import MaintenanceTable from '../components/MaintenanceTable.vue'
import PMCalendar from '../components/PMCalendar.vue'

const router = useRouter()
const viewMode = ref('table')
const startDate = ref('')
const endDate = ref('')

// Data for Table View
const { serviceHours, isLoading, getEngineName, gantiOliCycles, overhaulCycles, fetchPMSchedule } = useMaintenanceData()

const pmSchedule = ref([])
const pending = ref(false)

const loadSchedule = async () => {
    pending.value = true
    try {
        pmSchedule.value = await fetchPMSchedule(startDate.value, endDate.value)
    } finally {
        pending.value = false
    }
}

onMounted(() => {
    loadSchedule()
})

// For calendar view, events = pmSchedule
const events = pmSchedule

// Computed table data
const tableData = computed(() => {
  if (!serviceHours.value || serviceHours.value.length === 0) return []
  
  return serviceHours.value.map((item, index) => {
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

// Calendar functions
const filterSchedule = async () => {
  await loadSchedule()
}

const handleEventClick = (event) => {
  // In our mock, URL is NOT in extendedProps usually, so we construct it
  // But if it was there we would use it. 
  // We'll trust the logic from reference but adapt
  
  // Save to localStorage
  const eventData = {
    id: event.id,
    pm: event.title.split(' ')[0],
    unit: event.extendedProps.unit,
    ...event.extendedProps
  }
  localStorage.setItem('selectedEvent', JSON.stringify(eventData))
  
  router.push(`/preventive/detail/${event.id}`)
}
</script>

<style scoped>
.view-toggle {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 2px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--gray-600);
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: var(--gray-200);
  color: var(--gray-800);
}

.toggle-btn.active {
  background: white;
  color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

.icon {
  font-size: 1rem;
}
</style>
