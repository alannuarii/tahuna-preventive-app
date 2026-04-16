<template>
  <div class="animate-fade-in">
    <div class="flex items-center gap-4 mb-6 pt-2">
      <NuxtLink to="/realisasi" class="btn-back" aria-label="Kembali">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </NuxtLink>
      <h1 class="home-title m-0">{{ isEdit ? 'Edit' : 'Input' }} Realisasi PM</h1>
    </div>

    <div v-if="isEdit && loadingData" class="loading-container" style="min-height: 40vh;">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>

    <!-- ===== INPUT MODE SWITCH (only on create, not edit) ===== -->
    <div v-if="!isEdit && !(isEdit && loadingData)" class="card mb-4">
      <div class="card-body" style="padding: var(--space-3) var(--space-4);">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm font-semibold" style="color: var(--gray-600);">Metode Input:</span>
          <div class="input-mode-toggle">
            <button 
              type="button" 
              :class="['mode-btn', { active: inputMode === 'manual' }]"
              @click="inputMode = 'manual'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Manual
            </button>
            <button 
              type="button" 
              :class="['mode-btn', { active: inputMode === 'whatsapp' }]"
              @click="inputMode = 'whatsapp'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Paste Laporan WA
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== WHATSAPP PASTE MODE ===== -->
    <div v-if="inputMode === 'whatsapp' && !isEdit && !(isEdit && loadingData)" class="card mb-4">
      <div class="card-body">
        <div class="form-group mb-4">
          <label class="form-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align: -2px; margin-right:4px;">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Paste Laporan WhatsApp
          </label>
          <textarea 
            v-model="waReportText" 
            class="form-input wa-textarea" 
            rows="10" 
            placeholder="Paste / ketik laporan dari WhatsApp di sini...

Contoh:
Pemeliharaan P1 unit 5
Rabu,08 April 2026
Personil 4 org
Durasi jam 09:00-12:00
Pekerjaan :
Ganti Filter Hsd 1 bh
Filter udara 2 bh
...
"
          ></textarea>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button type="button" class="btn btn-primary" @click="parseReport" :disabled="!waReportText.trim()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align: -2px; margin-right:4px;">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            Ekstrak Data
          </button>
          <button type="button" class="btn btn-secondary" @click="waReportText = ''; parseResult = null">
            Bersihkan
          </button>
        </div>

        <!-- Parse Result Preview -->
        <div v-if="parseResult" class="parse-result-panel mt-4">
          <h4 class="parse-result-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align: -3px; margin-right:4px;">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Hasil Ekstraksi
          </h4>

          <!-- Warnings -->
          <div v-if="parseResult.warnings.length > 0" class="parse-warnings">
            <div v-for="(w, i) in parseResult.warnings" :key="i" class="parse-warning-item">
              ⚠️ {{ w }}
            </div>
          </div>

          <!-- Extracted metadata -->
          <div class="parse-meta-grid mb-6">
            <div class="parse-meta-item">
              <span class="parse-meta-label">Tanggal</span>
              <span :class="['parse-meta-value', { 'text-danger': !parseResult.tanggal }]">
                {{ parseResult.tanggal || 'Tidak terdeteksi' }}
              </span>
            </div>
            <div class="parse-meta-item">
              <span class="parse-meta-label">Unit</span>
              <span :class="['parse-meta-value', { 'text-danger': !parseResult.unit }]">
                {{ parseResult.unit ? 'Unit ' + parseResult.unit : 'Tidak terdeteksi' }}
              </span>
            </div>
            <div class="parse-meta-item">
              <span class="parse-meta-label">Jenis PM</span>
              <span :class="['parse-meta-value', { 'text-danger': !parseResult.jenisPm }]">
                {{ parseResult.jenisPm || 'Tidak terdeteksi' }}
              </span>
            </div>
          </div>

          <!-- Detected materials -->
          <div v-if="parseResult.materials.length > 0" class="parse-materials-section mt-4">
            <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-700);">Material Terdeteksi ({{ parseResult.materials.length }} item)</h5>
            <div class="table-responsive">
              <table class="table table-materials">
                <thead>
                  <tr>
                    <th>Material (DB)</th>
                    <th class="text-center" style="width:100px;">Jumlah</th>
                    <th style="width:80px;">Satuan</th>
                    <th>Teks Asli</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(mat, i) in parseResult.materials" :key="i">
                    <td class="font-semibold">{{ mat.dbName }}</td>
                    <td class="text-center font-semibold">{{ mat.quantity }}</td>
                    <td>{{ mat.unit }}</td>
                    <td class="text-muted text-xs" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ mat.rawLine }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="parseResult.materials.length === 0" class="text-center py-4 text-muted">
            <p>Tidak ada material fast-moving terdeteksi dari laporan ini.</p>
          </div>

          <!-- Apply button -->
          <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
            <button type="button" class="btn btn-secondary" @click="parseResult = null">Batal</button>
            <button type="button" class="btn btn-primary" @click="applyParseResult" :disabled="!parseResult.unit || !parseResult.jenisPm || !parseResult.tanggal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align: -2px; margin-right:4px;">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Terapkan ke Form
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== MAIN FORM ===== -->
    <form v-if="(inputMode === 'manual' || isEdit) && !(isEdit && loadingData)" @submit.prevent="handleSubmit" class="card">
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
                <tr v-for="(material, index) in materials" :key="index" :class="{ 'row-filled': material.jumlah_realisasi > 0 }">
                  <td>{{ material.nama }}</td>
                  <td><span :class="['badge', getCycleBadgeClass(material.cycle)]">{{ material.cycle }}</span></td>
                  <td class="text-center">{{ material.jumlah }}</td>
                  <td>
                    <input 
                      type="number" 
                      :value="material.jumlah_realisasi"
                      @input="updateMaterialQty(index, ($event.target as HTMLInputElement).value)"
                      class="form-input form-input-sm text-center"
                      :class="{ 'input-filled': material.jumlah_realisasi > 0 }"
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

        <div class="flex justify-end gap-3 mt-8 pt-5 border-top">
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
import { parseWhatsAppReport } from '~/utils/waReportParser'
import type { ParsedReport } from '~/utils/waReportParser'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.query.edit)
const editId = computed(() => route.query.edit as string)

