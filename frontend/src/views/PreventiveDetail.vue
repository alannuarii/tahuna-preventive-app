<template>
  <div class="animate-fade-in">
    <div class="flex items-center gap-4 mb-6">
      <button class="btn btn-ghost btn-icon" @click="goBack">
        ←
      </button>
      <h1 class="home-title m-0">Detail PM {{ eventData?.pm }}</h1>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <DataCard>
        <template #header>
          ℹ️ Informasi Mesin
        </template>
        
        <div class="flex flex-col gap-3">
          <div class="flex justify-between">
            <span class="text-muted">Unit</span>
            <span class="font-semibold">Unit {{ eventData?.unit }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Mesin</span>
            <span class="font-semibold">{{ materialsData?.mesin || eventData?.mesin || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Jenis PM</span>
            <span class="badge badge-primary">{{ eventData?.pm }}</span>
          </div>
        </div>
      </DataCard>
      
      <DataCard>
        <template #header>
          ⏱️ Jam Operasi
        </template>
        
        <div class="flex flex-col gap-3">
          <div class="flex justify-between">
            <span class="text-muted">Current</span>
            <span class="font-semibold">{{ formatNumber(eventData?.currentHours) }} jam</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Target</span>
            <span class="font-semibold">{{ formatNumber(eventData?.targetHours) }} jam</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Tanggal PM</span>
            <span class="font-semibold">{{ eventData?.tanggalPM }}</span>
          </div>
        </div>
      </DataCard>
    </div>

    <!-- Materials Section -->
    <DataCard>
      <template #header>
        🛠️ Material yang Dibutuhkan
        <span v-if="materialsData?.applicableCycles" class="badge-cycles">
          {{ materialsData.applicableCycles.join(' + ') }}
        </span>
      </template>
      
      <div v-if="materialsPending" class="loading-container" style="min-height: 200px;">
        <div class="spinner"></div>
        <p class="mt-2 text-muted">Memuat material...</p>
      </div>

      <div v-else-if="!materialsData?.materials?.length" class="text-center py-4">
        <p class="text-muted">Tidak ada data material untuk unit ini</p>
      </div>

      <div v-else class="materials-table-container">
        <div class="table-responsive">
          <table class="materials-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">No</th>
              <th>Nama Material</th>
              <th class="text-center" style="width: 100px;">Jumlah</th>
              <th class="text-center" style="width: 100px;">Satuan</th>
              <th class="text-center" style="width: 80px;">Siklus</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in materialsData.materials" :key="index" 
                :class="{ 'highlight-row': item.isCurrentCycle }">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ item.nama }}</td>
              <td class="text-center font-semibold">{{ item.jumlah }}</td>
              <td class="text-center">{{ item.satuan }}</td>
              <td class="text-center">
                <span :class="['cycle-badge', `cycle-${item.cycle.toLowerCase()}`]">
                  {{ item.cycle }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div v-if="materialsData?.materials?.length" class="materials-legend">
        <div class="legend-item">
          <span class="legend-dot current"></span>
          <span class="text-muted text-sm">Material siklus {{ eventData?.pm }} (saat ini)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot inherited"></span>
          <span class="text-muted text-sm">Material dari siklus sebelumnya</span>
        </div>
      </div>
    </DataCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'
import DataCard from '../components/DataCard.vue'

const router = useRouter()
const eventData = ref(null)
const materialsData = ref(null)
const materialsPending = ref(false)

onMounted(async () => {
  // Get data from localStorage
  const stored = localStorage.getItem('selectedEvent')
  if (stored) {
    eventData.value = JSON.parse(stored)
    // Fetch materials
    materialsPending.value = true
    try {
        materialsData.value = await api.getMaterials(eventData.value.unit)
    } finally {
        materialsPending.value = false
    }
  }
})

const formatNumber = (num) => {
  if (!num) return '-'
  return Math.round(num).toLocaleString('id-ID')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.badge-cycles {
  margin-left: 12px;
  background: var(--primary-100);
  color: var(--primary-500);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.materials-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}

.materials-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.materials-table th {
  background: var(--gray-50);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-500);
  border-bottom: 2px solid var(--gray-200);
}

.materials-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-200);
}

.materials-table tbody tr:last-child td {
  border-bottom: none;
}

.materials-table tbody tr:hover {
  background: var(--gray-50);
}

.highlight-row {
  background: rgba(59, 130, 246, 0.08) !important;
}

.highlight-row:hover {
  background: rgba(59, 130, 246, 0.12) !important;
}

.cycle-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.cycle-p1 { background: #dbeafe; color: #1d4ed8; }
.cycle-p2 { background: #d1fae5; color: #047857; }
.cycle-p3 { background: #fef3c7; color: #b45309; }
.cycle-p4 { background: #fce7f3; color: #be185d; }
.cycle-p5 { background: #ede9fe; color: #6d28d9; }

.materials-legend {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--gray-200);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.current {
  background: rgba(59, 130, 246, 0.5);
  border: 2px solid #3b82f6;
}

.legend-dot.inherited {
  background: #e5e7eb;
  border: 2px solid #9ca3af;
}

.text-sm {
  font-size: 0.85rem;
}
</style>
