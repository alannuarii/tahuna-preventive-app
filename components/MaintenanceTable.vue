<template>
  <div class="maintenance-view">
    <div class="mb-4 text-center text-xs text-muted italic">
      Data tanggal {{ dataDate }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in data" :key="item.unit" class="mobile-card">
        <div class="mobile-card-header">
          <span class="font-bold text-lg">Unit {{ item.unit }}</span>
          <NuxtLink 
            v-if="item.pm && item.pm.id"
            :to="`/detail/${item.pm.id}`" 
            class="badge badge-primary"
            style="transition: opacity 0.2s;"
            @click="savePmToLocalStorage(item)"
          >
            {{ pmTimeToGo(item) }}h → {{ pmTitle(item) }}
          </NuxtLink>
        </div>

        <div class="mobile-card-body">
          <div class="metric-row">
            <span class="metric-label">Operasi (Jam)</span>
            <span :class="['metric-value', getOperasiClass(item)]">
              {{ operasiValue(item) }} / <span class="font-semibold">{{ operasiTarget(item) }}</span>
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">Ganti Oli (Jam)</span>
            <span :class="['metric-value', getGantiOliClass(item)]">
              {{ Math.floor(item.ganti_oli) }} / <span class="font-semibold">{{ item.gantiOliCycles }}</span>
            </span>
          </div>
          
          <div class="metric-row">
            <span class="metric-label">Overhaul (Jam)</span>
            <span :class="['metric-value', getOverhaulClass(item)]">
              {{ Math.floor(item.jamoperasi) }} / <span class="font-semibold">{{ item.overhaulCycles }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { convertTime } from '~/utils/date'
import { gantiOliHours } from '~/utils/pmCycles'

const props = defineProps<{
  data: any[]
}>()

const dataDate = computed(() => {
  if (props.data.length > 0 && props.data[0].waktu) {
    return convertTime(props.data[0].waktu, 1)
  }
  return 'Loading...'
})

const operasiValue = (item: any) => {
  return Math.floor((item.jamoperasi % 3000) % item.gantiOliCycles)
}

const operasiTarget = (item: any) => {
  return gantiOliHours((item.jamoperasi % 3000) % item.gantiOliCycles, item.unit)
}

const pmTimeToGo = (item: any) => {
  const target: any = operasiTarget(item)
  const current = operasiValue(item)
  return target ? target - current : 0
}

const pmTitle = (item: any) => {
  return item.pm?.title?.replace(/\s#\d+$/, '') || 'N/A'
}

const getOperasiClass = (item: any) => {
  const val = operasiValue(item)
  const cycle = item.gantiOliCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.9 * cycle && cycle === 250) return 'table-status-warning'
  if (val >= 0.95 * cycle && cycle === 500) return 'table-status-warning'
  return ''
}

const getGantiOliClass = (item: any) => {
  const val = item.ganti_oli || 0
  const cycle = item.gantiOliCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.9 * cycle && cycle === 250) return 'table-status-warning'
  if (val >= 0.95 * cycle && cycle === 500) return 'table-status-warning'
  return ''
}

const getOverhaulClass = (item: any) => {
  const val = item.jamoperasi
  const cycle = item.overhaulCycles
  if (val > cycle) return 'table-status-danger'
  if (val >= 0.75 * cycle) return 'table-status-warning'
  return ''
}

const savePmToLocalStorage = (item: any) => {
  if (!item?.pm) return
  const eventData = {
    id: item.pm.id,
    mesin: item.mesin,
    unit: item.unit,
    pm: pmTitle(item),
    gantiOli: item.ganti_oli,
    gantiOliCycles: item.gantiOliCycles,
    overhaul: item.jamoperasi,
    overhaulCycles: item.overhaulCycles,
    operasi: operasiValue(item),
    tanggalPM: item.pm.start,
    timeToGo: item.pm.extendedProps?.daysFromToday,
    targetHours: item.pm.extendedProps?.targetHours,
    currentHours: item.pm.extendedProps?.currentHours
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('selectedEvent', JSON.stringify(eventData))
  }
}
</script>

<style scoped>
.maintenance-view .table th,
.maintenance-view .table td {
  text-align: center;
  vertical-align: middle;
}

.maintenance-view .table th {
  font-weight: 600;
  white-space: nowrap;
}

.mobile-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  transition: all var(--transition-base);
}

.mobile-card:active {
  transform: scale(0.98);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--glass-border);
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
  color: var(--gray-500);
  font-size: 0.8rem;
}

.metric-value {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  color: var(--gray-800);
}
</style>
