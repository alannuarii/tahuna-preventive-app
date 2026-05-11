<template>
  <div class="animate-fade-in pb-8">
    <!-- Unified Back Button & Header -->
    <div class="detail-page-header mb-6">
      <button class="btn-back" @click="goBack" aria-label="Kembali">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>
      <div class="detail-page-title-wrapper">
        <h1 class="home-title m-0">{{ getEngineTitle() }}</h1>
        <span class="badge badge-primary badge-sm ml-2 desktop-only">Technical Specs</span>
      </div>
    </div>

    <div class="container py-0">
      <div v-if="pending" class="loading-container">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted mt-2">Memuat spesifikasi...</p>
      </div>

      <div v-else-if="error" class="card p-6 text-center">
        <h3 class="text-danger font-bold mb-2">Gagal Memuat Data</h3>
        <p class="text-muted">Data spesifikasi mesin ini belum tersedia atau terjadi kesalahan.</p>
      </div>

      <div v-else-if="specData">
        <div class="flex flex-col gap-6">
          <!-- Render all dynamic keys -->
          <template v-for="(value, key) in cleanedData" :key="key">
            <div v-if="isObject(value)" class="card spec-group-card animate-fade">
              <div class="card-header bg-gradient-header">
                <h3 class="text-base font-bold tracking-wide uppercase flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-300">
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                  </svg>
                  <div class="flex flex-col">
                    <span>{{ processEntry(key, {}).formattedKeyEn }}</span>
                    <span class="text-xs text-muted italic font-normal normal-case">{{ processEntry(key, {}).formattedKeyId }}</span>
                  </div>
                </h3>
              </div>
              <div class="card-body p-0">
                <div class="spec-grid">
                  <div v-for="(subVal, subKey) in value" :key="subKey" class="spec-row">
                    <template v-if="processEntry(subKey, subVal)">
                      <div class="spec-label flex flex-col">
                        <span class="spec-label-en">{{ processEntry(subKey, subVal).formattedKeyEn }}</span>
                        <span class="spec-label-id">{{ processEntry(subKey, subVal).formattedKeyId }}</span>
                      </div>
                      <div class="spec-value">
                        <template v-if="isObject(subVal)">
                          <div class="nested-values">
                            <div v-for="(nv, nk) in subVal" :key="nk" class="nested-val-row">
                              <template v-if="processEntry(nk, nv)">
                                <div class="nested-key flex flex-col">
                                  <span class="spec-label-en" style="font-size:0.7rem">{{ processEntry(nk, nv).formattedKeyEn }}</span>
                                  <span class="spec-label-id">{{ processEntry(nk, nv).formattedKeyId }}</span>
                                </div>
                                <span class="nested-val">{{ processEntry(nk, nv).formattedValue }}</span>
                              </template>
                            </div>
                          </div>
                        </template>
                        <template v-else>
                          {{ processEntry(subKey, subVal).formattedValue }}
                        </template>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Group non-object properties into a General specifications card -->
          <div v-if="hasDirectProperties" class="card spec-group-card animate-fade">
            <div class="card-header bg-gradient-header">
              <h3 class="text-base font-bold tracking-wide uppercase flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-300">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div class="flex flex-col">
                  <span>General Parameters</span>
                  <span class="text-xs text-muted italic font-normal normal-case">Parameter Umum</span>
                </div>
              </h3>
            </div>
            <div class="card-body p-0">
              <div class="spec-grid">
                <template v-for="(value, key) in cleanedData" :key="'direct-'+key">
                  <template v-if="!isObject(value) && key !== 'engine_model' && key !== 'model_mesin' && processEntry(key, value)">
                    <div class="spec-row">
                      <div class="spec-label flex flex-col">
                        <span class="spec-label-en">{{ processEntry(key, value).formattedKeyEn }}</span>
                        <span class="spec-label-id">{{ processEntry(key, value).formattedKeyId }}</span>
                      </div>
                      <div class="spec-value">{{ processEntry(key, value).formattedValue }}</div>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const engineId = route.params.id as string

const goBack = () => {
  router.back()
}

const { data: specData, pending, error } = await useFetch<any>(`/engine-specifications/${engineId}.json`)

