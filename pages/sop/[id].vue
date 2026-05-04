<template>
  <div class="animate-fade-in">
    <div class="flex items-center gap-4 mb-6 pt-2">
      <NuxtLink to="/sop" class="btn-back" aria-label="Kembali">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <h1 class="home-title m-0" style="font-size: 1.35rem;">{{ isEditing ? 'Edit' : 'Detail' }} SOP</h1>
        <p v-if="sop" class="text-sm text-muted m-0 mt-1">{{ sop.mesin }} — {{ sop.jenis_pm }}</p>
      </div>
      <button 
        v-if="sop && !isEditing" 
        class="btn btn-primary btn-sm"
        @click="isEditing = true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container" style="min-height: 40vh;">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat SOP...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!sop" class="card">
      <div class="card-body text-center py-8">
        <p class="text-muted text-lg mb-4">SOP tidak ditemukan</p>
        <NuxtLink to="/sop" class="btn btn-primary">Kembali ke Daftar</NuxtLink>
      </div>
    </div>

    <!-- View Mode -->
    <template v-else-if="!isEditing">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Left Column -->
        <div class="card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Persiapan & Alat
          </div>
          <div class="card-body">
            <div class="sop-detail-row mb-3">
              <span class="sop-detail-label">Personil</span>
              <span class="sop-detail-value">
                {{ sop.jumlah_personil }} orang
                <span class="text-xs text-muted font-normal block" style="margin-top: 2px;">
                  ({{ sop.personil_mekanik }} Mekanik, {{ sop.personil_listrik }} Listrik, {{ sop.personil_hse }} HSE)
                </span>
              </span>
            </div>
            <h5 class="sop-section-subtitle">🛠️ Tools</h5>
            <ul class="sop-list">
              <li v-for="(item, i) in sop.tools" :key="'t'+i">{{ item }}</li>
            </ul>
            <h5 class="sop-section-subtitle mt-4">🦺 APD</h5>
            <ul class="sop-list">
              <li v-for="(item, i) in sop.apd" :key="'a'+i">{{ item }}</li>
            </ul>
            <h5 class="sop-section-subtitle mt-4">📦 Material</h5>
            <ul class="sop-list">
              <li v-for="(item, i) in sop.material" :key="'m'+i">{{ item }}</li>
            </ul>
          </div>
        </div>

        <!-- Right Column -->
        <div class="flex flex-col gap-4">
          <div class="card">
            <div class="card-header" style="color: #b91c1c;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Identifikasi Risiko
            </div>
            <div class="card-body">
              <ul class="sop-list sop-list-danger">
                <li v-for="(item, i) in sop.risiko" :key="'r'+i">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Steps -->
      <div class="card mb-6">
        <div class="card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Langkah Kerja
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 class="sop-step-title sop-step-prep">Persiapan</h5>
              <ol class="sop-step-list">
                <li v-for="(step, i) in sop.persiapan" :key="'p'+i">{{ step }}</li>
              </ol>
            </div>
            <div>
              <h5 class="sop-step-title sop-step-exec">Pelaksanaan</h5>
              <ol class="sop-step-list">
                <li v-for="(step, i) in sop.pelaksanaan" :key="'e'+i">{{ step }}</li>
              </ol>
            </div>
            <div>
              <h5 class="sop-step-title sop-step-norm">Penormalan</h5>
              <ol class="sop-step-list">
                <li v-for="(step, i) in sop.penormalan" :key="'n'+i">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Mode -->
    <template v-else>
      <form @submit.prevent="handleSave">
        <div class="card mb-4">
          <div class="card-header">Detail Personil</div>
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="form-group m-0">
                <label class="form-label text-xs">Mekanik</label>
                <input type="number" v-model.number="editForm.personil_mekanik" class="form-input form-input-sm" min="0" />
              </div>
              <div class="form-group m-0">
                <label class="form-label text-xs">Listrik</label>
                <input type="number" v-model.number="editForm.personil_listrik" class="form-input form-input-sm" min="0" />
              </div>
              <div class="form-group m-0">
                <label class="form-label text-xs">HSE</label>
                <input type="number" v-model.number="editForm.personil_hse" class="form-input form-input-sm" min="0" />
              </div>
            </div>
            <p class="text-xs text-muted mt-2 mb-0">Total: {{ editForm.personil_mekanik + editForm.personil_listrik + editForm.personil_hse }} orang</p>
          </div>
        </div>

        <!-- Editable arrays -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SopEditList v-model="editForm.tools" label="🛠️ Tools" />
          <SopEditList v-model="editForm.apd" label="🦺 APD" />
          <SopEditList v-model="editForm.material" label="📦 Material" />
          <SopEditList v-model="editForm.risiko" label="⚠️ Risiko" />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SopEditList v-model="editForm.persiapan" label="📋 Persiapan" numbered />
          <SopEditList v-model="editForm.pelaksanaan" label="📋 Pelaksanaan" numbered />
          <SopEditList v-model="editForm.penormalan" label="📋 Penormalan" numbered />
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Batal</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sopId = route.params.id

