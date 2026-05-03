<template>
  <div class="engine-status">
    <div class="card">
      <div class="card-body">
        <h2 class="text-xl font-bold mb-4">Status Mesin Terkini</h2>
        
        <div v-if="pending" class="loading-container">
          <div class="spinner spinner-lg"></div>
          <p class="mt-4 text-muted">Memuat data...</p>
        </div>

        <div v-else>
          <!-- Desktop Table View -->
          <div class="desktop-table-view">
            <div class="table-wrapper">
              <table class="table table-mobile-optimized">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Status Saat Ini</th>
                  <th>Mulai</th>
                  <th>Estimasi Selesai</th>
                  <th>Catatan</th>
                  <th class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="unit in allUnits" :key="unit">
                  <td class="font-medium whitespace-nowrap">Unit {{ unit }}</td>
                  <td>
                    <span :class="['badge', getStatusBadgeClass(getCurrentStatus(unit)?.status)]">
                      {{ getCurrentStatus(unit)?.status || 'Normal' }}
                    </span>
                  </td>
                  <td>{{ formatDate(getCurrentStatus(unit)?.start_date) || '-' }}</td>
                  <td>{{ formatDate(getCurrentStatus(unit)?.end_date) || 'Seterusnya' }}</td>
                  <td class="truncate" style="max-width: 150px;" :title="getCurrentStatus(unit)?.notes || ''">
                    {{ getCurrentStatus(unit)?.notes || '-' }}
                  </td>
                  <td class="text-center">
                    <button @click="openEditModal(unit)" class="btn btn-sm btn-secondary" style="border-radius: 99px;">
                      Ubah Status
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>

          <!-- Mobile Card View -->
          <div class="mobile-cards-view">
            <div v-for="unit in allUnits" :key="`mob-${unit}`" class="mobile-card">
              <div class="mobile-card-header">
                <span class="font-bold text-lg">Unit {{ unit }}</span>
                <span :class="['badge', getStatusBadgeClass(getCurrentStatus(unit)?.status)]">
                  {{ getCurrentStatus(unit)?.status || 'Normal' }}
                </span>
              </div>
              <div class="mobile-card-body">
                <div class="metric-row">
                  <span class="metric-label">Mulai</span>
                  <span class="metric-value font-medium">{{ formatDate(getCurrentStatus(unit)?.start_date) || '-' }}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Estimasi Selesai</span>
                  <span class="metric-value font-medium">{{ formatDate(getCurrentStatus(unit)?.end_date) || 'Seterusnya' }}</span>
                </div>
                <div class="metric-row" v-if="getCurrentStatus(unit)?.notes">
                  <span class="metric-label">Catatan</span>
                  <span class="metric-value text-right" style="max-width: 60%; font-size: 0.8rem; line-height: 1.2;">{{ getCurrentStatus(unit)?.notes }}</span>
                </div>
                <div class="mt-4 pt-3 flex justify-end" style="border-top: 1px solid var(--glass-border);">
                  <button @click="openEditModal(unit)" class="btn btn-sm btn-secondary" style="border-radius: 99px; padding: 0.4rem 1rem;">
                    Ubah Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="modal-backdrop" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Ubah Status Unit {{ editForm.unit }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveStatus">
            <div class="form-group mb-4">
              <label class="form-label">Status</label>
              <select v-model="editForm.status" class="form-input" required>
                <option value="Normal">Normal</option>
                <option value="Gangguan">Gangguan</option>
                <option value="Pemeliharaan">Pemeliharaan (Overhaul, dll)</option>
              </select>
            </div>
            
            <template v-if="editForm.status !== 'Normal'">
              <div class="form-group mb-4">
                <label class="form-label">Tanggal Mulai</label>
                <input type="date" v-model="editForm.start_date" class="form-input" required />
              </div>
              <div class="form-group mb-4">
                <label class="form-label">Estimasi Selesai (Kosongkan jika belum pasti)</label>
                <input type="date" v-model="editForm.end_date" class="form-input" />
              </div>
              <div class="form-group mb-4">
                <label class="form-label">Catatan</label>
                <textarea v-model="editForm.notes" class="form-input" rows="3"></textarea>
              </div>
            </template>

            <div class="flex justify-end gap-2 mt-6">
              <button type="button" class="btn btn-secondary" @click="showModal = false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Menyimpan...' : 'Simpan Status' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const allUnits = [1, 4, 5, 6, 7, 8, 9]
const statuses = ref<any[]>([])
const pending = ref(false)
const saving = ref(false)
const showModal = ref(false)

const editForm = reactive({
  id: null as number | null,
  unit: 1,
  status: 'Normal',
  start_date: '',
  end_date: '',
  notes: ''
})

const fetchStatuses = async () => {
  pending.value = true
  try {
    const res = await fetch('/api/pm/status')
    if (res.ok) {
      statuses.value = await res.json()
    }
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchStatuses()
})

const getCurrentStatus = (unit: number) => {
  const statusRecord = statuses.value.find(s => s.unit === unit)
  if (!statusRecord) return { status: 'Normal' }
  
  // If end_date is in the past, it's back to Normal
  if (statusRecord.end_date && new Date(statusRecord.end_date) < new Date(new Date().setHours(0,0,0,0))) {
    return { status: 'Normal' }
  }
  return statusRecord
}

const getStatusBadgeClass = (status: string) => {
  if (status === 'Gangguan') return 'badge-danger'
  if (status === 'Pemeliharaan') return 'badge-warning'
  return 'badge-success'
}

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const openEditModal = (unit: number) => {
  const current = getCurrentStatus(unit)
  editForm.unit = unit
  editForm.status = current.status || 'Normal'
  editForm.id = current.id || null
  
  if (current.status !== 'Normal') {
    editForm.start_date = current.start_date ? new Date(current.start_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    editForm.end_date = current.end_date ? new Date(current.end_date).toISOString().slice(0, 10) : ''
    editForm.notes = current.notes || ''
  } else {
    editForm.start_date = new Date().toISOString().slice(0, 10)
    editForm.end_date = ''
    editForm.notes = ''
  }
  
  showModal.value = true
}

const saveStatus = async () => {
  saving.value = true
  try {
    const res = await fetch('/api/pm/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      showModal.value = false
      await fetchStatuses()
      // Reload page or inform parent to reload schedule
      window.location.reload()
    } else {
      alert('Gagal menyimpan status')
    }
  } catch (err) {
    console.error(err)
    alert('Terjadi kesalahan')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal-content {
  background: var(--bg-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl), var(--shadow-glow-primary);
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--glass-border);
}
.modal-title {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--gray-900);
  font-weight: 700;
}
.modal-close {
  background: var(--gray-100);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
  transition: all var(--transition-fast);
}
.modal-close:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.mobile-cards-view {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .mobile-cards-view {
    display: none !important;
  }
}

.desktop-table-view {
  display: none !important;
}

@media (min-width: 768px) {
  .desktop-table-view {
    display: block !important;
  }
}
</style>
