<template>
  <div class="public-container">
    <!-- Header -->
    <header class="public-header">
      <div class="header-logo-section">
        <img src="/images/npwhite.png" class="logo-image" alt="Logo PLN NP" />
        <div class="logo-text">
          <span class="logo-title">PLTD Tahuna</span>
          <span class="logo-subtitle">Preventive Maintenance App</span>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat rincian pemeliharaan...</p>
    </div>

    <!-- Error / Not Found State -->
    <div v-else-if="error" class="error-state card">
      <div class="card-body text-center py-8">
        <div class="empty-state-icon">🔒</div>
        <h2 class="text-xl font-bold mb-2">Tautan Tidak Valid atau Kedaluwarsa</h2>
        <p class="text-muted mb-4">Tautan publik ini tidak ditemukan atau Anda tidak memiliki izin untuk mengaksesnya.</p>
        <span class="badge badge-danger">Akses Ditolak</span>
      </div>
    </div>

    <!-- Content State -->
    <div v-else class="animate-fade-in">
      <!-- Status Card -->
      <div class="detail-status-card">
        <div class="detail-status-header">
          <div class="detail-status-unit">
            <span class="detail-unit-number">Unit {{ data.eventData.unit }}</span>
            <span class="detail-unit-engine">{{ data.mesin }}</span>
          </div>
          <div :class="['detail-countdown', getTimeToGoClass()]">
            <span class="detail-countdown-value">{{ getTimeToGoLabel() }}</span>
            <span class="detail-countdown-label">Rencana Jadwal PM</span>
          </div>
        </div>
        
        <div class="detail-progress-section">
          <div class="detail-progress-labels">
            <span class="text-muted text-xs">Jam Operasi Saat Ini</span>
            <span class="text-xs font-semibold">
              {{ formatNumber(data.eventData.currentHours) }} / {{ formatNumber(data.eventData.targetHours) }} jam
            </span>
          </div>
          <div class="detail-progress-track">
            <div 
              :class="['detail-progress-fill', getProgressClass()]"
              :style="{ width: getProgressPercent() + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Machine Info -->
      <div class="card detail-info-card">
        <div class="card-header">
          🔧 Informasi Mesin
        </div>
        <div class="card-body">
          <div class="detail-info-list">
            <div class="detail-info-row">
              <span class="detail-info-label">Unit</span>
              <span class="detail-info-value">Unit {{ data.eventData.unit }}</span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Mesin</span>
              <span class="detail-info-value">{{ data.mesin }}</span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Jenis PM</span>
              <span class="detail-info-value">
                <span :class="['badge', getPMBadgeClass(data.eventData.pm)]">{{ data.eventData.pm }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- SOP Card -->
      <div v-if="data.selectedSop" class="card mt-6" style="border: 1px solid var(--primary-200);">
        <div class="card-header" style="background: var(--bg-surface);">
          📋 Instruksi Kerja (SOP) Pemeliharaan - {{ data.eventData.pm }}
        </div>
        <div class="card-body pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">🛠️ Persiapan & Alat</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                <li>
                  <strong>Personil Kebutuhan:</strong> {{ data.selectedSop.jumlah_personil }} orang
                  <span class="text-muted" style="font-size: 0.8em; margin-left: 4px;">
                    ({{ data.selectedSop.personil_mekanik }} Mekanik, {{ data.selectedSop.personil_listrik }} Listrik, {{ data.selectedSop.personil_hse }} HSE)
                  </span>
                </li>
                <li><strong>APD Wajib:</strong> {{ data.selectedSop.apd.join(', ') }}</li>
                <li><strong>Peralatan Kerja (Tools):</strong> {{ data.selectedSop.tools.join(', ') }}</li>
              </ul>

              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">⚠️ Identifikasi Risiko K3</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: #b91c1c; padding-left: 1.25rem;">
                <li v-for="(risk, idx) in data.selectedSop.risiko" :key="'risk-'+idx">{{ risk }}</li>
              </ul>
              
              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">📦 Material yang Diperlukan</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                <li v-for="(mat, idx) in data.selectedSop.material" :key="'mat-'+idx">{{ mat }}</li>
              </ul>
            </div>
            
            <div>
              <h5 class="text-sm font-semibold mb-3" style="color: var(--gray-800);">📋 Langkah Kerja Pelaksanaan</h5>
              <div class="mb-3">
                <h6 class="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wider">Persiapan awal</h6>
                <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                  <li v-for="(step, idx) in data.selectedSop.persiapan" :key="'prep-'+idx">{{ step }}</li>
                </ol>
              </div>
              <div class="mb-3">
                <h6 class="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wider">Pelaksanaan Pekerjaan</h6>
                <div class="mb-3" style="padding-left: 0.5rem; border-left: 2px solid rgba(74,222,128,0.3);">
                  <div class="text-xs font-semibold mb-1 flex items-center gap-1" style="color: var(--success);">⚙️ Mekanik</div>
                  <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                    <li v-for="(step, idx) in data.selectedSop.pelaksanaan_mekanik" :key="'exec-m-'+idx">{{ step }}</li>
                  </ol>
                </div>
                <div style="padding-left: 0.5rem; border-left: 2px solid rgba(96,165,250,0.3);">
                  <div class="text-xs font-semibold mb-1 flex items-center gap-1" style="color: var(--primary-400);">⚡ Elektrik</div>
                  <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                    <li v-for="(step, idx) in data.selectedSop.pelaksanaan_listrik" :key="'exec-e-'+idx">{{ step }}</li>
                  </ol>
                </div>
              </div>
              <div>
                <h6 class="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wider">Penormalan Akhir</h6>
                <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                  <li v-for="(step, idx) in data.selectedSop.penormalan" :key="'norm-'+idx">{{ step }}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Disable default app layouts (sidebar, bottom navigation)
definePageMeta({
  layout: false
})

const route = useRoute()
const slug = route.params.slug

const data = ref<any>(null)
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(`/api/public/${slug}`)
    if (res.ok) {
      data.value = await res.json()
    } else {
      error.value = true
    }
  } catch (err) {
    console.error('Failed to load public link data:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})

const formatNumber = (num: any) => {
  if (!num && num !== 0) return '-'
  return Math.round(num).toLocaleString('id-ID')
}

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  } catch (e) {
    return dateStr
  }
}