const sop = ref<any>(null)
const loading = ref(true)
const isEditing = ref(false)
const saving = ref(false)

const editForm = reactive({
  personil_mekanik: 2,
  personil_listrik: 2,
  personil_hse: 1,
  tools: [] as string[],
  apd: [] as string[],
  material: [] as string[],
  risiko: [] as string[],
  persiapan: [] as string[],
  pelaksanaan: [] as string[],
  penormalan: [] as string[],
})

const loadSop = async () => {
  loading.value = true
  try {
    const res = await fetch(`/api/sop/${sopId}`)
    if (res.ok) {
      sop.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load SOP:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadSop())

watch(isEditing, (val) => {
  if (val && sop.value) {
    editForm.personil_mekanik = sop.value.personil_mekanik ?? 2
    editForm.personil_listrik = sop.value.personil_listrik ?? 2
    editForm.personil_hse = sop.value.personil_hse ?? 1
    editForm.tools = [...sop.value.tools]
    editForm.apd = [...sop.value.apd]
    editForm.material = [...sop.value.material]
    editForm.risiko = [...sop.value.risiko]
    editForm.persiapan = [...sop.value.persiapan]
    editForm.pelaksanaan = [...sop.value.pelaksanaan]
    editForm.penormalan = [...sop.value.penormalan]
  }
})

const cancelEdit = () => {
  isEditing.value = false
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await fetch(`/api/sop/${sopId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      sop.value = await res.json()
      isEditing.value = false
      showAlert('SOP berhasil diperbarui', 'success')
    } else {
      showAlert('Gagal menyimpan SOP', 'error')
    }
  } catch {
    showAlert('Gagal menyimpan SOP', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sop-detail-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--glass-border); }
.sop-detail-label { font-size: var(--font-size-sm); color: var(--gray-500); }
.sop-detail-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-800); }

.sop-section-subtitle { font-size: var(--font-size-sm); font-weight: 600; color: var(--gray-700); margin-bottom: var(--space-2); }

.sop-list { list-style: disc; padding-left: 1.25rem; margin: 0; }
.sop-list li { font-size: var(--font-size-sm); color: var(--gray-600); padding: 3px 0; line-height: 1.5; }
.sop-list-danger li { color: #b91c1c; }

.sop-step-title { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 2px solid; }
.sop-step-prep { color: var(--primary-400); border-color: var(--primary-400); }
.sop-step-exec { color: var(--success); border-color: var(--success); }
.sop-step-norm { color: var(--warning); border-color: var(--warning); }

.sop-step-list { list-style: decimal; padding-left: 1.25rem; margin: 0; }
.sop-step-list li { font-size: var(--font-size-sm); color: var(--gray-600); padding: 4px 0; line-height: 1.6; }
</style>
