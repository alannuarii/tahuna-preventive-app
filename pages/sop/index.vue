<template>
  <div class="animate-fade-in">
    <div class="flex items-center gap-4 mb-6 pt-2">
      <h1 class="home-title m-0">Instruksi Kerja (SOP)</h1>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body" style="padding: var(--space-3) var(--space-4);">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="form-group m-0">
            <label class="form-label text-xs">Filter Mesin</label>
            <select v-model="filterMesin" class="form-input form-input-sm">
              <option value="">Semua Mesin</option>
              <option v-for="m in mesinList" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group m-0">
            <label class="form-label text-xs">Filter Jenis PM</label>
            <select v-model="filterPM" class="form-input form-input-sm">
              <option value="">Semua PM</option>
              <option v-for="p in pmList" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container" style="min-height: 40vh;">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data SOP...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredSops.length === 0" class="card">
      <div class="card-body text-center py-8">
        <div style="font-size: 3rem; margin-bottom: var(--space-3); opacity: 0.6;">📋</div>
        <p class="text-muted text-lg">Tidak ada SOP ditemukan</p>
      </div>
    </div>

    <!-- SOP Cards grouped by machine -->
    <template v-else>
      <div v-for="group in groupedSops" :key="group.mesin" class="mb-6">
        <h2 class="sop-group-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
          {{ group.mesin }}
        </h2>

        <div class="sop-cards-grid">
          <div 
            v-for="sop in group.items" 
            :key="sop.id" 
            class="sop-card"
            @click="openDetail(sop)"
          >
            <div class="sop-card-header">
              <span :class="['badge', getPMBadgeClass(sop.jenis_pm)]">{{ sop.jenis_pm }}</span>
              <span class="sop-card-personil">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {{ sop.jumlah_personil }} org
              </span>
            </div>
            <div class="sop-card-body">
              <div class="sop-card-stat">
                <span class="sop-card-stat-label">Tools</span>
                <span class="sop-card-stat-value">{{ sop.tools.length }} item</span>
              </div>
              <div class="sop-card-stat">
                <span class="sop-card-stat-label">Langkah</span>
                <span class="sop-card-stat-value">{{ sop.persiapan.length + sop.pelaksanaan.length + sop.penormalan.length }} step</span>
              </div>
              <div class="sop-card-stat">
                <span class="sop-card-stat-label">Risiko</span>
                <span class="sop-card-stat-value">{{ sop.risiko.length }} item</span>
              </div>
            </div>
            <div class="sop-card-footer">
              <span class="text-xs text-muted">Diperbarui {{ formatDate(sop.updated_at) }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const allSops = ref<any[]>([])
const loading = ref(true)
const filterMesin = ref('')
const filterPM = ref('')

const mesinList = ['SWD 6FHD 240', 'Deutz MWM TBD 616 V12', 'Mitsubishi S16R-PTA-S', 'Cummins KTA50-G8']
const pmList = ['P1', 'P2', 'P3', 'P4', 'P5']

const loadSops = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/sop')
    if (res.ok) {
      allSops.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load SOP:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadSops())

const filteredSops = computed(() => {
  return allSops.value.filter(s => {
    if (filterMesin.value && s.mesin !== filterMesin.value) return false
    if (filterPM.value && s.jenis_pm !== filterPM.value) return false
    return true
  })
})

const groupedSops = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const sop of filteredSops.value) {
    if (!groups[sop.mesin]) groups[sop.mesin] = []
    groups[sop.mesin].push(sop)
  }
  return Object.entries(groups).map(([mesin, items]) => ({ mesin, items }))
})

const openDetail = (sop: any) => {
  router.push(`/sop/${sop.id}`)
}

const getPMBadgeClass = (pm: string) => {
  const classes: Record<string, string> = { P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary' }
  return classes[pm] || 'badge-secondary'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.sop-group-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--primary-500);
}

.sop-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-3);
}

.sop-card {
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sop-card:hover {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 1px var(--primary-400), var(--shadow-md);
  transform: translateY(-2px);
}

.sop-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sop-card-personil {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  font-weight: 500;
}

.sop-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sop-card-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sop-card-stat-label {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
}

.sop-card-stat-value {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-700);
}

.sop-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-2);
  border-top: 1px solid var(--glass-border);
}
</style>
