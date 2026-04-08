<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <h1 class="home-title m-0">Realisasi Preventive Maintenance</h1>
      
      <div class="page-header-actions flex gap-3 items-center">
        <SegmentedControl
          :options="viewOptions"
          v-model="viewMode"
        />
        
        <NuxtLink to="/realisasi/input" class="btn btn-primary" style="flex-shrink: 0; padding-left: 0.75rem; padding-right: 0.75rem; display: flex; align-items: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="hidden sm:inline" style="margin-left: 6px;">Tambah</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="viewMode === 'table'" class="card mb-4">
      <div class="card-body">
        <div class="form-group mb-4">
          <label class="form-label">Filter Unit</label>
          <div class="flex flex-wrap gap-4 items-center">
            <label class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :checked="filters.unit.length === 0" @change="filters.unit = []" class="form-checkbox" />
              <span class="text-sm font-medium">Semua</span>
            </label>
            <label v-for="engine in engines" :key="engine.unit" class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :value="engine.unit" v-model="filters.unit" class="form-checkbox" />
              <span class="text-sm">Unit {{ engine.unit }}</span>
            </label>
          </div>
        </div>

        <div class="realisasi-filter-grid">
          <div class="form-group mb-0">
            <label class="form-label">Dari Tanggal</label>
            <input type="date" v-model="filters.start" class="form-input form-input-sm" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Sampai Tanggal</label>
            <input type="date" v-model="filters.end" class="form-input form-input-sm" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Urutkan</label>
            <select v-model="filters.sort" class="form-input form-input-sm">
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </div>
          <div class="form-group mb-0 realisasi-filter-actions">
            <label class="form-label" style="opacity: 0; display: none;">&nbsp;</label>
            <div class="flex gap-2">
              <button class="btn btn-primary btn-sm flex-1" @click="applyFilters">Filter</button>
              <button class="btn btn-secondary btn-sm flex-1" @click="resetFilters">Reset</button>
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

    <!-- Empty -->
    <div v-if="!pending && realizations.length === 0" class="card">
      <div class="card-body text-center py-8">
        <p class="text-muted text-lg mb-4">Belum ada data realisasi</p>
        <NuxtLink to="/realisasi/input" class="btn btn-primary">+ Tambah Realisasi Pertama</NuxtLink>
      </div>
    </div>

    <!-- Calendar View -->
    <PMCalendar v-if="!pending && realizations.length > 0 && viewMode === 'calendar'" :events="calendarEvents" @event-click="handleEventClick" />

    <!-- Table View -->
    <template v-if="!pending && realizations.length > 0 && viewMode === 'table'">
      <div class="card">
        <div class="table-wrapper">
          <table class="table table-mobile-optimized">
            <thead>
              <tr>
                <th style="min-width: 90px;">Tanggal</th>
                <th style="min-width: 70px;">Unit</th>
                <th style="min-width: 100px;" class="hidden sm:table-cell">Mesin</th>
                <th>Jenis PM</th>
                <th style="min-width: 120px;" class="hidden sm:table-cell">Catatan</th>
                <th style="min-width: 80px;" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in realizations" :key="item.id">
                <td class="whitespace-nowrap">{{ formatDate(item.tanggal_pelaksanaan) }}</td>
                <td class="font-semibold">Unit {{ item.unit }}</td>
                <td class="text-xs hidden sm:table-cell">{{ item.mesin }}</td>
                <td>
                  <span :class="['badge', getPMBadgeClass(item.jenis_pm)]">{{ item.jenis_pm }}</span>
                </td>
                <td class="text-xs text-muted hidden sm:table-cell truncate" style="max-width: 150px;" :title="item.catatan">{{ item.catatan || '-' }}</td>
                <td>
                  <div class="flex gap-1 justify-end">
                    <NuxtLink :to="`/realisasi/input?edit=${item.id}`" class="btn btn-sm btn-secondary btn-icon-sm" title="Edit">✏️</NuxtLink>
                    <button class="btn btn-sm btn-danger btn-icon-sm" @click="confirmDelete(item)" title="Hapus">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <CommonPagination 
        v-if="responseData?.meta?.totalPages > 1"
        :current-page="responseData.meta.page"
        :total-pages="responseData.meta.totalPages"
        :total="responseData.meta.total"
        @change="changePage"
      />
    </template>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Detail Realisasi</h3>
          <button class="modal-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal-body">
          <template v-if="selectedDetail">
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
                  <span :class="['badge', getPMBadgeClass(selectedDetail.jenis_pm)]">{{ selectedDetail.jenis_pm }}</span>
                </span>
              </div>
              <div v-if="selectedDetail.catatan" class="detail-item full-width">
                <span class="detail-label">Catatan</span>
                <span class="detail-value">{{ selectedDetail.catatan }}</span>
              </div>
            </div>

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
                      <td><span :class="['badge badge-sm', getPMBadgeClass(mat.cycle)]">{{ mat.cycle }}</span></td>
                      <td class="text-right">{{ mat.jumlah_standar }}</td>
                      <td class="text-right font-bold">{{ mat.jumlah_realisasi }}</td>
                      <td>{{ mat.satuan }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDetailModal = false">Tutup</button>
          <NuxtLink :to="`/realisasi/input?edit=${selectedDetail?.id}`" class="btn btn-primary">✏️ Edit</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
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
  </div>
</template>

<script setup lang="ts">
import { engines } from '~/utils/pmCycles'

const viewMode = ref('table')
const filters = reactive({ start: '', end: '', unit: [] as number[], sort: 'desc', page: 1, limit: 10 })
const responseData = ref<any>(null)
const calendarData = ref<any>(null)
const pending = ref(false)

const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedDetail = ref<any>(null)
const itemToDelete = ref<any>(null)
const deleting = ref(false)

const refresh = async () => {
  pending.value = true
  try {
    const q = new URLSearchParams()
    if (filters.start) q.set('start', filters.start)
    if (filters.end) q.set('end', filters.end)
    if (filters.unit && filters.unit.length > 0) q.set('unit', filters.unit.join(','))
    if (filters.sort) q.set('sort', filters.sort)
    q.set('page', filters.page.toString())
    q.set('limit', filters.limit.toString())
    
    const res = await fetch(`/api/pm/realizations?${q.toString()}`)
    if (res.ok) responseData.value = await res.json()
  } finally {
    pending.value = false
  }
}

const loadCalendarData = async () => {
  const q = new URLSearchParams()
  if (filters.start) q.set('start', filters.start)
  if (filters.end) q.set('end', filters.end)
  if (filters.unit && filters.unit.length > 0) q.set('unit', filters.unit.join(','))
  q.set('limit', '0')
  const res = await fetch(`/api/pm/realizations?${q.toString()}`)
  if (res.ok) calendarData.value = await res.json()
}

onMounted(() => {
  refresh()
})

watch(viewMode, (val) => {
  if (val === 'calendar' && !calendarData.value) {
    loadCalendarData()
  }
})

const realizations = computed(() => responseData.value?.data || [])

const changePage = (newPage: number) => {
  filters.page = newPage
  refresh()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const calendarEvents = computed(() => {
  const sourceData = calendarData.value?.data || []
  return sourceData.map((item: any) => ({
    id: item.id,
    title: `${item.jenis_pm} Unit ${item.unit}`,
    start: new Date(item.tanggal_pelaksanaan).toISOString().slice(0, 10),
    extendedProps: {
      unit: item.unit,
      mesin: item.mesin,
      jenis_pm: item.jenis_pm,
      catatan: item.catatan
    }
  }))
})

const handleEventClick = async (event: any) => {
  try {
    const res = await fetch(`/api/pm/realizations/${event.id}`)
    if (res.ok) {
      selectedDetail.value = await res.json()
      showDetailModal.value = true
    } else {
      alert('Gagal memuat detail realisasi')
    }
  } catch {
    alert('Gagal memuat detail realisasi')
  }
}

const applyFilters = () => {
  filters.page = 1
  refresh()
}

const resetFilters = () => {
  filters.start = ''
  filters.end = ''
  filters.unit = []
  filters.sort = 'desc'
  filters.page = 1
  refresh()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

const getPMBadgeClass = (pm: string) => {
  const classes: Record<string, string> = { P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary' }
  return classes[pm] || 'badge-secondary'
}

const confirmDelete = (item: any) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const deleteRealization = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    const res = await fetch(`/api/pm/realizations/${itemToDelete.value.id}`, { method: 'DELETE' })
    if (res.ok) {
      showDeleteModal.value = false
      itemToDelete.value = null
      refresh()
    } else {
      alert('Gagal menghapus data')
    }
  } finally {
    deleting.value = false
  }
}

const listIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const viewOptions = [
  { value: 'table', label: 'Data', icon: listIcon },
  { value: 'calendar', label: 'Kalender', icon: calendarIcon }
]
</script>

<style>
.realisasi-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; align-items: end; }
.realisasi-filter-actions { display: flex; flex-direction: column; justify-content: flex-end; }
@media (min-width: 768px) {
  .realisasi-filter-grid { grid-template-columns: 1fr 1fr 1fr auto; }
  .realisasi-filter-actions .form-label { display: block !important; }
}

.btn-icon-sm { width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; border-radius: var(--radius-md); }
@media (min-width: 640px) { .btn-icon-sm { width: 32px; height: 32px; } }

.table-mobile-optimized th, .table-mobile-optimized td { padding: 0.5rem; font-size: 0.775rem; }
@media (min-width: 640px) { .table-mobile-optimized th, .table-mobile-optimized td { padding: var(--space-3) var(--space-4); font-size: var(--font-size-sm); } }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.whitespace-nowrap { white-space: nowrap; }

.detail-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }
@media (min-width: 640px) { .detail-grid { grid-template-columns: repeat(2, 1fr); } }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-item.full-width { grid-column: span 2; }
.detail-label { font-size: 0.75rem; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: var(--font-size-base); color: var(--gray-800); font-weight: 500; }
.section-subtitle { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); margin-bottom: var(--space-2); }
</style>