const inputMode = ref<'manual' | 'whatsapp'>('manual')
const waReportText = ref('')
const parseResult = ref<ParsedReport | null>(null)
const notificationId = computed(() => route.query.notificationId as string)

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
      showAlert('Gagal memuat data', 'error')
      router.replace('/realisasi')
    } finally {
      loadingData.value = false
    }
  } else if (notificationId.value) {
    // Handle notification click
    loadingData.value = true
    try {
      const res = await fetch(`/api/notifications/${notificationId.value}`)
      if (res.ok) {
        const data = await res.json()
        
        let reportText = ''
        try {
          const parsedPayload = JSON.parse(data.payload)
          reportText = parsedPayload.message || parsedPayload.text || parsedPayload.body || data.payload
        } catch {
          reportText = data.payload
        }
        
        waReportText.value = reportText
        inputMode.value = 'whatsapp'
        parseReport()
        
        // Mark as read
        fetch(`/api/notifications/${notificationId.value}/read`, { method: 'PUT' }).catch(console.error)
      }
    } catch (e) {
      console.error('Failed to load notification', e)
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

// ===== WHATSAPP PARSER =====
const parseReport = () => {
  if (!waReportText.value.trim()) return
  parseResult.value = parseWhatsAppReport(waReportText.value)
}

const applyParseResult = async () => {
  if (!parseResult.value) return
  const result = parseResult.value

  // Apply metadata to form
  if (result.tanggal) form.tanggal_pelaksanaan = result.tanggal
  if (result.unit) form.unit = String(result.unit)
  if (result.jenisPm) form.jenis_pm = result.jenisPm
  // Store the raw WA text as catatan
  form.catatan = result.rawText.substring(0, 1000)

  // Load materials for the detected unit
  if (result.unit) {
    await loadMaterials(String(result.unit))
    
    // Apply parsed quantities to matching materials
    if (result.materials.length > 0 && materials.value.length > 0) {
      for (const parsed of result.materials) {
        const matchIdx = materials.value.findIndex((m: any) => 
          m.nama.toLowerCase() === parsed.dbName.toLowerCase()
        )
        if (matchIdx !== -1) {
          materials.value[matchIdx].jumlah_realisasi = parsed.quantity
        }
      }
    }
  }

  // Switch to manual mode to show the filled form
  inputMode.value = 'manual'
  parseResult.value = null
}

// ===== SUBMIT =====
const handleSubmit = async () => {
  if (!form.tanggal_pelaksanaan || !form.unit || !form.jenis_pm) {
    showAlert('Mohon lengkapi semua field yang wajib diisi', 'warning')
    return
  }

  const mData = materials.value
    .filter((m: any) => m.jumlah_realisasi > 0)
    .map((m: any) => ({
      material_id: m.id,
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
      showAlert('Gagal menyimpan data', 'error')
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

/* Input mode toggle */
.input-mode-toggle {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 3px;
  gap: 2px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.mode-btn:hover {
  background: var(--glass-bg);
  color: var(--gray-800);
}
.mode-btn.active {
  background: var(--primary-500);
  color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

/* WA Textarea */
.wa-textarea {
  font-family: 'Courier New', monospace !important;
  font-size: var(--font-size-sm) !important;
  line-height: 1.6 !important;
  background: var(--bg-input) !important;
  border: 2px dashed var(--glass-border) !important;
  transition: border-color 0.2s ease;
}
.wa-textarea:focus {
  border-color: var(--primary-500) !important;
  border-style: solid !important;
}

/* Parse result panel */
.parse-result-panel {
  background: var(--bg-input);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.parse-result-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--primary-700);
  margin: 0 0 var(--space-4) 0;
}
.parse-warnings {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-5);
  margin-top: var(--space-2);
}
.parse-warning-item {
  font-size: var(--font-size-sm);
  color: #b45309;
  padding: 4px 0;
}
.parse-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
}
.parse-meta-item {
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}
.parse-meta-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}
.parse-meta-value {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--gray-800);
}

/* Highlight filled rows */
.row-filled {
  background: rgba(16, 185, 129, 0.06) !important;
}
.input-filled {
  border-color: var(--primary-500) !important;
  background: rgba(16, 185, 129, 0.05) !important;
  font-weight: 600 !important;
}
</style>
