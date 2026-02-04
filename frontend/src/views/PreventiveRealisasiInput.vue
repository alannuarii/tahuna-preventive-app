<template>
  <div class="animate-fade-in">
    <div class="flex justify-between items-center mb-6">
      <h1 class="home-title m-0">{{ isEdit ? 'Edit' : 'Input' }} Realisasi PM</h1>
      
      <router-link to="/preventive/realisasi" class="btn btn-secondary">
        ← Kembali
      </router-link>
    </div>

    <!-- Loading for edit mode -->
    <div v-if="isEdit && loadingData" class="text-center py-8">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="card">
      <div class="card-body">
        <!-- Basic Info Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="form-group">
            <label class="form-label">Tanggal Pelaksanaan <span class="text-danger">*</span></label>
            <input 
              type="date" 
              v-model="form.tanggal_pelaksanaan" 
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Unit/Mesin <span class="text-danger">*</span></label>
            <select 
              v-model="form.unit" 
              class="form-input"
              required
              @change="onUnitChange"
            >
              <option value="">Pilih Unit</option>
              <option v-for="engine in engines" :key="engine.unit" :value="engine.unit">
                Unit {{ engine.unit }} - {{ engine.mesin }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Jenis PM <span class="text-danger">*</span></label>
            <select v-model="form.jenis_pm" class="form-input" required>
              <option value="">Pilih PM</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
              <option value="P5">P5</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-6">
          <label class="form-label">Catatan (Opsional)</label>
          <textarea 
            v-model="form.catatan" 
            class="form-input"
            rows="2"
            placeholder="Catatan tambahan..."
          ></textarea>
        </div>

        <!-- Materials Section -->
        <div class="materials-section">
          <h3 class="section-title">Material yang Digunakan</h3>
          
          <div v-if="!form.unit" class="text-center py-6 text-muted">
            <p>Pilih unit terlebih dahulu untuk melihat daftar material</p>
          </div>

          <div v-else-if="loadingMaterials" class="text-center py-6">
            <div class="spinner"></div>
            <p class="mt-2 text-muted">Memuat material...</p>
          </div>

          <div v-else-if="materials.length === 0" class="text-center py-6 text-muted">
            <p>Tidak ada material untuk unit ini</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-materials">
              <thead>
                <tr>
                  <th>Material</th>
                  <th style="width: 80px;">Cycle</th>
                  <th style="width: 120px;">Jumlah Standar</th>
                  <th style="width: 150px;">Jumlah Realisasi</th>
                  <th style="width: 80px;">Satuan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(material, index) in materials" :key="index">
                  <td>{{ material.nama }}</td>
                  <td>
                    <span class="badge" :class="getCycleBadgeClass(material.cycle)">
                      {{ material.cycle }}
                    </span>
                  </td>
                  <td class="text-center">{{ material.jumlah }}</td>
                  <td>
                    <input 
                      type="number" 
                      v-model.number="material.jumlah_realisasi"
                      class="form-input form-input-sm text-center"
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </td>
                  <td>{{ material.satuan }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-top">
          <router-link to="/preventive/realisasi" class="btn btn-secondary">
            Batal
          </router-link>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { engines } from '../data/static'
import { api } from '../services/api'

const route = useRoute()
const router = useRouter()

// Check if edit mode
const isEdit = computed(() => !!route.query.edit)
const editId = computed(() => route.query.edit)

const form = reactive({
  tanggal_pelaksanaan: '',
  unit: '',
  jenis_pm: '',
  catatan: ''
})

const materials = ref([])
const loadingMaterials = ref(false)
const loadingData = ref(false)
const submitting = ref(false)

// Load existing data for edit mode
onMounted(async () => {
  if (isEdit.value && editId.value) {
    loadingData.value = true
    try {
      const data = await api.getRealizationDetail(editId.value)
      
      // Format date for input
      const date = new Date(data.tanggal_pelaksanaan)
      form.tanggal_pelaksanaan = date.toISOString().split('T')[0]
      form.unit = data.unit
      form.jenis_pm = data.jenis_pm
      form.catatan = data.catatan || ''
      
      // Load materials for this unit and populate realisasi
      await loadMaterials()
      
      // Set saved realization values
      if (data.materials && data.materials.length > 0) {
        for (const savedMat of data.materials) {
          const material = materials.value.find(m => m.nama === savedMat.nama_material)
          if (material) {
            material.jumlah_realisasi = savedMat.jumlah_realisasi
          }
        }
      }
    } catch (error) {
      console.error('Error loading realization:', error)
      alert('Gagal memuat data')
      router.push('/preventive/realisasi')
    } finally {
      loadingData.value = false
    }
  }
})

const onUnitChange = async () => {
  if (form.unit) {
    await loadMaterials()
  } else {
    materials.value = []
  }
}

const loadMaterials = async () => {
  if (!form.unit) return
  
  loadingMaterials.value = true
  try {
    const response = await api.getMaterials(form.unit)
    materials.value = response.materials.map(m => ({
      ...m,
      jumlah_realisasi: 0
    }))
  } catch (error) {
    console.error('Error loading materials:', error)
    materials.value = []
  } finally {
    loadingMaterials.value = false
  }
}

const getCycleBadgeClass = (cycle) => {
  const classes = {
    'P1': 'badge-info',
    'P2': 'badge-success',
    'P3': 'badge-warning',
    'P4': 'badge-danger',
    'P5': 'badge-primary'
  }
  return classes[cycle] || 'badge-secondary'
}

const handleSubmit = async () => {
  // Validate
  if (!form.tanggal_pelaksanaan || !form.unit || !form.jenis_pm) {
    alert('Mohon lengkapi semua field yang wajib diisi')
    return
  }

  // Prepare materials data (only include materials with realisasi > 0)
  const materialsData = materials.value
    .filter(m => m.jumlah_realisasi > 0)
    .map(m => ({
      nama_material: m.nama,
      jumlah_standar: m.jumlah,
      jumlah_realisasi: m.jumlah_realisasi,
      satuan: m.satuan,
      cycle: m.cycle
    }))

  const payload = {
    tanggal_pelaksanaan: form.tanggal_pelaksanaan,
    unit: parseInt(form.unit),
    jenis_pm: form.jenis_pm,
    catatan: form.catatan || null,
    materials: materialsData
  }

  submitting.value = true
  try {
    await api.saveRealization(payload, isEdit.value ? editId.value : null)
    router.push('/preventive/realisasi')
  } catch (error) {
    console.error('Error saving:', error)
    alert('Gagal menyimpan data')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--primary-500);
}

.materials-section {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.table-materials {
  background: white;
}

.table-materials th {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.border-top {
  border-top: 1px solid var(--gray-200);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: var(--radius-md);
}

.badge-info { background: var(--primary-100); color: var(--primary-700); }
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-primary { background: var(--primary-500); color: white; }
.badge-secondary { background: var(--gray-200); color: var(--gray-700); }

.text-danger { color: #dc2626; }

.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }

@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
