<template>
  <div class="animate-fade-in">
    <!-- Category Switcher -->
    <div class="flex justify-center mb-6 mt-1">
      <SegmentedControl
        :options="categoryOptions"
        v-model="materialCategory"
        style="width: 100%; max-width: 400px;"
      />
    </div>

    <div class="page-header">
      <h1 class="home-title m-0">Material Essential</h1>
      <div class="page-header-actions">
        <SegmentedControl
          :options="tabOptions"
          v-model="activeTab"
        />
      </div>
    </div>

    <!-- ==================== TAB 1: STOK GUDANG ==================== -->
    <template v-if="activeTab === 'stock'">
      <template v-if="!showMaterialForm">
        <div class="flex justify-between items-center mb-3">
          <button class="btn btn-primary btn-sm mobile-only" style="background-color: var(--primary-700);" @click="openMaterialForm">+ Tambah Material</button>
          <button class="btn btn-secondary btn-sm mobile-only ml-auto" @click="showMobileStockFilter = !showMobileStockFilter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {{ showMobileStockFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
          </button>
        </div>

        <div class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobileStockFilter }">
          <div class="card-body">
            <div class="material-filter-row flex-wrap" style="gap: 12px;">
              <div class="form-group mb-0 flex-1" style="min-width: 250px;">
                <label class="form-label">Cari Material</label>
                <div class="search-input-wrapper">
                  <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" v-model="stockSearch" class="form-input form-input-sm search-input-field" placeholder="Ketik nama atau part number..." />
                </div>
              </div>
              <div class="form-group mb-0" style="min-width: 200px;">
                <label class="form-label">Urutkan</label>
                <select v-model="stockSort" class="form-input form-input-sm">
                  <option value="name_asc">Nama A–Z</option>
                  <option value="name_desc">Nama Z–A</option>
                  <option value="stock_asc">Stok Terendah</option>
                  <option value="stock_desc">Stok Tertinggi</option>
                </select>
              </div>
              <div class="form-group mb-0 material-filter-action" style="flex: 1; display: flex; align-items: flex-end; justify-content: flex-end;">
                <label class="form-label desktop-only">&nbsp;</label>
                <div class="flex gap-2 flex-wrap justify-end">
                  <button class="btn btn-primary btn-sm ml-auto desktop-only" style="background-color: var(--primary-700);" @click="openMaterialForm">+ Tambah Material</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div v-if="filteredInventory.length === 0" class="card">
        <div class="card-body text-center py-8">
          <div class="empty-icon">📦</div>
          <p class="text-muted text-lg">Tidak ada data material ditemukan</p>
        </div>
      </div>

      <template v-else>
        <!-- Mobile Cards -->
        <div class="material-card-list mobile-only">
          <div v-for="item in filteredInventory" :key="item.id" class="material-stock-card mb-3 cursor-pointer" @click="navigateTo(`/material/detail/${item.id}?type=essential`)">
            <div class="material-stock-header" style="align-items: flex-start;">
              <div>
                <div class="material-stock-name">{{ item.name }}</div>
                <div v-if="item.category" class="cycle-range-tag mt-1" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-flex;">
                  {{ item.category }}
                </div>
              </div>
              <div class="text-right">
                <div :class="['stock-badge', getStockLevel(item.current_stock)]">
                  {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                </div>
              </div>
            </div>
            <div class="material-stock-meta flex justify-between mt-3 px-2 py-2" style="background: rgba(255,255,255,0.03); border-radius: 6px;">
              <div>
                <div class="text-xs text-muted">Part Number</div>
                <span class="material-part-number" style="font-family: monospace;">{{ item.part_number || '-' }}</span>
              </div>
              <div class="text-right">
                <div class="text-xs text-muted">Batas Minimum</div>
                <span class="text-sm font-semibold">{{ item.min_stock }} {{ item.satuan }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="card desktop-only">
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50px;" class="text-center">NO</th>
                  <th>NAMA MATERIAL & KATEGORI</th>
                  <th class="text-center">PART NUMBER</th>
                  <th class="text-center">STOCK SAAT INI</th>
                  <th class="text-center">BATAS MINIMUM</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredInventory" :key="item.id" class="cursor-pointer hover:bg-white/5" @click="navigateTo(`/material/detail/${item.id}?type=essential`)" title="Klik untuk rincian">
                  <td class="text-center text-muted">{{ index + 1 }}</td>
                  <td>
                    <div class="font-semibold">{{ item.name }}</div>
                    <div v-if="item.category" class="cycle-range-tag mt-1" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-flex;">
                      {{ item.category }}
                    </div>
                  </td>
                  <td class="text-center text-muted" style="font-family: monospace;">{{ item.part_number || '-' }}</td>
                  <td class="text-center">
                    <div>
                      <span :class="['stock-badge', getStockLevel(item.current_stock)]">
                        {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                      </span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="text-muted font-semibold">{{ formatNumber(item.min_stock) }} {{ item.satuan }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
      </template>

      <!-- FORM INLINE UNTUK TAMBAH MATERIAL -->
      <template v-else>
        <div class="flex items-center gap-4 mb-6 mt-2">
          <button class="btn-back" @click="closeMaterialForm" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 class="home-title m-0" style="font-size: 1.5rem;">Input Data Material</h1>
        </div>

        <form @submit.prevent="submitMaterial" class="card">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Nama Material <span class="text-danger">*</span></label>
                <input type="text" v-model="materialForm.name" class="form-input" required placeholder="Contoh: Majun Putih" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Part Number</label>
                <input type="text" v-model="materialForm.part_number" class="form-input" placeholder="Contoh: MJN-001 (Opsional)" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Satuan <span class="text-danger">*</span></label>
                <input type="text" v-model="materialForm.unit" class="form-input" required placeholder="Contoh: Kg, Pcs, Liter" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Stok Awal <span class="text-danger">*</span></label>
                <input type="number" v-model="materialForm.current_stock" class="form-input" required min="0" step="any" />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Status <span class="text-danger">*</span></label>
                <select v-model="materialForm.status" class="form-input" required>
                  <option value="Baru">Baru</option>
                  <option value="Bekas">Bekas</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Spesifikasi Material</label>
              <textarea v-model="materialForm.spesification" class="form-input" rows="3" placeholder="Detail spesifikasi, ukuran, parameter teknis (opsional)"></textarea>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Catatan (Notes)</label>
              <textarea v-model="materialForm.notes" class="form-input" rows="3" placeholder="Tambahkan catatan penting terkait material ini (opsional)"></textarea>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Jenis Mesin <span class="text-danger">*</span></label>
              <div class="engine-selection-box p-4" style="background: rgba(0,0,0,0.1); border-radius: 8px; border: 1px solid var(--glass-border);">
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label class="custom-checkbox flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5" style="border: 1px solid rgba(255,255,255,0.05); background: rgba(52, 211, 153, 0.05);">
                    <input type="checkbox" v-model="materialForm.isCommon" @change="handleCommonToggle" style="width: 16px; height: 16px;" />
                    <span class="text-sm font-medium text-emerald-400">Common</span>
                  </label>

                  <label v-for="engine in availableEngines" :key="engine.id" class="custom-checkbox flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5" style="border: 1px solid rgba(255,255,255,0.05);">
                    <input type="checkbox" :value="engine.value" v-model="materialForm.engines" style="width: 16px; height: 16px;" />
                    <span class="text-sm font-medium">{{ engine.label }}</span>
                  </label>
                </div>
                <small class="text-muted block mt-3">Keterangan: Common berarti material umum yang tidak terikat pada mesin manapun.</small>
              </div>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Foto Material</label>
              <div class="flex items-center gap-3">
                <input type="file" ref="fileInput" @change="handleFileUpload" multiple accept="image/*" class="form-input" style="padding: 10px; flex: 1;" />
                <button type="button" @click="isCameraOpen = true" class="btn btn-secondary flex items-center justify-center gap-2" style="padding: 10px; flex-shrink: 0; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05);" title="Ambil Foto Secara Langsung">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span class="hidden md:inline text-sm font-semibold whitespace-nowrap">Ambil Foto</span>
                </button>
              </div>
              <div v-if="materialForm.imageUrls.length > 0" class="mt-3 flex gap-3 flex-wrap">
                <div v-for="(img, idx) in materialForm.imageUrls" :key="idx" style="position: relative; width: 80px; height: 80px; border-radius: 8px; border: 1px solid var(--glass-border); flex-shrink: 0;">
                  <img :src="img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block;" />
                  <button type="button" @click.prevent="removeImage(idx)" style="position: absolute; top: 4px; right: 4px; background-color: #ef4444; color: #ffffff; border: 1px solid #dc2626; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; padding: 0;" aria-label="Hapus Foto" title="Hapus foto ini">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
              <small class="text-muted block mt-2">Boleh lebih dari 1 foto. Kosongkan jika ingin menggunakan gambar placeholder.</small>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
              <button type="button" class="btn btn-secondary" @click="closeMaterialForm" :disabled="isUploading">Batal</button>
              <button type="submit" class="btn btn-primary flex items-center" :title="(!materialForm.isCommon && materialForm.engines.length === 0) ? 'Pilih minimal satu mesin' : ''" :disabled="(!materialForm.isCommon && materialForm.engines.length === 0) || isUploading">
                <span v-if="isUploading" class="spinner spinner-sm mr-2" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></span>
                {{ isUploading ? 'Menyimpan...' : 'Simpan Material' }}
              </button>
            </div>
          </div>
        </form>
      </template>
    </template>

    <!-- ==================== TAB 2: TRANSAKSI ==================== -->
    <template v-if="activeTab === 'transactions'">
      <template v-if="!showTxnModal">
        <div class="flex justify-between items-center mb-3">
          <button class="btn btn-primary btn-sm mobile-only" style="background-color: var(--primary-700);" @click="openTxnModal">+ Input Transaksi</button>
          <button class="btn btn-secondary btn-sm mobile-only ml-auto" @click="showMobileTxnFilter = !showMobileTxnFilter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {{ showMobileTxnFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
          </button>
        </div>
        <div class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobileTxnFilter }">
          <div class="card-body">
            <div class="material-filter-row flex-wrap" style="gap: 12px;">
              <div class="form-group mb-0" style="min-width: 250px; flex: 2;">
                <label class="form-label">Cari Material</label>
                <select v-model="txnFilterData.material_id" class="form-input form-input-sm">
                  <option value="">Semua Material</option>
                  <option v-for="mat in inventoryData" :key="mat.id" :value="mat.id">
                    {{ mat.name }} ({{ mat.category }})
                  </option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Tipe</label>
                <select v-model="txnFilterData.type" class="form-input form-input-sm w-32">
                  <option value="">Semua Tipe</option>
                  <option value="IN">Masuk</option>
                  <option value="OUT">Keluar</option>
                </select>
              </div>
              <div class="form-group mb-0 material-filter-action" style="flex: 1; display: flex; align-items: flex-end; justify-content: flex-end;">
                <label class="form-label desktop-only">&nbsp;</label>
                <div class="flex gap-2 flex-wrap justify-end">
                  <button class="btn btn-primary btn-sm ml-auto desktop-only" style="background-color: var(--primary-700);" @click="openTxnModal">+ Input Transaksi</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredTxns.length === 0" class="card">
          <div class="card-body text-center py-8">
            <div class="empty-icon">📋</div>
            <p class="text-muted text-lg">Tidak ada data transaksi ditemukan</p>
          </div>
        </div>

        <template v-else>
          <!-- Mobile Cards -->
          <div class="material-card-list mobile-only">
            <div v-for="item in filteredTxns" :key="item.id" class="material-txn-card mb-3">
              <div class="material-txn-header">
                <div class="material-txn-name">{{ item.material_name }}</div>
                <span :class="['txn-type-badge', 'txn-' + item.transaction_type.toLowerCase()]">
                  {{ item.transaction_type === 'OUT' ? 'Keluar' : 'Masuk' }}
                </span>
              </div>
              <div class="material-txn-details">
                <div class="txn-detail-item">
                  <span class="txn-detail-label">Jumlah</span>
                  <span class="txn-detail-value font-semibold">{{ formatNumber(item.quantity) }} {{ item.satuan }}</span>
                </div>
                <div class="txn-detail-item">
                  <span class="txn-detail-label">Tanggal</span>
                  <span class="txn-detail-value">{{ formatDate(item.transaction_date) }}</span>
                </div>
              </div>
              <div v-if="item.notes" class="material-txn-notes">{{ item.notes }}</div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="card desktop-only">
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 50px;" class="text-center">No</th>
                    <th style="min-width: 100px;">Tanggal</th>
                    <th>Material</th>
                    <th class="text-center" style="width: 80px;">Tipe</th>
                    <th class="text-center" style="width: 100px;">Jumlah</th>
                    <th style="width: 80px;">Satuan</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in filteredTxns" :key="item.id">
                    <td class="text-center text-muted">{{ index + 1 }}</td>
                    <td class="whitespace-nowrap">{{ formatDate(item.transaction_date) }}</td>
                    <td class="font-semibold">{{ item.material_name }}</td>
                    <td class="text-center">
                      <span :class="['txn-type-badge', 'txn-' + item.transaction_type.toLowerCase()]">
                        {{ item.transaction_type === 'OUT' ? 'Keluar' : 'Masuk' }}
                      </span>
                    </td>
                    <td class="text-center font-semibold">{{ formatNumber(item.quantity) }}</td>
                    <td>{{ item.satuan }}</td>
                    <td class="text-muted truncate-cell" :title="item.notes">{{ item.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>

      <!-- FORM INLINE UNTUK TRANSAKSI -->
      <template v-else>
        <div class="flex items-center gap-4 mb-6 mt-2">
          <button class="btn-back" @click="closeTxnModal" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 class="home-title m-0" style="font-size: 1.5rem;">Input Transaksi Essential</h1>
        </div>

        <form @submit.prevent="submitTxn" class="card">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Material <span class="text-danger">*</span></label>
                <select v-model="txnForm.material_id" class="form-input" required>
                  <option value="">Pilih Material...</option>
                  <option v-for="item in inventoryData" :key="item.id" :value="item.id">
                    {{ item.name }} - Stock: {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                  </option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Tanggal Transaksi <span class="text-danger">*</span></label>
                <input type="date" v-model="txnForm.transaction_date" class="form-input" required />
                <small class="text-muted" style="display:block; margin-top:0.25rem;">Biarkan default untuk hari ini.</small>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Tipe Transaksi <span class="text-danger">*</span></label>
                <select v-model="txnForm.transaction_type" class="form-input" required>
                  <option value="OUT">Keluar (OUT)</option>
                  <option value="IN">Masuk (IN)</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Jumlah <span class="text-danger">*</span></label>
                <input type="number" v-model="txnForm.quantity" class="form-input" min="0.1" step="any" required />
              </div>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Keterangan (Opsional)</label>
              <textarea v-model="txnForm.notes" class="form-input" rows="3" placeholder="Contoh: Stok Tambahan / Digunakan untuk area tertentu"></textarea>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
              <button type="button" class="btn btn-secondary" @click="closeTxnModal">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan Transaksi</button>
            </div>
          </div>
        </form>
      </template>
    </template>

    <CameraCapture v-model:isOpen="isCameraOpen" @capture="handleCameraCapture" title="FOTO MATERIAL" />
  </div>
</template>

<script setup lang="ts">
import { engines } from '~/utils/pmCycles'

const isCameraOpen = ref(false)
const isUploading = ref(false)
const isFetching = ref(true)

const handleCameraCapture = (file: File) => {
  materialForm.imageFiles.push(file)
  materialForm.imageUrls.push(URL.createObjectURL(file))
}

const categoryOptions = [
  { value: 'fast-moving', label: 'Fast Moving', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { value: 'essential', label: 'Essential', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' }
]

const materialCategory = ref('essential')

watch(materialCategory, (val) => {
  if (val !== 'essential') {
    navigateTo(`/material/${val}`)
  }
})

const activeTab = ref('stock')
const showMobileStockFilter = ref(false)
const showMobileTxnFilter = ref(false)

// ===== MATERIAL ADD FORM =====
const showMaterialForm = ref(false)

const availableEngines = computed(() => {
  const groups: Record<string, number[]> = {}
  engines.forEach(e => {
    if (!groups[e.mesin]) groups[e.mesin] = []
    groups[e.mesin].push(e.unit)
  })
  
  return Object.entries(groups).map(([mesin, units], idx) => {
    const unitsStr = units.length > 1 
      ? units.slice(0, -1).join(', ') + ' & ' + units[units.length - 1] 
      : units[0]
    return {
      id: idx + 1,
      label: `${mesin} (Unit ${unitsStr})`,
      value: units.join(',')
    }
  })
})

const materialForm = reactive({
  name: '',
  part_number: '',
  unit: '',
  status: 'Baru',
  current_stock: 0,
  notes: '',
  spesification: '',
  isCommon: true,
  engines: [] as string[],
  imageUrls: [] as string[],
  imageFiles: [] as File[]
})

const handleCommonToggle = () => {
  if (materialForm.isCommon) {
    materialForm.engines = []
  }
}

watch(() => materialForm.engines, (val) => {
  if (val.length > 0) {
    materialForm.isCommon = false
  } else {
    materialForm.isCommon = true
  }
}, { deep: true })

const openMaterialForm = () => {
  materialForm.name = ''
  materialForm.part_number = ''
  materialForm.unit = ''
  materialForm.status = 'Baru'
  materialForm.current_stock = 0
  materialForm.notes = ''
  materialForm.spesification = ''
  materialForm.isCommon = true
  materialForm.engines = []
  materialForm.imageUrls.forEach(url => URL.revokeObjectURL(url))
  materialForm.imageUrls = []
  materialForm.imageFiles = []
  showMaterialForm.value = true
}

const closeMaterialForm = () => {
  showMaterialForm.value = false
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  
  Array.from(target.files).forEach(file => {
    materialForm.imageFiles.push(file)
    materialForm.imageUrls.push(URL.createObjectURL(file))
  })
  target.value = ''
}

const removeImage = (idx: number) => {
  materialForm.imageFiles.splice(idx, 1)
  URL.revokeObjectURL(materialForm.imageUrls[idx])
  materialForm.imageUrls.splice(idx, 1)
}

const submitMaterial = async () => {
  if (isUploading.value) return
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('name', materialForm.name)
    formData.append('part_number', materialForm.part_number)
    formData.append('unit', materialForm.unit)
    formData.append('status', materialForm.status)
    formData.append('current_stock', materialForm.current_stock.toString())
    formData.append('notes', materialForm.notes)
    formData.append('spesification', materialForm.spesification)
    formData.append('isCommon', materialForm.isCommon.toString())
    
    materialForm.engines.forEach(engine => {
      formData.append('engines', engine)
    })
    
    materialForm.imageFiles.forEach(file => {
       formData.append('images', file)
    })

    const res: any = await $fetch('/api/materials/essential', {
      method: 'POST',
      body: formData
    })

    closeMaterialForm()
    
    // Optimistic UI update
    inventoryData.value.push({
      id: res.id,
      name: materialForm.name,
      part_number: materialForm.part_number,
      satuan: materialForm.unit,
      current_stock: materialForm.current_stock,
      min_stock: 0,
      category: 'Essential'
    })
    
    showAlert('Material baru beserta gambar berhasil disimpan.', 'success')
  } catch (error) {
    console.error('Submit error:', error)
    showAlert('Terjadi kesalahan saat menyimpan material.', 'error')
  } finally {
    isUploading.value = false
  }
}

// State Data: Material Essential (siap dihubungkan ke API)
const inventoryData = ref<any[]>([])
const txnData = ref<any[]>([])

onMounted(async () => {
  isFetching.value = true
  try {
    const res: any = await $fetch('/api/materials/essential')
    if (res && res.success) {
      inventoryData.value = res.inventory || []
      txnData.value = res.transactions || []
    }
  } catch(e) {
    console.error('Error fetching essential data:', e)
  } finally {
    isFetching.value = false
  }
})

// ===== STOCK TAB =====
const stockSearch = ref('')
const stockSort = ref('name_asc')

const filteredInventory = computed(() => {
  let mapped = inventoryData.value

  if (stockSearch.value) {
    const term = stockSearch.value.toLowerCase()
    mapped = mapped.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.part_number && item.part_number.toLowerCase().includes(term))
    )
  }

  mapped.sort((a, b) => {
    if (stockSort.value === 'name_asc') return a.name.localeCompare(b.name)
    if (stockSort.value === 'name_desc') return b.name.localeCompare(a.name)
    if (stockSort.value === 'stock_asc') return a.current_stock - b.current_stock
    if (stockSort.value === 'stock_desc') return b.current_stock - a.current_stock
    return 0
  })

  return mapped
})

// ===== TRANSACTIONS TAB =====
const txnFilterData = reactive({ type: '', material_id: '' })

const filteredTxns = computed(() => {
  let mapped = txnData.value.slice() // Clone

  if (txnFilterData.material_id) {
    const matName = inventoryData.value.find(i => i.id == parseInt(txnFilterData.material_id))?.name
    if (matName) mapped = mapped.filter(t => t.material_name === matName)
  }
  
  if (txnFilterData.type) {
    mapped = mapped.filter(t => t.transaction_type === txnFilterData.type)
  }

  // Sort latest first
  mapped.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())

  return mapped
})

// ===== TXN MODAL FORM =====
const showTxnModal = ref(false)
const txnForm = reactive({
  material_id: '',
  transaction_type: 'OUT',
  quantity: '1',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: ''
})

const openTxnModal = () => {
  txnForm.material_id = ''
  txnForm.transaction_type = 'OUT'
  txnForm.quantity = '1'
  txnForm.transaction_date = new Date().toISOString().slice(0, 10)
  txnForm.notes = ''
  showTxnModal.value = true
}

const closeTxnModal = () => {
  showTxnModal.value = false
}

const submitTxn = () => {
  showAlert('Transaksi essential berhasil disimpan (Data saat ini bersifat statis mockup).', 'success')
  closeTxnModal()
}

// ===== HELPERS =====
const formatNumber = (num: any) => parseFloat(num).toLocaleString('id-ID')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

const getStockLevel = (stock: number) => {
  if (stock <= 0) return 'stock-empty'
  if (stock <= 10) return 'stock-low'
  if (stock <= 50) return 'stock-medium'
  return 'stock-good'
}

// Tab options with icons
const stockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
const txnIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>'

const tabOptions = [
  { value: 'stock', label: 'Stok', icon: stockIcon },
  { value: 'transactions', label: 'Transaksi', icon: txnIcon },
]
</script>

<style scoped>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}

.material-filter-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .material-filter-row {
    flex-direction: row;
    align-items: flex-end;
  }
  .material-filter-row > .form-group { min-width: 160px; }
  .material-filter-action .form-label { display: block !important; }
}

.search-input-wrapper {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  pointer-events: none;
}
.search-input-field {
  padding-left: 2.25rem !important;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.stock-good { background: var(--success-light); color: var(--success); }
.stock-medium { background: var(--warning-light); color: var(--warning); }
.stock-low { background: var(--danger-light); color: var(--danger); }
.stock-empty { background: rgba(239, 68, 68, 0.3); color: #f87171; box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }

.txn-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.txn-out { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
.txn-in { background: rgba(52, 211, 153, 0.15); color: #34d399; }

.cycle-range-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  color: var(--gray-600);
  letter-spacing: 0.02em;
}
</style>
