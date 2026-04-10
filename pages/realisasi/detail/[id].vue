<template>
  <div class="animate-fade-in">
    <div class="flex justify-between items-center mb-6 mt-2">
      <h1 class="home-title m-0" style="font-size: 1.5rem;">Detail Realisasi PM</h1>
      <NuxtLink to="/realisasi" class="btn btn-secondary">← Kembali</NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="loading-container" style="min-height: 40vh;">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat detail realisasi...</p>
    </div>

    <!-- Data State -->
    <template v-else-if="detail">
      <div class="card mb-4">
        <div class="card-header flex justify-between items-center">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="font-semibold">Informasi Pelaksanaan</span>
          </div>
          <span :class="['badge', getPMBadgeClass(detail.jenis_pm)]">{{ detail.jenis_pm }}</span>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-item">
              <span class="detail-label">Tanggal Pelaksanaan</span>
              <span class="detail-value">{{ formatDate(detail.tanggal_pelaksanaan) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Unit</span>
              <span class="detail-value">Unit {{ detail.unit }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Mesin</span>
              <span class="detail-value">{{ detail.mesin }}</span>
            </div>
            <div class="detail-item full-width" v-if="detail.catatan">
              <span class="detail-label">Catatan</span>
              <span class="detail-value" style="white-space: pre-wrap;">{{ detail.catatan }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-6">
        <div class="card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span class="font-semibold">Material yang Digunakan</span>
        </div>
        
        <div v-if="!detail.materials || detail.materials.length === 0" class="card-body text-center text-muted py-6">
          <p>Tidak ada material terealisasi untuk pemeliharaan ini.</p>
        </div>
        
        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Material</th>
                <th style="width: 80px;" class="text-center">Cycle</th>
                <th class="text-center" style="width: 100px;">Standar</th>
                <th class="text-center" style="width: 100px;">Realisasi</th>
                <th style="width: 100px;">Satuan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mat in detail.materials" :key="mat.id">
                <td class="font-semibold">{{ mat.nama_material }}</td>
                <td class="text-center"><span :class="['badge badge-sm', getPMBadgeClass(mat.cycle)]">{{ mat.cycle }}</span></td>
                <td class="text-center">{{ mat.jumlah_standar }}</td>
                <td class="text-center font-bold" style="color: var(--primary-400);">{{ mat.jumlah_realisasi }}</td>
                <td>{{ mat.satuan }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
        <button class="btn btn-danger" @click="showDeleteModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          Hapus Data
        </button>
        <NuxtLink :to="`/realisasi/input?edit=${detail.id}`" class="btn btn-primary" style="background: var(--primary-600);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit Realisasi
        </NuxtLink>
      </div>
      
    </template>
    
    <!-- Not Found State -->
    <div v-else class="card">
      <div class="card-body text-center py-8">
        <p class="text-muted text-lg mb-4">Data tidak ditemukan</p>
        <NuxtLink to="/realisasi" class="btn btn-secondary">Kembali</NuxtLink>
      </div>
    </div>

    <!-- Delete Feedback Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Konfirmasi Hapus</h3>
        </div>
        <div class="modal-body">
          <p>Apakah Anda yakin ingin menghapus realisasi ini?</p>
          <p class="text-muted text-sm mt-2">
            Unit {{ detail?.unit }} - {{ detail?.jenis_pm }} 
            ({{ formatDate(detail?.tanggal_pelaksanaan) }})
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
const route = useRoute()
const router = useRouter()
const detailId = route.params.id

const detail = ref<any>(null)
const pending = ref(true)
const showDeleteModal = ref(false)
const deleting = ref(false)

const loadDetail = async () => {
  pending.value = true
  try {
    const res = await fetch(`/api/pm/realizations/${detailId}`)
    if (res.ok) {
      detail.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load realization detail', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  if (detailId) loadDetail()
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getPMBadgeClass = (pm: string) => {
  const classes: Record<string, string> = { P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary' }
  return classes[pm] || 'badge-secondary'
}

const deleteRealization = async () => {
  deleting.value = true
  try {
    const res = await fetch(`/api/pm/realizations/${detailId}`, { method: 'DELETE' })
    if (res.ok) {
      showDeleteModal.value = false
      router.push('/realisasi')
    } else {
      alert('Gagal menghapus data')
    }
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.full-width { grid-column: 1 / -1; }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-label { font-size: 0.75rem; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }
.detail-value { font-size: var(--font-size-base); color: var(--gray-800); font-weight: 500; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
.modal-header { padding: var(--space-4); border-bottom: 1px solid var(--glass-border); }
.modal-body { padding: var(--space-4); }
.modal-footer { padding: var(--space-4); border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: var(--space-3); }
.modal-title { font-size: var(--font-size-lg); font-weight: 600; margin: 0; color: var(--gray-800); }
</style>
