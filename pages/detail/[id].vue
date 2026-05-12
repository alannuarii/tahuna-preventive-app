<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="detail-page-header">
      <button class="btn-back" @click="goBack" aria-label="Kembali">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <div class="detail-page-title-wrapper">
        <h1 class="home-title m-0">Detail Jadwal PM</h1>
        <span v-if="eventData.pm" :class="['badge', getPMBadgeClass(eventData.pm)]">
          {{ eventData.pm }}
        </span>
        <button 
          v-if="publicSlug"
          :class="['btn btn-sm flex items-center gap-1 ml-auto', copiedPublic ? 'btn-success' : 'btn-secondary']"
          @click="copyPublicLink"
          style="padding: 6px 12px; font-size: 0.8rem;"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {{ copiedPublic ? 'Tersalin' : 'Copy' }}
        </button>
      </div>
    </div>

    <div v-if="!loaded" class="loading-container">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat data...</p>
    </div>

    <div v-if="loaded && !eventData.unit" class="card">
      <div class="card-body text-center py-8">
        <div class="empty-state-icon">📋</div>
        <p class="text-muted text-lg mb-4">Data tidak ditemukan</p>
        <button class="btn btn-primary" @click="goBack">Kembali</button>
      </div>
    </div>

    <template v-if="loaded && eventData.unit">
      <!-- Status Overview Card -->
      <div class="detail-status-card">
        <div class="detail-status-header">
          <div class="detail-status-unit">
            <span class="detail-unit-number">Unit {{ eventData.unit }}</span>
            <span class="detail-unit-engine">{{ getEngineName(eventData.unit) }}</span>
          </div>
          <div :class="['detail-countdown', getTimeToGoClass()]">
            <span class="detail-countdown-value">{{ getTimeToGoLabel() }}</span>
            <span class="detail-countdown-label">Jadwal PM</span>
          </div>
        </div>
        
        <div class="detail-progress-section">
          <div class="detail-progress-labels">
            <span class="text-muted text-xs">Jam Operasi</span>
            <span class="text-xs font-semibold">
              {{ formatNumber(eventData.currentHours) }} / {{ formatNumber(eventData.targetHours) }} jam
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

      <!-- Info Cards Grid -->
      <div class="detail-cards-grid">
        <!-- Machine Info -->
        <div class="card detail-info-card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            Informasi Mesin
          </div>
          <div class="card-body">
            <div class="detail-info-list">
              <div class="detail-info-row">
                <span class="detail-info-label">Unit</span>
                <span class="detail-info-value">Unit {{ eventData.unit }}</span>
              </div>
              <div class="detail-info-row">
                <span class="detail-info-label">Mesin</span>
                <span class="detail-info-value">{{ getEngineName(eventData.unit) }}</span>
              </div>
              <div class="detail-info-row">
                <span class="detail-info-label">Jenis PM</span>
                <span class="detail-info-value">
                  <span :class="['badge', getPMBadgeClass(eventData.pm)]">{{ eventData.pm }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operating Hours -->
        <div class="card detail-info-card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Jam Operasi
          </div>
          <div class="card-body">
            <div class="detail-info-list">
              <div class="detail-info-row">
                <span class="detail-info-label">Current</span>
                <span class="detail-info-value font-mono">{{ formatNumber(eventData.currentHours) }} jam</span>
              </div>
              <div class="detail-info-row">
                <span class="detail-info-label">Target</span>
                <span class="detail-info-value font-mono">{{ formatNumber(eventData.targetHours) }} jam</span>
              </div>
              <div v-if="eventData.gantiOli !== undefined" class="detail-info-row">
                <span class="detail-info-label">Ganti Oli</span>
                <span class="detail-info-value font-mono">
                  {{ formatNumber(eventData.gantiOli) }} / {{ formatNumber(eventData.gantiOliCycles) }} jam
                </span>
              </div>
              <div v-if="eventData.overhaul !== undefined" class="detail-info-row">
                <span class="detail-info-label">Overhaul</span>
                <span class="detail-info-value font-mono">
                  {{ formatNumber(eventData.overhaul) }} / {{ formatNumber(eventData.overhaulCycles) }} jam
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Info -->
        <div class="card detail-info-card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Jadwal
          </div>
          <div class="card-body">
            <div class="detail-info-list">
              <div class="detail-info-row">
                <span class="detail-info-label">Tanggal PM</span>
                <span class="detail-info-value">{{ formatFullDate(eventData.tanggalPM) }}</span>
              </div>
              <div class="detail-info-row">
                <span class="detail-info-label">Estimasi</span>
                <span :class="['detail-info-value', getTimeToGoClass()]">
                  {{ getTimeToGoLabel() }}
                </span>
              </div>
              <div v-if="eventData.operasi !== undefined" class="detail-info-row">
                <span class="detail-info-label">Sisa Operasi</span>
                <span class="detail-info-value font-mono">
                  {{ formatNumber(eventData.targetHours - eventData.currentHours) }} jam
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SOP UI -->
      <div v-if="selectedSop" class="card mt-6" style="border: 1px solid var(--primary-200);">
        <div class="card-header cursor-pointer flex justify-between items-center" @click="showSop = !showSop" style="background: var(--bg-surface);">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="font-semibold text-primary-700">Instruksi Kerja (SOP) - {{ eventData.pm }}</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{'rotate-180': showSop}" style="transition: transform 0.2s; color: var(--primary-700);">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        <div v-show="showSop" class="card-body animate-fade-in border-top pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">🛠️ Persiapan & Alat</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                <li>
                  <strong>Personil:</strong> {{ selectedSop.jumlah_personil }} orang
                  <span class="text-muted" style="font-size: 0.8em; margin-left: 4px;">
                    ({{ selectedSop.personil_mekanik }} Mekanik, {{ selectedSop.personil_listrik }} Listrik, {{ selectedSop.personil_hse }} HSE)
                  </span>
                </li>
                <li><strong>APD:</strong> {{ selectedSop.apd.join(', ') }}</li>
                <li><strong>Tools:</strong> {{ selectedSop.tools.join(', ') }}</li>
              </ul>

              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">⚠️ Identifikasi Risiko</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: #b91c1c; padding-left: 1.25rem;">
                <li v-for="(risk, idx) in selectedSop.risiko" :key="'risk-'+idx">{{ risk }}</li>
              </ul>
              
              <h5 class="text-sm font-semibold mb-2" style="color: var(--gray-800);">📦 Material (Referensi)</h5>
              <ul class="list-disc text-sm mb-4 space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                <li v-for="(mat, idx) in selectedSop.material" :key="'mat-'+idx">{{ mat }}</li>
              </ul>
            </div>
            <div>
              <h5 class="text-sm font-semibold mb-3" style="color: var(--gray-800);">📋 Langkah Kerja</h5>
              <div class="mb-3">
                <h6 class="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wider">Persiapan</h6>
                <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                  <li v-for="(step, idx) in selectedSop.persiapan" :key="'prep-'+idx">{{ step }}</li>
                </ol>
              </div>
              <div class="mb-3">
                <h6 class="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wider">Pelaksanaan Pekerjaan</h6>
                <div class="mb-3" style="padding-left: 0.5rem; border-left: 2px solid rgba(74,222,128,0.3);">
                  <div class="text-xs font-semibold mb-1 flex items-center gap-1" style="color: var(--success);">⚙️ Mekanik</div>
                  <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                    <li v-for="(step, idx) in selectedSop.pelaksanaan_mekanik" :key="'exec-m-'+idx">{{ step }}</li>
                  </ol>
                </div>
                <div style="padding-left: 0.5rem; border-left: 2px solid rgba(96,165,250,0.3);">
                  <div class="text-xs font-semibold mb-1 flex items-center gap-1" style="color: var(--primary-400);">⚡ Elektrik</div>
                  <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                    <li v-for="(step, idx) in selectedSop.pelaksanaan_listrik" :key="'exec-e-'+idx">{{ step }}</li>
                  </ol>
                </div>
              </div>
              <div>
                <h6 class="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wider">Penormalan</h6>
                <ol class="list-decimal text-sm space-y-1" style="color: var(--gray-600); padding-left: 1.25rem;">
                  <li v-for="(step, idx) in selectedSop.penormalan" :key="'norm-'+idx">{{ step }}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>



      <!-- Report Text Card -->
      <div class="card mt-6 mb-6">
        <div class="card-header flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Format Laporan
          </div>
          <button 
            :class="['btn btn-sm flex items-center gap-1', copied ? 'btn-success' : 'btn-secondary']"
            @click="copyToClipboard"
            style="padding: 4px 10px;"
          >
            <template v-if="copied">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tersalin
            </template>
            <template v-else>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </template>
          </button>
        </div>
        <div class="card-body">
          <div class="p-3" style="background: rgba(0,0,0,0.2); border: 1px dashed var(--glass-border); border-radius: var(--radius-lg);">
            <p class="text-sm m-0" style="line-height: 1.6; color: var(--gray-600);">
              {{ getReportText() }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { engines } = useEngines()

const route = useRoute()
const router = useRouter()
const eventData = ref<any>({})
const materialsData = ref<{ materials?: any[], applicableCycles?: string[] }>({})
const materialsPending = ref(false)
const loaded = ref(false)
const copied = ref(false)
const publicSlug = ref('')
const copiedPublic = ref(false)

const selectedSop = ref<any>(null)
const showSop = ref(true)

onMounted(async () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('selectedEvent')
    if (stored) {
      const parsed = JSON.parse(stored)
      eventData.value = parsed
      loaded.value = true
      materialsPending.value = true
      try {
        const res = await fetch(`/api/materials?unit=${parsed.unit}`)
        if (res.ok) materialsData.value = await res.json()
      } finally {
        materialsPending.value = false
      }
      // Load SOP from API
      const mesinName = getEngineName(parsed.unit)
      const pmClean = parsed.pm ? parsed.pm.replace(/\s.*/, '') : ''

      // Fetch public link slug
      if (parsed.unit && pmClean) {
        try {
          const slugRes = await fetch(`/api/public/get-slug?unit=${parsed.unit}&pm=${pmClean}`)
          if (slugRes.ok) {
            const slugData = await slugRes.json()
            publicSlug.value = slugData.slug
          }
        } catch (e) {
          console.error('Failed to load public link slug:', e)
        }
      }
      if (mesinName && pmClean) {
        try {
          const sopRes = await fetch(`/api/sop?mesin=${encodeURIComponent(mesinName)}&jenis_pm=${pmClean}`)
          if (sopRes.ok) {
            const sopRows = await sopRes.json()
            if (sopRows.length > 0) selectedSop.value = sopRows[0]
          }
        } catch (e) {
          console.error('Failed to load SOP:', e)
        }
      }
    } else {
      loaded.value = true
    }
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

const goBack = () => {
  router.back()
}

const getEngineName = (unit: number) => {
  const engine = engines.value.find((e: any) => e.unit === unit)
  return engine?.mesin || `Engine Unit ${unit}`
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
  const current = eventData.value.currentHours || 0
  const target = eventData.value.targetHours || 1
  return Math.min((current / target) * 100, 100)
}

const getProgressClass = () => {
  const pct = getProgressPercent()
  if (pct >= 95) return 'progress-danger'
  if (pct >= 80) return 'progress-warning'
  return 'progress-primary'
}

const getTimeToGoLabel = () => {
  const days = eventData.value.timeToGo
  if (!days && days !== 0) return '-'
  if (days < 0) return 'Terlambat'
  if (days === 0) return 'Hari ini'
  return `${Math.ceil(days)} hari lagi`
}

const getTimeToGoClass = () => {
  const days = eventData.value.timeToGo
  if (!days && days !== 0) return ''
  if (days < 0) return 'text-danger-glow'
  if (days <= 7) return 'text-warning-glow'
  return 'text-success-glow'
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 18) return 'sore'
  return 'malam'
}

const getReportText = () => {
  if (!eventData.value.unit) return ''
  const pm = eventData.value.pm ? eventData.value.pm.split(' ')[0] : ''
  const fullEngine = getEngineName(eventData.value.unit)
  const engineShort = fullEngine.split(' ')[0] || 'Mesin'
  return `Selamat ${getGreeting()}, besok akan dilaksanakan pemeliharaan rutin ${pm} pada mesin ${engineShort} Unit ${eventData.value.unit}`
}

const copyToClipboard = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(getReportText())
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const copyPublicLink = () => {
  if (typeof window !== 'undefined' && publicSlug.value) {
    const publicUrl = `${window.location.origin}/pub/${publicSlug.value}`
    navigator.clipboard.writeText(publicUrl)
    copiedPublic.value = true
    setTimeout(() => { copiedPublic.value = false }, 2000)
  }
}
</script>

<style>
/* Detail Page Styles — Premium Dark Glass UI */
.detail-page-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
.detail-page-title-wrapper { display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0; }
.detail-page-title-wrapper .home-title { margin-bottom: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }



.detail-status-card { background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.08) 100%); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid rgba(99,102,241,0.2); border-radius: var(--radius-xl); padding: var(--space-5); margin-bottom: var(--space-5); position: relative; overflow: hidden; }
.detail-status-card::before { content: ''; position: absolute; top: -50%; right: -30%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); pointer-events: none; }