const getPMBadgeClass = (pm: string) => {
  if (!pm) return 'badge-secondary'
  const p = pm.replace(/\s.*/, '')
  const classes: Record<string, string> = {
    P1: 'badge-info', P2: 'badge-success', P3: 'badge-warning', P4: 'badge-danger', P5: 'badge-primary'
  }
  return classes[p] || 'badge-secondary'
}

const getProgressPercent = () => {
  if (!data.value) return 0
  const current = data.value.eventData.currentHours || 0
  const target = data.value.eventData.targetHours || 1
  return Math.min((current / target) * 100, 100)
}

const getProgressClass = () => {
  const pct = getProgressPercent()
  if (pct >= 95) return 'progress-danger'
  if (pct >= 80) return 'progress-warning'
  return 'progress-primary'
}

const getTimeToGoLabel = () => {
  if (!data.value) return '-'
  const days = data.value.eventData.timeToGo
  if (!days && days !== 0) return '-'
  if (days < 0) return 'Terlambat'
  if (days === 0) return 'Hari ini'
  return `${Math.ceil(days)} hari lagi`
}

const getTimeToGoClass = () => {
  if (!data.value) return ''
  const days = data.value.eventData.timeToGo
  if (!days && days !== 0) return ''
  if (days < 0) return 'text-danger-glow'
  if (days <= 7) return 'text-warning-glow'
  return 'text-success-glow'
}
</script>

<style scoped>
/* Standalone Public Container */
.public-container {
  min-height: 100vh;
  background: var(--bg-body);
  color: var(--gray-800);
  padding: var(--space-6) var(--space-4);
  max-width: 900px;
  margin: 0 auto;
}

.public-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.header-logo-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.logo-image {
  height: 42px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-weight: 800;
  color: var(--gray-900);
  font-size: var(--font-size-lg);
  letter-spacing: -0.01em;
}

.logo-subtitle {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
}

.header-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: var(--radius-full);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.error-state {
  max-width: 500px;
  margin: 10vh auto;
}

/* Reusing Premium Styling for Standalone Page */
.detail-status-card {
  background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.08) 100%);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}

.detail-status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.detail-status-unit {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-unit-number {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

.detail-unit-engine {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  font-weight: 500;
}

.detail-countdown {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.detail-countdown-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.detail-countdown-label {
  font-size: var(--font-size-xs);
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail-progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.detail-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}

.detail-progress-fill::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmerDetail 2s infinite;
}

@keyframes shimmerDetail {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-primary { background: linear-gradient(90deg, var(--primary-500), var(--accent)); box-shadow: 0 0 12px var(--primary-glow); }
.progress-warning { background: linear-gradient(90deg, var(--warning), #f97316); box-shadow: 0 0 12px var(--warning-glow); }
.progress-danger { background: linear-gradient(90deg, var(--danger), #f87171); box-shadow: 0 0 12px var(--danger-glow); }

.detail-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .detail-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-info-label {
  font-size: var(--font-size-sm);
  color: var(--gray-400);
}

.detail-info-value {
  font-weight: 600;
  color: var(--gray-900);
}

@media (max-width: 576px) {
  .detail-status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  .detail-countdown {
    align-items: flex-start;
  }
}
</style>