// Pre-defined dictionary mapping canonical identifiers to English/Indonesian tuples
const termDictionary: Record<string, { en: string, id: string }> = {
  // Root groupings
  'spesifikasi_utama': { en: 'Main Specifications', id: 'Spesifikasi Utama' },
  'general_specifications': { en: 'General Specifications', id: 'Spesifikasi Umum' },
  'dimensi_dan_berat': { en: 'Dimensions & Weight', id: 'Dimensi & Berat' },
  'kapasitas_fluida': { en: 'Fluid Capacities', id: 'Kapasitas Fluida' },
  'data_penyesuaian': { en: 'Adjustment Data', id: 'Data Penyesuaian' },
  'data_operasi': { en: 'Operating Data', id: 'Data Operasi' },
  'electrical_system': { en: 'Electrical System', id: 'Sistem Kelistrikan' },
  'fuel_system_specifications': { en: 'Fuel System', id: 'Sistem Bahan Bakar' },
  'fuel_consumption_at_1500_RPM_50Hz': { en: 'Fuel Consumption at 1500 RPM (50Hz)', id: 'Konsumsi Bahan Bakar pada 1500 RPM' },
  'weights': { en: 'Weights', id: 'Berat' },
  'capacities': { en: 'Capacities', id: 'Kapasitas' },
  'pressures': { en: 'Pressures', id: 'Tekanan' },
  'engine_oil_capacity': { en: 'Engine Oil Capacity', id: 'Kapasitas Oli Mesin' },

  // Detailed keys
  'engine_model': { en: 'Engine Model', id: 'Model Mesin' },
  'model_mesin': { en: 'Engine Model', id: 'Model Mesin' },
  'engine_type': { en: 'Engine Type', id: 'Tipe Mesin' },
  'type': { en: 'Type', id: 'Tipe' },
  'mode_operasi': { en: 'Operation Mode', id: 'Mode Operasi' },
  'konfigurasi_silinder': { en: 'Cylinder Config', id: 'Konfigurasi Silinder' },
  'no_of_cylinders_arrangement': { en: 'Cylinder Arrangement', id: 'Susunan Silinder' },
  'number_of_cylinders': { en: 'Number of Cylinders', id: 'Jumlah Silinder' },
  'jumlah_silinder': { en: 'Number of Cylinders', id: 'Jumlah Silinder' },
  'cylinder_bore': { en: 'Cylinder Bore', id: 'Diameter Bor Silinder' },
  'diameter_bor': { en: 'Cylinder Bore', id: 'Diameter Bor Silinder' },
  'langkah_piston': { en: 'Piston Stroke', id: 'Langkah Piston' },
  'stroke': { en: 'Piston Stroke', id: 'Langkah Piston' },
  'cylinder_bore_x_stroke': { en: 'Cylinder Bore x Stroke', id: 'Bore x Stroke Silinder' },
  'swept_volume_per_cylinder': { en: 'Swept Volume / Cyl', id: 'Volume Langkah per Silinder' },
  'kapasitas_per_silinder': { en: 'Displacement / Cyl', id: 'Kapasitas per Silinder' },
  'total_displacement': { en: 'Total Displacement', id: 'Total Pemindahan Silinder' },
  'compression_ratio': { en: 'Compression Ratio', id: 'Rasio Kompresi' },
  'rasio_kompresi': { en: 'Compression Ratio', id: 'Rasio Kompresi' },
  'firing_order': { en: 'Firing Order', id: 'Urutan Pengapian' },
  'urutan_pengapian': { en: 'Firing Order', id: 'Urutan Pengapian' },
  'direction_of_rotation': { en: 'Rotation Direction', id: 'Arah Putaran' },
  'combustion_system': { en: 'Combustion System', id: 'Sistem Pembakaran' },
  'panjang_A': { en: 'Length A', id: 'Panjang A' },
  'lebar_B': { en: 'Width B', id: 'Lebar B' },
  'tinggi_C': { en: 'Height C', id: 'Tinggi C' },
  'dimensions_l_x_w_x_h': { en: 'Dimensions (LxWxH)', id: 'Dimensi (PxLxT)' },
  'berat': { en: 'Weight', id: 'Berat' },
  'maximum_weight_wet': { en: 'Max Weight (Wet)', id: 'Berat Maksimum (Basah)' },
  'dry_weight': { en: 'Dry Weight', id: 'Berat Kering' },
  'dry_weight_approx': { en: 'Approx Dry Weight', id: 'Perkiraan Berat Kering' },
  'wet_weight_approx': { en: 'Approx Wet Weight', id: 'Perkiraan Berat Basah' },
  'piston_and_connecting_rod': { en: 'Piston & Conrod', id: 'Piston dan Batang Penghubung' },
  'cylinder_head': { en: 'Cylinder Head', id: 'Kepala Silinder' },
  'volume_minyak_lumas_carter': { en: 'Lube Oil Carter Vol', id: 'Volume Minyak Lumas Carter' },
  'volume_cairan_pendingin_mesin': { en: 'Engine Coolant Vol', id: 'Volume Cairan Pendingin Mesin' },
  'cooling_system_capacity_standard_radiator': { en: 'Radiator Capacity', id: 'Kapasitas Sistem Pendingin' },
  'lubricating_system_oil_capacity_with_filters': { en: 'Total Lube Oil Capacity', id: 'Total Kapasitas Oli Pelumas' },
  'oil_filling_crankcase': { en: 'Crankcase Oil Filling', id: 'Pengisian Oli Bak Mesin' },
  'cooling_water_without_heat_exchanger': { en: 'Cooling Water (No HX)', id: 'Air Pendingin (Tanpa Heat Exch.)' },
  'oil_pan': { en: 'Oil Pan', id: 'Bak Oli' },
  'entire_engine': { en: 'Entire Engine', id: 'Keseluruhan Mesin' },
  'starting_air': { en: 'Starting Air', id: 'Udara Starter' },
  'atomiser_opening_pressure': { en: 'Atomiser Opening Pres.', id: 'Tekanan Pembukaan Atomizer' },
  'celah_katup_masuk': { en: 'Inlet Valve Clearance', id: 'Celah Katup Masuk' },
  'celah_katup_buang': { en: 'Exhaust Valve Clearance', id: 'Celah Katup Buang' },
  'tekanan_pembukaan_injektor': { en: 'Injector Opening Pres.', id: 'Tekanan Pembukaan Injektor' },
  'laju_aliran_pompa_minyak_lumas': { en: 'Lube Oil Pump Flow', id: 'Laju Pompa Minyak Lumas' },
  'suhu_maksimal_minyak_lumas': { en: 'Max Lube Oil Temp', id: 'Suhu Maksimal Minyak Lumas' },
  'laju_aliran_pompa_pendingin_HT': { en: 'HT Coolant Pump Flow', id: 'Laju Pompa Pendingin HT' },
  'tekanan_aliran_pompa_pendingin_HT': { en: 'HT Coolant Pressure', id: 'Tekanan Aliran Pendingin HT' },
  'starting_voltage': { en: 'Starting Voltage', id: 'Tegangan Starter' },
  'battery_group_number': { en: 'Battery Group', id: 'Nomor Grup Baterai' },
  'cca_minimum_A_at_0_to_32_F': { en: 'CCA Minimum', id: 'CCA Minimum' },
  'max_fuel_inlet_restriction': { en: 'Max Fuel Inlet Restr.', id: 'Restriksi Saluran Masuk BB Maks' },
  'max_fuel_return_restriction': { en: 'Max Fuel Return Restr.', id: 'Restriksi Saluran Kembali BB Maks' },
  'fuel_pump_flow_rate': { en: 'Fuel Pump Flow Rate', id: 'Laju Alir Pompa Bahan Bakar' },
  'standby_full_load': { en: 'Standby Full Load', id: 'Standby Beban Penuh' },
  'prime_full_load': { en: 'Prime Full Load', id: 'Prime Beban Penuh' },
  'mgs_set_model': { en: 'MGS Set Model', id: 'Model Set MGS' },
  'maximum_speed': { en: 'Maximum Speed', id: 'Kecepatan Maksimum' },
  'fuel': { en: 'Fuel Type', id: 'Jenis Bahan Bakar' },
  'fuel_injection_pump': { en: 'Fuel Inject Pump', id: 'Pompa Injeksi Bahan Bakar' },
  'governor': { en: 'Governor', id: 'Gubernur / Governor' },
  'fuel_filter': { en: 'Fuel Filter', id: 'Filter Bahan Bakar' },
  'fuel_injection_nozzle': { en: 'Injector Nozzle', id: 'Nosel Injeksi Bahan Bakar' },
  'fuel_injection_starting_pressure': { en: 'Inject Starting Press', id: 'Tekanan Awal Injeksi BB' },
  'lubricating_method': { en: 'Lubrication Method', id: 'Metode Pelumasan' },
  'engine_oil': { en: 'Engine Oil', id: 'Oli Mesin' },
  'oil_filter': { en: 'Oil Filter', id: 'Filter Oli' },
  'oil_cooler': { en: 'Oil Cooler', id: 'Pendingin Oli' },
  'cooling_method': { en: 'Cooling Method', id: 'Metode Pendinginan' },
  'coolant_capacity': { en: 'Coolant Capacity', id: 'Kapasitas Cairan Pendingin' },
  'starting_system': { en: 'Starting System', id: 'Sistem Starter' },
  'starter': { en: 'Starter', id: 'Starter' },
  'alternator': { en: 'Alternator', id: 'Alternator' },
  'turbocharger': { en: 'Turbocharger', id: 'Turbocharger' },
}

