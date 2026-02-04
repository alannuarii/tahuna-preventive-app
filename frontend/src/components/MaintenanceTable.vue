<template>
  <div class="maintenance-view">
    <!-- Desktop Table View -->
    <div class="table-wrapper desktop-only">
      <table class="table">
        <caption class="home-caption">
          Data tanggal {{ dataDate }}
        </caption>
        
        <thead>
          <tr>
            <th>Unit</th>
            <th>Operasi (Jam)</th>
            <th>Ganti Oli (Jam)</th>
            <th>Overhaul (Jam)</th>
            <th>PM (P1-P5)</th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-for="item in data" :key="item.unit">
            <td class="font-semibold">Unit {{ item.unit }}</td>
            <td :class="getOperasiClass(item)">
              {{ operasiValue(item) }} / <span class="font-semibold">{{ operasiTarget(item) }}</span>
            </td>
            <td :class="getGantiOliClass(item)">
              {{ Math.floor(item.gantiOli || item.ganti_oli) }} / <span class="font-semibold">{{ item.gantiOliCycles }}</span>
            </td>
            <td :class="getOverhaulClass(item)">
              {{ Math.floor(item.jamoperasi) }} / <span class="font-semibold">{{ item.overhaulCycles }}</span>
            </td>
            <td>
              <router-link 
                :to="`/preventive/detail/${item.pm?.id || ''}`" 
                class="badge badge-primary"
                @click="savePmToLocalStorage(item)"
                v-if="item.pm && item.pm.id"
              >
                {{ pmTimeToGo(item) }}h → {{ pmTitle(item) }}
              </router-link>
              <span v-else class="text-muted text-xs">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="mobile-cards mobile-only">
      <div class="mb-4 text-center text-xs text-muted italic">
        Data tanggal {{ dataDate }}
      </div>

      <div v-for="item in data" :key="item.unit" class="mobile-card">
        <div class="mobile-card-header">
          <span class="font-bold text-lg">Unit {{ item.unit }}</span>
          <router-link 
            v-if="item.pm && item.pm.id"
            :to="`/preventive/detail/${item.pm?.id}`" 
            class="badge badge-primary"
            @click="savePmToLocalStorage(item)"
          >
            {{ pmTimeToGo(item) }}h → {{ pmTitle(item) }}
          </router-link>
        </div>
        
        <div class="mobile-card-body">
          <div class="metric-row">
            <span class="metric-label">Ganti Oli</span>
            <span class="metric-value" :class="getGantiOliClass(item)">
              {{ Math.floor(item.gantiOli || item.ganti_oli) }} / <strong>{{ item.gantiOliCycles }}</strong>
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Overhaul</span>
            <span class="metric-value" :class="getOverhaulClass(item)">
              {{ Math.floor(item.jamoperasi) }} / <strong>{{ item.overhaulCycles }}</strong>
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Operasi</span>
            <span class="metric-value" :class="getOperasiClass(item)">
            {{ operasiValue(item) }} / <strong>{{ operasiTarget(item) }}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { convertTime } from '../utils/date.js'
import { gantiOliHours } from '../data/static.js'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Computed data date
const dataDate = computed(() => {
  if (props.data.length > 0 && props.data[0].waktu) {
    return convertTime(props.data[0].waktu, 1)
  }
  return 'Loading...'
})

// Operasi calculations
const operasiValue = (item) => {
  return Math.floor((item.jamoperasi % 3000) % item.gantiOliCycles)
}

const operasiTarget = (item) => {
  return gantiOliHours((item.jamoperasi % 3000) % item.gantiOliCycles, item.unit)
}

// PM display values
const pmTimeToGo = (item) => {
  const target = operasiTarget(item)
  const current = operasiValue(item)
  return target ? target - current : 0
}

const pmTitle = (item) => {
  return item.pm?.title?.replace(/\s#\d+$/, '') || 'N/A'
}

// CSS classes for status colors
const getOperasiClass = (item) => {
  const val = operasiValue(item)
  const cycle = item.gantiOliCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.9 * cycle && cycle === 250) return 'table-status-warning'
  if (val >= 0.95 * cycle && cycle === 500) return 'table-status-warning'
  return ''
}

const getGantiOliClass = (item) => {
  const val = item.gantiOli || item.ganti_oli || 0
  const cycle = item.gantiOliCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.9 * cycle && cycle === 250) return 'table-status-warning'
  if (val >= 0.95 * cycle && cycle === 500) return 'table-status-warning'
  return ''
}

const getOverhaulClass = (item) => {
  const val = item.jamoperasi
  const cycle = item.overhaulCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.75 * cycle) return 'table-status-warning'
  return ''
}

// Save PM data to localStorage
const savePmToLocalStorage = (item) => {
  if (!item?.pm) return
  
  const eventData = {
    id: item.pm.id,
    mesin: item.mesin,
    unit: item.unit,
    pm: pmTitle(item),
    gantiOli: item.gantiOli || item.ganti_oli,
    gantiOliCycles: item.gantiOliCycles,
    overhaul: item.jamoperasi,
    overhaulCycles: item.overhaulCycles,
    operasi: operasiValue(item),
    tanggalPM: item.pm.start,
    timeToGo: item.pm.extendedProps?.daysFromToday,
    targetHours: item.pm.extendedProps?.targetHours,
    currentHours: item.pm.extendedProps?.currentHours
  }
  
  localStorage.setItem('selectedEvent', JSON.stringify(eventData))
}
</script>

<style scoped>
/* Force Center Alignment */
.table th, .table td {
  text-align: center;
  vertical-align: middle;
}

.table th {
  font-weight: 600;
  white-space: nowrap;
}

/* Mobile Card Styles */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mobile-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
  border: 1px solid var(--gray-100);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-100);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
}

.metric-row:last-child {
  margin-bottom: 0;
}

.metric-label {
  color: var(--gray-600);
}

.metric-value {
  font-family: monospace;
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 4px;
}
/* Responsive Visibility - Component Level Override */
.desktop-only {
  display: none !important;
}

.mobile-only {
  display: block !important;
}

@media (min-width: 640px) {
  .desktop-only {
    display: block !important;
  }
  
  .mobile-only {
    display: none !important;
  }
}
</style>
