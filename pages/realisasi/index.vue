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
    <template v-if="viewMode === 'table'">
      <div class="flex justify-end mb-3 mobile-only">
        <button class="btn btn-secondary btn-sm" @click="showMobileFilter = !showMobileFilter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {{ showMobileFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
        </button>
      </div>

      <div class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobileFilter }">
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

        <div class="form-group mb-4">
          <label class="form-label">Filter Jenis PM</label>
          <div class="flex flex-wrap gap-4 items-center">
            <label class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :checked="filters.jenis_pm.length === 0" @change="filters.jenis_pm = []" class="form-checkbox" />
              <span class="text-sm font-medium">Semua</span>
            </label>
            <label v-for="pm in ['P1', 'P2', 'P3', 'P4', 'P5']" :key="pm" class="cursor-pointer flex items-center gap-2">
              <input type="checkbox" :value="pm" v-model="filters.jenis_pm" class="form-checkbox" />
              <span class="text-sm">{{ pm }}</span>
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
  </template>

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
    <template v-if="!pending && realizations.length > 0 && viewMode === 'calendar'">
      <PMCalendar :events="calendarEvents" @event-click="handleEventClick" @download="handleDownloadCalendar" @month-change="handleMonthChange" />
      
      <div class="realisasi-stats-grid mt-4">
        <!-- Statistics Table (Left Column) -->
        <div class="card animate-fade-in mb-0">
          <div class="card-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 1rem; padding-top: 1.25rem; padding-left: 1.5rem; padding-right: 1.5rem;">
            <h3 class="card-title m-0 flex items-center gap-2" style="font-size: 1.1rem; font-weight: 600; color: var(--text-color); display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #6366f1; margin-right: 6px;">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Statistik Realisasi PM - {{ formatMonthYear(activeCalendarDate) }}
            </h3>
          </div>
          <div class="card-body p-0">
            <div class="table-wrapper" style="overflow-x: auto;">
              <table class="table table-mobile-optimized" style="margin-bottom: 0; width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="min-width: 80px; text-align: center;">Unit</th>
                    <th style="min-width: 150px; text-align: left;">Mesin</th>
                    <th style="text-align: center; width: 60px;">P1</th>
                    <th style="text-align: center; width: 60px;">P2</th>
                    <th style="text-align: center; width: 60px;">P3</th>
                    <th style="text-align: center; width: 60px;">P4</th>
                    <th style="text-align: center; width: 60px;">P5</th>
                    <th style="text-align: center; width: 80px; font-weight: bold; background-color: rgba(255, 255, 255, 0.02);">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in monthlyStatistics" :key="stat.unit" style="border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
                    <td style="text-align: center; vertical-align: middle;" class="font-semibold">Unit {{ stat.unit }}</td>
                    <td class="text-xs text-muted" style="vertical-align: middle; text-align: left;">
                      <span class="mobile-hidden-mesin">{{ stat.mesin }}</span>
                      <span class="mobile-only-mesin">{{ getShortEngineName(stat.mesin) }}</span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', stat.P1 > 0 ? 'active badge-info-subtle' : 'empty']">
                        {{ stat.P1 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', stat.P2 > 0 ? 'active badge-success-subtle' : 'empty']">
                        {{ stat.P2 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', stat.P3 > 0 ? 'active badge-warning-subtle' : 'empty']">
                        {{ stat.P3 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', stat.P4 > 0 ? 'active badge-danger-subtle' : 'empty']">
                        {{ stat.P4 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', stat.P5 > 0 ? 'active badge-primary-subtle' : 'empty']">
                        {{ stat.P5 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle; font-weight: bold; background-color: rgba(255, 255, 255, 0.01);">
                      <span :class="['badge-pm-count', stat.total > 0 ? 'active badge-total' : 'empty']">
                        {{ stat.total }}
                      </span>
                    </td>
                  </tr>
                  <!-- Total Row -->
                  <tr style="background-color: rgba(255, 255, 255, 0.03); font-weight: bold;">
                    <td colspan="2" style="text-align: right; padding-right: 2rem; vertical-align: middle;">Total Keseluruhan</td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', totalMonthlyStats.P1 > 0 ? 'active badge-info-subtle' : 'empty']">
                        {{ totalMonthlyStats.P1 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', totalMonthlyStats.P2 > 0 ? 'active badge-success-subtle' : 'empty']">
                        {{ totalMonthlyStats.P2 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', totalMonthlyStats.P3 > 0 ? 'active badge-warning-subtle' : 'empty']">
                        {{ totalMonthlyStats.P3 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', totalMonthlyStats.P4 > 0 ? 'active badge-danger-subtle' : 'empty']">
                        {{ totalMonthlyStats.P4 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <span :class="['badge-pm-count', totalMonthlyStats.P5 > 0 ? 'active badge-primary-subtle' : 'empty']">
                        {{ totalMonthlyStats.P5 }}
                      </span>
                    </td>
                    <td style="text-align: center; vertical-align: middle; background-color: rgba(255, 255, 255, 0.05);">
                      <span :class="['badge-pm-count', totalMonthlyStats.total > 0 ? 'active badge-total' : 'empty']">
                        {{ totalMonthlyStats.total }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Material Consumption Card (Right Column) -->
        <div class="card animate-fade-in mb-0">
          <div class="card-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 1rem; padding-top: 1.25rem; padding-left: 1.5rem; padding-right: 1.5rem;">
            <h3 class="card-title m-0 flex items-center gap-2" style="font-size: 1.1rem; font-weight: 600; color: var(--text-color); display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981; margin-right: 6px;">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22" x2="12" y2="12"></line>
              </svg>
              Realisasi Pemakaian Material - {{ formatMonthYear(activeCalendarDate) }}
            </h3>
          </div>
          <div class="card-body" style="padding: 1.25rem; overflow-y: auto; max-height: 400px;">
            <div v-if="monthlyMaterialUsage.length === 0" class="text-center py-8 text-muted">
              <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📦</span>
              <p class="text-sm">Tidak ada realisasi pemakaian material pada bulan ini.</p>
            </div>
            <div v-else class="material-usage-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div v-for="item in monthlyMaterialUsage" :key="item.nama" class="material-usage-row" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div class="font-semibold" style="font-size: 0.875rem; color: #ffffff;">{{ item.nama }}</div>
                  <div class="text-xs text-muted flex items-center gap-2 mt-1">
                    <span>Part No: <strong style="color: rgba(255, 255, 255, 0.7);">{{ item.part_number }}</strong></span>
                    <span style="color: rgba(255, 255, 255, 0.2);">|</span>
                    <span class="badge badge-secondary" style="font-size: 0.65rem; padding: 0.15rem 0.35rem;">{{ item.unitsText }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-success" style="font-size: 1rem; color: #10b981;">
                    {{ item.jumlah }} <span class="text-xs font-normal text-muted" style="color: rgba(255, 255, 255, 0.4);">{{ item.satuan }}</span>
                  </div>
                  <div v-if="getDrumEquivalent(item.nama, item.jumlah)" class="text-xs text-muted mt-0.5" style="font-style: italic; opacity: 0.8;">
                    {{ getDrumEquivalent(item.nama, item.jumlah) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

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
                <th class="hidden sm:table-cell" style="min-width: 120px;">Catatan</th>
                <th style="min-width: 80px;" class="text-center">Aksi</th>
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
                <td class="text-xs text-muted hidden sm:table-cell truncate" style="max-width: 150px;" :title="formatCatatan(item.catatan)">{{ formatCatatan(item.catatan) }}</td>
                <td>
                  <div class="flex justify-center">
                    <NuxtLink :to="`/realisasi/detail/${item.id}`" class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                      Lihat Detail &rarr;
                    </NuxtLink>
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
  </div>
</template>

<script setup lang="ts">
import { useEngines } from '~/composables/useEngines'
const { engines } = useEngines()

const viewMode = ref('table')
const filters = reactive({ start: '', end: '', unit: [] as number[], jenis_pm: [] as string[], sort: 'desc', page: 1, limit: 10 })
const responseData = ref<any>(null)
const calendarData = ref<any>(null)
const pending = ref(false)
const showMobileFilter = ref(false)

const activeCalendarDate = ref(new Date())

const materialConfigs = ref<any[]>([])

const loadConfigs = async () => {
  try {
    const res = await fetch('/api/materials/usage')
    if (res.ok) {
      const json = await res.json()
      const flat: any[] = []
      for (const [key, items] of Object.entries(json.data as Record<string, any[]>)) {
        const unitMatch = key.match(/\(Unit (\d+)\)/)
        const unit = unitMatch ? parseInt(unitMatch[1]) : 0
        const mesin = key.replace(/\s\(Unit \d+\)/, '')
        flat.push({
          unit,
          mesin,
          material: items.map((it: any) => ({
            nama: it.material_name,
            part_number: it.part_number,
            jumlah: it.qty_per_pm,
            satuan: it.satuan,
            cycle: it.cycle
          }))
        })
      }
      materialConfigs.value = flat
    }
  } catch (err) {
    console.error('Failed to load configs', err)
  }
}

const handleMonthChange = (date: Date) => {
  activeCalendarDate.value = date
}

const formatMonthYear = (date: Date) => {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

const monthlyStatistics = computed(() => {
  const sourceData = calendarData.value?.data || []
  const month = activeCalendarDate.value.getMonth()
  const year = activeCalendarDate.value.getFullYear()

  // Filter realizations by active month
  const monthlyRealizations = sourceData.filter((item: any) => {
    const d = new Date(item.tanggal_pelaksanaan)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // Initialize statistics for each engine/unit
  const stats = engines.value.map((engine: any) => ({
    unit: engine.unit,
    mesin: engine.mesin,
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0,
    P5: 0,
    total: 0
  }))

  // Count PM types for each monthly realization
  monthlyRealizations.forEach((item: any) => {
    const stat = stats.find((s: any) => s.unit === Number(item.unit))
    if (stat) {
      const pmType = item.jenis_pm
      if (pmType && ['P1', 'P2', 'P3', 'P4', 'P5'].includes(pmType)) {
        stat[pmType as 'P1' | 'P2' | 'P3' | 'P4' | 'P5']++
      }
      stat.total++
    }
  })

  return stats
})

const totalMonthlyStats = computed(() => {
  const stats = monthlyStatistics.value
  return stats.reduce((acc: any, curr: any) => {
    acc.P1 += curr.P1
    acc.P2 += curr.P2
    acc.P3 += curr.P3
    acc.P4 += curr.P4
    acc.P5 += curr.P5
    acc.total += curr.total
    return acc
  }, { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0, total: 0 })
})

const monthlyMaterialUsage = computed(() => {
  const sourceData = calendarData.value?.data || []
  const month = activeCalendarDate.value.getMonth()
  const year = activeCalendarDate.value.getFullYear()

  // Filter realizations by active month
  const monthlyRealizations = sourceData.filter((item: any) => {
    const d = new Date(item.tanggal_pelaksanaan)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // Collect actual material usage: { nama, part_number, jumlah, satuan, units: Set<number> }
  const usageMap = new Map<string, { nama: string, part_number: string, jumlah: number, satuan: string, units: Set<number> }>()

  monthlyRealizations.forEach((realization: any) => {
    const unitNumber = Number(realization.unit)
    const actualMaterials = realization.materials || []

    actualMaterials.forEach((mat: any) => {
      // We only sum up materials with positive realized quantity (jumlah_realisasi > 0)
      const qty = Number(mat.jumlah_realisasi || 0)
      if (qty <= 0) return

      const matName = mat.nama_material
      // Try to find the part_number of this material from our fastMovingMaterials definition so we have complete data
      let partNumber = '-'
      const unitFm = materialConfigs.value.find((f: any) => f.unit === unitNumber)
      if (unitFm) {
        const match = unitFm.material.find((m: any) => m.nama.toLowerCase() === matName.toLowerCase())
        if (match && match.part_number) {
          partNumber = match.part_number
        }
      }

      const key = `${matName}-${partNumber}`
      if (usageMap.has(key)) {
        usageMap.get(key)!.jumlah += qty
        usageMap.get(key)!.units.add(unitNumber)
      } else {
        usageMap.set(key, {
          nama: matName,
          part_number: partNumber,
          jumlah: qty,
          satuan: mat.satuan || 'buah',
          units: new Set([unitNumber])
        })
      }
    })
  })

  return Array.from(usageMap.values()).map(item => ({
    ...item,
    unitsText: `Unit ${Array.from(item.units).sort((a, b) => a - b).join(', ')}`
  })).sort((a, b) => a.nama.localeCompare(b.nama))
})

const getDrumEquivalent = (nama: string, jumlah: number) => {
  if (nama.toLowerCase().includes('lube oil') || nama.toLowerCase().includes('oli')) {
    const drums = (jumlah / 209).toFixed(1)
    return `≈ ${drums} Drum`
  }
  return null
}

const getShortEngineName = (name: string) => {
  if (!name) return '-'
  const lower = name.toLowerCase()
  if (lower.includes('swd')) return 'SWD'
  if (lower.includes('deutz')) return 'Deutz'
  if (lower.includes('mitsubishi')) return 'Mitsubishi'
  if (lower.includes('cummins')) return 'Cummins'
  return name
}

const router = useRouter()

const refresh = async () => {
  pending.value = true
  try {
    const q = new URLSearchParams()
    if (filters.start) q.set('start', filters.start)
    if (filters.end) q.set('end', filters.end)
    if (filters.unit && filters.unit.length > 0) q.set('unit', filters.unit.join(','))
    if (filters.jenis_pm && filters.jenis_pm.length > 0) q.set('jenis_pm', filters.jenis_pm.join(','))
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
  if (filters.jenis_pm && filters.jenis_pm.length > 0) q.set('jenis_pm', filters.jenis_pm.join(','))
  q.set('limit', '0')
  const res = await fetch(`/api/pm/realizations?${q.toString()}`)
  if (res.ok) calendarData.value = await res.json()
}

onMounted(() => {
  refresh()
  loadConfigs()
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

const handleEventClick = (event: any) => {
  router.push(`/realisasi/detail/${event.id}`)
}

const handleDownloadCalendar = async (date: Date) => {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  
  try {
    // Show loading state if we want, but since it's just a file download it might be quick
    const url = `/api/pm/download-realisasi?month=${month}&year=${year}`
    const response = await fetch(url)
    
    if (!response.ok) throw new Error('Download failed')
      
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    
    const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
    a.download = `Realisasi PM ${monthNames[month - 1]} ${year}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading realisasi:', error)
    showAlert('Gagal mengunduh file Excel.', 'error')
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
  filters.jenis_pm = []
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

const listIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
const calendarIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const viewOptions = [
  { value: 'table', label: 'Data', icon: listIcon },
  { value: 'calendar', label: 'Kalender', icon: calendarIcon }
]
</script>

<style>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}

.realisasi-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; align-items: end; }
.realisasi-filter-actions { display: flex; flex-direction: column; justify-content: flex-end; }
@media (min-width: 768px) {
  .realisasi-filter-grid { grid-template-columns: 1fr 1fr 1fr auto; }
  .realisasi-filter-actions .form-label { display: block !important; }
}

.table-mobile-optimized th, .table-mobile-optimized td { padding: 0.5rem; font-size: 0.775rem; }
@media (min-width: 640px) { .table-mobile-optimized th, .table-mobile-optimized td { padding: var(--space-3) var(--space-4); font-size: var(--font-size-sm); } }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.whitespace-nowrap { white-space: nowrap; }

/* Statistics Badge Styles */
.badge-pm-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.85rem;
  height: 1.85rem;
  padding: 0 0.35rem;
  border-radius: 6px;
  font-size: 0.825rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.badge-pm-count.empty {
  color: rgba(255, 255, 255, 0.12);
  background-color: transparent;
  font-weight: 400;
}
.badge-pm-count.active {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.badge-info-subtle {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.badge-success-subtle {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.badge-warning-subtle {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.badge-danger-subtle {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.badge-primary-subtle {
  background-color: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.badge-total {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Grid Layout for Stats & Materials */
.realisasi-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .realisasi-stats-grid {
    grid-template-columns: 1.4fr 1fr;
  }
}

.mobile-only-mesin {
  display: none;
}
@media (max-width: 767px) {
  .mobile-hidden-mesin {
    display: none;
  }
  .mobile-only-mesin {
    display: inline;
  }
}
</style>