const unitsMap = [
  { suffix: '_kg_cm2', label: 'kg/cm²' },
  { suffix: '_L_hr', label: 'L/hr' },
  { suffix: '_dm3_min', label: 'dm³/min' },
  { suffix: '_m3_h', label: 'm³/h' },
  { suffix: '_mm', label: 'mm' },
  { suffix: '_kg', label: 'kg' },
  { suffix: '_lb', label: 'lb' },
  { suffix: '_L', label: 'L' },
  { suffix: '_DC', label: 'DC' },
  { suffix: '_mmHg', label: 'mmHg' },
  { suffix: '_dm3', label: 'dm³' },
  { suffix: '_bar', label: 'bar' },
  { suffix: '_celcius', label: '°C' },
  { suffix: '_rpm', label: 'RPM' },
  { suffix: '_liters', label: 'Liters' },
]

const processEntry = (rawKey: string, rawValue: any) => {
  let baseKey = rawKey
  let unitDisplay = null

  // Strip unit suffix first
  for (const item of unitsMap) {
    if (rawKey.endsWith(item.suffix)) {
      unitDisplay = item.label
      baseKey = rawKey.slice(0, -item.suffix.length)
      break
    }
  }

  let formattedKeyEn = formatKey(baseKey)
  let formattedKeyId = formatKey(baseKey)

  // Lookup translation from our local glossary
  if (termDictionary[baseKey]) {
    formattedKeyEn = termDictionary[baseKey].en
    formattedKeyId = termDictionary[baseKey].id
  } else if (termDictionary[rawKey]) { // fallback if rawKey without stripping had a match
    formattedKeyEn = termDictionary[rawKey].en
    formattedKeyId = termDictionary[rawKey].id
  }
  
  let formattedValue = rawValue
  if (unitDisplay && typeof rawValue !== 'object' && rawValue !== null) {
    formattedValue = `${rawValue} ${unitDisplay}`
  }

  return { formattedKeyEn, formattedKeyId, formattedValue }
}

