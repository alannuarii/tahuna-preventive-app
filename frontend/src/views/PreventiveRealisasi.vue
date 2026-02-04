<template>
  <div class="animate-fade-in">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="home-title m-0">Realisasi Pemeliharaan</h1>
      
      <div class="flex justify-between w-full md:w-auto gap-4">
        <!-- View Toggle -->
        <div class="view-toggle">
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
        
        <router-link to="/preventive/realisasi/input" class="btn btn-primary btn-icon-only">
          <span class="text-xl font-bold">+</span> <span class="hidden sm:inline ml-2">Realisasi</span>
        </router-link>
      </div>
    </div>

    <!-- Filters (only show in table mode) -->
    <div v-if="viewMode === 'table'" class="card mb-4">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-3 items-end">
          <div class="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
            <div class="form-group mb-0 w-full">
              <label class="form-label">Dari Tanggal</label>
              <input 
                type="date" 
                v-model="filters.start" 
                class="form-input form-input-sm w-full"
              />
            </div>
            <div class="form-group mb-0 w-full">
              <label class="form-label">Sampai Tanggal</label>
              <input 
                type="date" 
                v-model="filters.end" 
                class="form-input form-input-sm w-full"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto flex-1">
             <div class="form-group mb-0 w-full sm:w-auto">
              <label class="form-label">Unit</label>
              <select v-model="filters.unit" class="form-input form-input-sm w-full" style="min-width: 100px;">
                <option value="">Semua</option>
                <option v-for="engine in engines" :key="engine.unit" :value="engine.unit">
                  Unit {{ engine.unit }}
                </option>
              </select>
            </div>
            <div class="form-group mb-0 w-full sm:w-auto flex-1 sm:flex-none">
              <label class="form-label opacity-0 hidden sm:block">Action</label>
              <div class="flex gap-2 h-full items-end">
                <button class="btn btn-primary btn-sm flex-1 sm:flex-none justify-center" @click="applyFilters" style="height: 32px;">
                  Filter
                </button>
                <button class="btn btn-secondary btn-sm flex-1 sm:flex-none justify-center" @click="resetFilters" style="height: 32px;">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading -->
    <div v-if="pending" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!realizations || realizations.length === 0" class="card">
      <div class="card-body text-center py-8">
        <p class="text-muted text-lg mb-4">Belum ada data realisasi</p>
        <router-link to="/preventive/realisasi/input" class="btn btn-primary">
          + Tambah Realisasi Pertama
        </router-link>
      </div>
    </div>

    <!-- Calendar View -->
    <template v-else-if="viewMode === 'calendar'">
      <PMCalendar :events="calendarEvents" @event-click="handleEventClick" />
    </template>

    <!-- Table View -->
    <div v-else class="card bg-white shadow-md rounded-xl">
      <!-- Universal Table -->
      <div class="table-wrapper">
        <table class="table table-mobile-optimized">
          <thead>
            <tr>
              <th style="min-width: 90px;">Tanggal</th>
              <th style="min-width: 70px;">Unit</th>
              <th style="min-width: 100px;" class="desktop-only">Mesin</th>
              <th>Jenis PM</th>
              <th style="min-width: 120px;" class="desktop-only">Catatan</th>
              <th style="min-width: 80px;" class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in realizations" :key="item.id">
              <td class="whitespace-nowrap">{{ formatDate(item.tanggal_pelaksanaan) }}</td>
              <td class="font-semibold">Unit {{ item.unit }}</td>
              <td class="text-xs desktop-only">{{ item.mesin }}</td>
              <td>
                <span class="badge" :class="getPMBadgeClass(item.jenis_pm)">
                  {{ item.jenis_pm }}
                </span>
              </td>
              <td class="text-xs text-muted max-w-[150px] truncate desktop-only" title="item.catatan">{{ item.catatan || '-' }}</td>
              <td>
                <div class="flex gap-1 justify-end">
                  <router-link 
                    :to="`/preventive/realisasi/input?edit=${item.id}`" 
                    class="btn btn-sm btn-secondary btn-icon-sm"
                    title="Edit"
                  >
                    ✏️
                  </router-link>
                  <button 
                    class="btn btn-sm btn-danger btn-icon-sm" 
                    @click="confirmDelete(item)"
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
      
      <!-- Pagination -->
      <CommonPagination 
        v-if="pagination.totalPages > 1"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        @change="changePage"
      />
    </div>

    <!-- Detail Modal (from calendar click) -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Detail Realisasi</h3>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="selectedDetail">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Tanggal Pelaksanaan</span>
              <span class="detail-value">{{ formatDate(selectedDetail.tanggal_pelaksanaan) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Unit</span>
              <span class="detail-value">Unit {{ selectedDetail.unit }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Mesin</span>
              <span class="detail-value">{{ selectedDetail.mesin }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Jenis PM</span>
              <span class="detail-value">
                <span class="badge" :class="getPMBadgeClass(selectedDetail.jenis_pm)">
                  {{ selectedDetail.jenis_pm }}
                </span>
              </span>
            </div>
            <div class="detail-item full-width" v-if="selectedDetail.catatan">
              <span class="detail-label">Catatan</span>
              <span class="detail-value">{{ selectedDetail.catatan }}</span>
            </div>
          </div>

          <!-- Materials Table -->
          <div v-if="selectedDetail.materials && selectedDetail.materials.length > 0" class="mt-4">
            <h4 class="section-subtitle">Material yang Digunakan</h4>
            <div class="table-wrapper">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Cycle</th>
                    <th class="text-right">Standar</th>
                    <th class="text-right">Realisasi</th>
                    <th>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mat in selectedDetail.materials" :key="mat.id">
                    <td>{{ mat.nama_material }}</td>
                    <td>
                      <span class="badge badge-sm" :class="getPMBadgeClass(mat.cycle)">
                        {{ mat.cycle }}
                      </span>
                    </td>
                    <td class="text-right">{{ mat.jumlah_standar }}</td>
                    <td class="text-right font-bold">{{ mat.jumlah_realisasi }}</td>
                    <td>{{ mat.satuan }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">Tutup</button>
          <router-link 
            :to="`/preventive/realisasi/input?edit=${selectedDetail?.id}`" 
            class="btn btn-primary"
          >
            ✏️ Edit
          </router-link>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Konfirmasi Hapus</h3>
        </div>
        <div class="modal-body">
          <p>Apakah Anda yakin ingin menghapus realisasi ini?</p>
          <p class="text-muted text-sm mt-2">
            Unit {{ itemToDelete?.unit }} - {{ itemToDelete?.jenis_pm }} 
            ({{ formatDate(itemToDelete?.tanggal_pelaksanaan) }})
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">Batal</button>
          <button class="btn btn-danger" @click="deleteRealization" :disabled="deleting">
            {{ deleting ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { engines } from '../data/static'
import { api } from '../services/api'
import PMCalendar from '../components/PMCalendar.vue'
import CommonPagination from '../components/CommonPagination.vue'

const viewMode = ref('table')

// Pagination state
const filters = reactive({
  start: '',
  end: '',
  unit: '',
  page: 1,
  limit: 10
})

const showDeleteModal = ref(false)
const showDetailModal = ref(false)
const itemToDelete = ref(null)
const selectedDetail = ref(null)
const deleting = ref(false)
const loadingDetail = ref(false)
const pending = ref(false)
const responseData = ref(null)

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
})

const refresh = async () => {
    pending.value = true
    try {
        responseData.value = await api.getRealizations(filters)
        
        // Update pagination
        if (responseData.value?.meta) {
            pagination.page = responseData.value.meta.page
            pagination.limit = responseData.value.meta.limit
            pagination.total = responseData.value.meta.total
            pagination.totalPages = responseData.value.meta.totalPages
        }
    } finally {
        pending.value = false
    }
}

onMounted(() => {
    refresh()
})

const calendarData = ref(null)
const loadCalendarData = async () => {
    // In real app, separate API endpoint for calendar (limit=0)
    calendarData.value = await api.getRealizations({ ...filters, limit: 0 })
}

watch(viewMode, (newVal) => {
    if (newVal === 'calendar') {
        loadCalendarData()
    }
})

// Extract data
const realizations = computed(() => responseData.value?.data || [])

const changePage = (newPage) => {
  filters.page = newPage
  refresh()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Convert realizations to calendar events format
const calendarEvents = computed(() => {
  const sourceData = calendarData.value?.data || []
  if (!sourceData) return []
  
  return sourceData.map(item => {
    const dateStr = new Date(item.tanggal_pelaksanaan).toISOString().slice(0, 10)
    
    return {
      id: item.id,
      title: `${item.jenis_pm} Unit ${item.unit}`,
      start: dateStr,
      extendedProps: {
        unit: item.unit,
        mesin: item.mesin,
        jenis_pm: item.jenis_pm,
        catatan: item.catatan
      }
    }
  })
})

const handleEventClick = async (event) => {
  loadingDetail.value = true
  try {
    const detail = await api.getRealizationDetail(event.id)
    selectedDetail.value = detail
    showDetailModal.value = true
  } catch (error) {
    console.error('Error loading detail:', error)
    alert('Gagal memuat detail realisasi')
  } finally {
    loadingDetail.value = false
  }
}

const applyFilters = async () => {
  filters.page = 1
  refresh()
}

const resetFilters = () => {
  filters.start = ''
  filters.end = ''
  filters.unit = ''
  filters.page = 1
  refresh()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  })
}

const getPMBadgeClass = (pm) => {
  const classes = {
    'P1': 'badge-info',
    'P2': 'badge-success',
    'P3': 'badge-warning',
    'P4': 'badge-danger',
    'P5': 'badge-primary'
  }
  return classes[pm] || 'badge-secondary'
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const deleteRealization = async () => {
  if (!itemToDelete.value) return
  
  deleting.value = true
  try {
    await api.deleteRealization(itemToDelete.value.id)
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
  } catch (error) {
    console.error('Error deleting:', error)
    alert('Gagal menghapus data')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
/* Force Center Alignment for All Tables in this page */
.table th, .table td {
  text-align: center;
  vertical-align: middle;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 2px;
}

.toggle-btn {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: var(--gray-200);
}

.toggle-btn.active {
  background: white;
  box-shadow: var(--shadow-sm);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-md);
}

.badge-sm {
  padding: 0.15rem 0.35rem;
  font-size: 0.65rem;
}

.badge-info { background: var(--primary-100); color: var(--primary-700); }
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-primary { background: var(--primary-500); color: white; }
.badge-secondary { background: var(--gray-200); color: var(--gray-700); }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 400px;
  margin: var(--space-4);
}

.modal-lg {
  max-width: 600px;
}

.modal-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--gray-700);
}

.modal-body {
  padding: var(--space-4);
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: var(--font-size-base);
  color: var(--gray-800);
  font-weight: 500;
}

.section-subtitle {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.table-sm {
  font-size: 0.85rem;
}

.table-sm th, .table-sm td {
  padding: 0.5rem;
}

.text-right { text-align: right; }
.font-bold { font-weight: 600; }

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Mobile Card Styling */
.mobile-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-100);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-100);
}

/* Mobile Table Optimization */
.table-mobile-optimized th,
.table-mobile-optimized td {
  padding: 0.5rem 0.5rem;
  font-size: 0.775rem; /* Smaller font for mobile */
}

/* Ensure buttons are touch-friendly but compact */
.btn-icon-sm {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.whitespace-nowrap {
  white-space: nowrap;
}

/* Visibility Utilities - Default (Hidden on Mobile) */
.desktop-only { display: none !important; }

/* Desktop sizing restoration and visibility */
@media (min-width: 640px) {
  .table-mobile-optimized th,
  .table-mobile-optimized td {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
  }

  .btn-icon-sm {
    width: 32px;
    height: 32px;
  }
  
  /* Show on Desktop */
  .desktop-only { display: table-cell !important; }
}
</style>
