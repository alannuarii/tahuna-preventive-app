<template>
  <div class="animate-fade-in">
    <div class="flex justify-between items-center mb-6">
      <h1 class="home-title m-0">{{ isEdit ? 'Edit' : 'Input' }} Realisasi PM</h1>
      <NuxtLink to="/realisasi" class="btn btn-secondary">← Kembali</NuxtLink>
    </div>

    <div v-if="isEdit && loadingData" class="text-center py-8">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>

    <form v-if="!(isEdit && loadingData)" @submit.prevent="handleSubmit" class="card">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="form-group">
            <label class="form-label">Tanggal Pelaksanaan <span class="text-danger">*</span></label>
            <input type="date" v-model="form.tanggal_pelaksanaan" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Unit/Mesin <span class="text-danger">*</span></label>
            <select v-model="form.unit" @change="onUnitChange" class="form-input" required>
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
          <textarea v-model="form.catatan" class="form-input" rows="2" placeholder="Catatan tambahan..."></textarea>
        </div>

        <div class="materials-section">
          <h3 class="section-title">Material yang Digunakan</h3>
          
          <div v-if="!form.unit" class="text-center py-6 text-muted">
            <p>Pilih unit terlebih dahulu untuk melihat daftar material</p>
          </div>

          <div v-if="form.unit && loadingMaterials" class="text-center py-6">
            <div class="spinner"></div>
            <p class="mt-2 text-muted">Memuat material...</p>
          </div>

          <div v-if="form.unit && !loadingMaterials && materials.length === 0" class="text-center py-6 text-muted">
            <p>Tidak ada material untuk unit ini</p>
          </div>

          <div v-if="form.unit && !loadingMaterials && materials.length > 0" class="table-responsive">
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
                  <td><span :class="['badge', getCycleBadgeClass(material.cycle)]">{{ material.cycle }}</span></td>
                  <td class="text-center">{{ material.jumlah }}</td>
                  <td>
                    <input 
                      type="number" 
                      :value="material.jumlah_realisasi"
                      @input="updateMaterialQty(index, ($event.target as HTMLInputElement).value)"
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

        <div class="flex justify-end gap-3 mt-6 pt-4 border-top">
          <NuxtLink to="/realisasi" class="btn btn-secondary">Batal</NuxtLink>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : (isEdit ? 'Update' : 'Simpan') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { engines } from '~/utils/pmCycles'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.query.edit)
const editId = computed(() => route.query.edit as string)

const form = reactive({
  tanggal_pelaksanaan: '',
  unit: '',
  jenis_pm: '',
  catatan: ''
})

const materials = ref<any[]>([])
const loadingMaterials = ref(false)
const loadingData = ref(false)
const submitting = ref(false)

const loadMaterials = async (unitParam: string) => {
  if (!unitParam) return
  loadingMaterials.value = true
  try {
    const res = await fetch(`/api/materials?unit=${unitParam}`)
    if (res.ok) {
      const body = await res.json()
      materials.value = body.materials.map((m: any) => ({ ...m, jumlah_realisasi: 0 }))
    } else {
      materials.value = []
    }
  } catch {
    materials.value = []
  } finally {
    loadingMaterials.value = false
  }
}

onMounted(async () => {
  if (isEdit.value && editId.value) {
    loadingData.value = true
    try {
      const res = await fetch(`/api/pm/realizations/${editId.value}`)
      if (res.ok) {
        const data = await res.json()
        const dateStr = new Date(data.tanggal_pelaksanaan).toISOString().split('T')[0]
        form.tanggal_pelaksanaan = dateStr
        form.unit = String(data.unit)
        form.jenis_pm = data.jenis_pm
        form.catatan = data.catatan || ''

        await loadMaterials(String(data.unit))

        if (data.materials && data.materials.length > 0) {
          materials.value = materials.value.map(m => {
            const savedItem = data.materials.find((s: any) => s.nama_material === m.nama)
            if (savedItem) return { ...m, jumlah_realisasi: savedItem.jumlah_realisasi }
            return m
          })
        }
      } else {
        router.replace('/realisasi')
      }
    } catch {
      alert('Gagal memuat data')
      router.replace('/realisasi')
    } finally {
      loadingData.value = false
    }
  }
})

const onUnitChange = async () => {
  if (form.unit) {
    await loadMaterials(form.unit)
  } else {
    materials.value = []
  }
}

const updateMaterialQty = (index: number, val: string) => {
  const num = parseFloat(val)
  materials.value[index].jumlah_realisasi = isNaN(num) ? 0 : num
}

const getCycleBadgeClass = (cycle: string) => {
  const classes: Record<string, string> = { P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary' }
  return classes[cycle] || 'badge-secondary'
}

const handleSubmit = async () => {
  if (!form.tanggal_pelaksanaan || !form.unit || !form.jenis_pm) {
    alert('Mohon lengkapi semua field yang wajib diisi')
    return
  }

  const mData = materials.value
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
    materials: mData
  }

  submitting.value = true
  try {
    const url = isEdit.value ? `/api/pm/realizations/${editId.value}` : `/api/pm/realizations`
    const method = isEdit.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      router.push('/realisasi')
    } else {
      alert('Gagal menyimpan data')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style>
.section-title { font-size: var(--font-size-base); font-weight: 600; color: var(--gray-800); margin-bottom: var(--space-4); padding-bottom: var(--space-2); border-bottom: 2px solid var(--primary-500); }
.materials-section { background: var(--bg-input); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: var(--space-4); }
.table-materials { background: var(--bg-surface); border-radius: var(--radius-md); }
.table-materials th { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.border-top { border-top: 1px solid var(--glass-border); }
</style>