const getEngineTitle = () => {
  if (!specData.value) return 'Technical Specs'
  if (specData.value.engine_model) return specData.value.engine_model
  if (specData.value.spesifikasi_utama && specData.value.spesifikasi_utama.model_mesin) {
    return specData.value.spesifikasi_utama.model_mesin
  }
  const map: Record<string, string> = {
    swd: 'SWD 6 FHD 240 / 6 FDHD 240',
    deutz: 'Deutz MWM TBD 616 V12',
    mitsubishi: 'Mitsubishi S16R-PTA-S',
    cummins: 'Cummins KTA50-G8'
  }
  return map[engineId] || engineId.toUpperCase()
}

useHead({
  title: computed(() => `${getEngineTitle()} - PLTD Tahuna`)
})

const hasDirectProperties = computed(() => {
  if (!specData.value) return false
  return Object.entries(specData.value).some(([key, val]) => 
    !isObject(val) && key !== 'engine_model' && key !== 'model_mesin'
  )
})

const cleanedData = computed(() => specData.value || {})
const isObject = (val: any) => typeof val === 'object' && val !== null && !Array.isArray(val)
const formatKey = (key: string) => {
  if (!key) return ''
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()
}
</script>

<style>
/* Shared layouts with global consistency */
.detail-page-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
.detail-page-title-wrapper { display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0; }
.detail-page-title-wrapper .home-title { margin-bottom: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: var(--font-size-xl); font-weight: 700; color: var(--gray-900); }

@media (max-width: 640px) {
  .detail-page-title-wrapper .home-title { font-size: var(--font-size-lg); }
}
</style>

<style scoped>
.bg-gradient-header {
  background: linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent);
}
.spec-group-card {
  border-left: 3px solid var(--primary-400);
  overflow: hidden;
}
.spec-grid { display: flex; flex-direction: column; }
.spec-row { display: flex; flex-direction: column; padding: var(--space-3) var(--space-5); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.spec-row:last-child { border-bottom: none; }
.spec-row:hover { background: rgba(255, 255, 255, 0.02); }

@media (min-width: 768px) {
  .spec-row { flex-direction: row; align-items: center; padding: var(--space-4) var(--space-5); }
  .spec-label { width: 40%; padding-right: var(--space-4); margin-bottom: 0; }
  .spec-value { width: 60%; text-align: left; margin-top: 0; }
}

.spec-label { 
  margin-bottom: 6px;
}

.spec-label-en {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-300);
  font-weight: 600;
  opacity: 0.9;
}

.spec-label-id {
  font-size: 0.65rem;
  color: var(--gray-500);
  font-style: italic;
  margin-top: 1px;
}

.spec-value { 
  color: #ffffff; 
  font-size: 0.95rem; 
  font-weight: 600; 
  word-break: break-word;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@media (min-width: 768px) {
  .spec-value {
    background: transparent;
    padding: 0;
    border: none;
  }
}

.nested-values { display: flex; flex-direction: column; gap: var(--space-2); background: rgba(0,0,0,0.3); padding: var(--space-3); border-radius: var(--radius-md); width: 100%; }
.nested-val-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: var(--space-2); margin-bottom: var(--space-1); }
.nested-val-row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.nested-key { color: var(--gray-500); font-weight: 500; }
.nested-val { color: var(--primary-300); font-weight: 700; }
.animate-fade { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