.detail-status-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); }
.detail-status-unit { display: flex; flex-direction: column; gap: var(--space-1); }
.detail-unit-number { font-size: var(--font-size-2xl); font-weight: 800; color: var(--gray-900); letter-spacing: -0.02em; }
.detail-unit-engine { font-size: var(--font-size-sm); color: var(--gray-500); font-weight: 500; }
.detail-countdown { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.detail-countdown-value { font-size: var(--font-size-lg); font-weight: 700; }
.detail-countdown-label { font-size: var(--font-size-xs); color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.05em; }

.detail-progress-section { display: flex; flex-direction: column; gap: var(--space-2); }
.detail-progress-labels { display: flex; justify-content: space-between; align-items: center; }
.detail-progress-track { width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: var(--radius-full); overflow: hidden; }
.detail-progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 1s cubic-bezier(0.4,0,0.2,1); position: relative; }
.detail-progress-fill::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmerDetail 2s infinite; }
@keyframes shimmerDetail { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

.progress-primary { background: linear-gradient(90deg, var(--primary-500), var(--accent)); box-shadow: 0 0 12px var(--primary-glow); }
.progress-warning { background: linear-gradient(90deg, var(--warning), #f97316); box-shadow: 0 0 12px var(--warning-glow); }
.progress-danger { background: linear-gradient(90deg, var(--danger), #f87171); box-shadow: 0 0 12px var(--danger-glow); }

.text-success-glow { color: var(--success); text-shadow: 0 0 8px var(--success-glow); }
.text-warning-glow { color: var(--warning); text-shadow: 0 0 8px var(--warning-glow); }
.text-danger-glow { color: var(--danger); text-shadow: 0 0 8px var(--danger-glow); }

.detail-cards-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
@media (min-width: 768px) { .detail-cards-grid { grid-template-columns: repeat(3, 1fr); } }

.detail-info-card .card-header { font-size: var(--font-size-sm); }
.detail-info-card .card-header svg { flex-shrink: 0; }
.detail-info-list { display: flex; flex-direction: column; gap: 0; }
.detail-info-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--glass-border); }
.detail-info-row:last-child { border-bottom: none; padding-bottom: 0; }
.detail-info-row:first-child { padding-top: 0; }
.detail-info-label { color: var(--gray-500); font-size: var(--font-size-sm); font-weight: 400; }
.detail-info-value { color: var(--gray-800); font-size: var(--font-size-sm); font-weight: 600; text-align: right; }
.font-mono { font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; }
.empty-state-icon { font-size: 3rem; margin-bottom: var(--space-3); opacity: 0.6; }
.badge-cycles { margin-left: 12px; background: var(--primary-100); color: var(--primary-300); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 500; }

.materials-table-container { overflow-x: auto; }
.materials-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.materials-table th { background: rgba(0,0,0,0.3); padding: 12px 16px; text-align: left; font-weight: 600; color: var(--gray-500); border-bottom: 1px solid var(--glass-border); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.materials-table td { padding: 12px 16px; border-bottom: 1px solid var(--glass-border); color: var(--gray-700); }
.materials-table tbody tr:last-child td { border-bottom: none; }
.materials-table tbody tr { transition: background var(--transition-fast); }
.materials-table tbody tr:hover { background: var(--bg-hover); }
.highlight-row { background: var(--primary-50) !important; }
.highlight-row:hover { background: var(--primary-100) !important; }

.cycle-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.cycle-p1 { background: rgba(96,165,250,0.2); color: #60a5fa; }
.cycle-p2 { background: rgba(74,222,128,0.2); color: #4ade80; }
.cycle-p3 { background: rgba(250,204,21,0.2); color: #facc15; }
.cycle-p4 { background: rgba(251,113,133,0.2); color: #fb7185; }
.cycle-p5 { background: rgba(192,132,252,0.2); color: #c084fc; }

.materials-legend { display: flex; gap: 24px; padding: 16px 16px; border-top: 1px solid var(--glass-border); flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.legend-dot.current { background: var(--primary-200); border: 2px solid var(--primary-400); box-shadow: 0 0 6px var(--primary-glow); }
.legend-dot.inherited { background: var(--gray-100); border: 2px solid var(--gray-400); }

@media (max-width: 640px) {
  .detail-status-header { flex-direction: column; gap: var(--space-3); }
  .detail-countdown { align-items: flex-start; flex-direction: row; gap: var(--space-2); }
  .detail-countdown-label { align-self: center; }
  .detail-page-title-wrapper .home-title { font-size: var(--font-size-lg); }
  .materials-table th, .materials-table td { padding: 10px 12px; font-size: var(--font-size-xs); }
}
</style>
