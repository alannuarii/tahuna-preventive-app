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
        <h1 class="home-title m-0">Rincian Material</h1>
        <span class="badge" :class="itemType === 'essential' ? 'badge-primary' : 'badge-info'" style="margin-left: 10px;">
          {{ itemType === 'essential' ? 'Essential' : 'Fast Moving' }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container p-8" style="min-height: 40vh;">
      <div class="spinner spinner-lg"></div>
      <p class="mt-4 text-muted">Memuat rincian material...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!material" class="card">
      <div class="card-body text-center py-10">
        <div class="empty-icon text-4xl mb-4">📦</div>
        <p class="text-muted text-lg mb-4">Data material tidak ditemukan</p>
        <button class="btn btn-primary" @click="goBack">Kembali</button>
      </div>
    </div>

    <template v-else>
      <template v-if="!isEditing">
        <!-- Hero Product Section (Shopee-like layout) -->
      <div class="material-hero-card">
        <div class="hero-grid">
          
          <!-- Column 1: Image Carousel -->
          <div class="hero-gallery">
            <div class="main-image-wrapper">
              <img :src="images[activeImageIdx]" alt="Gambar Material" class="main-image" />
            </div>
            <div class="thumbnail-list" v-if="images.length > 1">
              <div 
                v-for="(img, idx) in images" 
                :key="idx"
                class="thumbnail-item"
                :class="{ 'active': activeImageIdx === idx }"
                @click="activeImageIdx = idx"
              >
                <img :src="img" alt="Thumbnail" />
              </div>
            </div>
          </div>

          <!-- Column 2: Product Info -->
          <div class="hero-info">
            <div class="flex justify-between items-start mb-4">
              <h2 class="material-name m-0">{{ material.name || material.nama }}</h2>
              
              <!-- Action Buttons -->
              <div v-if="itemType === 'essential'" class="flex gap-2">
                <button class="btn btn-secondary btn-sm" style="padding: 6px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05);" @click="handleEdit" title="Edit Material">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-sm" style="padding: 6px; border: 1px solid #ef4444; color: #ef4444; background: rgba(239,68,68,0.1);" @click="handleDelete" :disabled="isDeleting" title="Hapus Material">
                  <svg v-if="!isDeleting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span v-else class="spinner spinner-xs" style="border-color: rgba(239,68,68,0.3); border-top-color: #ef4444; width: 14px; height: 14px; border-width: 2px;"></span>
                </button>
              </div>
            </div>
            
            <div class="material-meta-block mb-6" style="border-bottom: 1px dashed var(--glass-border); padding-bottom: 16px;">
              <div class="meta-item">
                <span class="meta-label">Part Number</span>
                <span class="meta-value part-number" style="display: inline-block; margin-top: 4px;">{{ material.part_number || '-' }}</span>
              </div>
              <div v-if="material.notes" class="meta-item mt-4 p-3" style="background: rgba(0,0,0,0.03); border-radius: 6px; border-left: 3px solid var(--primary-400);">
                <span class="meta-label">Catatan</span>
                <span class="meta-value text-sm mt-1" style="white-space: pre-line; line-height: 1.5; color: var(--gray-600); font-weight: normal;">{{ material.notes }}</span>
              </div>
            </div>

            <div class="stock-box">
              <div class="stock-header">
                <span class="stock-label">Stok Tersedia</span>
                <span :class="['stock-badge', getStockLevel(material.current_stock)]">
                  {{ formatNumber(material.current_stock) }} {{ material.satuan }}
                </span>
              </div>
              <div class="stock-bar-wrapper">
                <div class="stock-bar-track">
                  <div class="stock-bar-fill" :style="{ width: Math.min((material.current_stock / 100) * 100, 100) + '%' }"></div>
                </div>
                <div class="flex justify-between mt-1 px-1">
                  <span class="text-xs text-muted">0</span>
                </div>
              </div>
            </div>

            <div class="detail-info-list mt-6">
              <div class="detail-info-row" v-if="material.enginesText">
                <span class="detail-info-label">Dapat Digunakan di Unit</span>
                <span class="detail-info-value">{{ material.enginesText }}</span>
              </div>
              <div class="detail-info-row" v-if="material.drumText">
                <span class="detail-info-label">Estimasi Drum</span>
                <span class="detail-info-value">{{ material.drumText }}</span>
              </div>
              <div class="detail-info-row" v-if="material.estHabis">
                <span class="detail-info-label">Sisa Waktu Habis</span>
                <span class="detail-info-value" :class="material.estHabis.days < 30 ? 'text-danger' : ''">
                  {{ material.estHabis.date ? `${material.estHabis.days} Hari (${formatDate(material.estHabis.date)})` : '> 5 Tahun' }}
                </span>
              </div>
            </div>

            <div class="mt-8 flex gap-3 mobile-actions">
              <button class="btn btn-primary flex-1 no-wrap" @click="scrollToTxn">+ Input Transaksi</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div id="txn-section" class="card mt-6 mb-10">
        <div class="card-header flex justify-between items-center w-full flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
            </svg>
            Riwayat Transaksi
            <span class="badge badge-secondary ml-2">{{ txns.length }} Record</span>
          </div>
          
          <button class="btn-sort" @click="toggleTxnSort">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="txnSortDesc" d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/>
              <path v-else d="M11 5h10M11 9h7M11 13h4M3 7l3-3 3 3M6 6v14"/>
            </svg>
            Urutkan: {{ txnSortDesc ? 'Terbaru' : 'Terlama' }}
          </button>
        </div>
        
        <div class="card-body" style="padding: 0;">
          <div v-if="txnPending" class="text-center py-8">
            <div class="spinner spinner-sm"></div>
          </div>
          <div v-else-if="txns.length === 0" class="text-center py-8 text-muted">
            Belum ada transaksi tercatat untuk material ini.
          </div>
          <div v-else>
            <!-- Mobile Transaction List -->
            <div class="material-card-list mobile-only p-4">
              <div v-for="t in sortedTxns" :key="t.id" class="material-txn-card mb-3">
                <div class="material-txn-header">
                  <div class="material-txn-name">{{ formatDateFull(t.transaction_date) }}</div>
                  <span :class="['txn-type-badge', 'txn-' + t.transaction_type.toLowerCase()]">
                    {{ t.transaction_type === 'OUT' ? 'Keluar' : 'Masuk' }}
                  </span>
                </div>
                <div class="material-txn-details">
                  <div class="txn-detail-item">
                    <span class="txn-detail-label">Jumlah</span>
                    <span class="txn-detail-value font-semibold">{{ formatNumber(t.quantity) }} {{ t.satuan }}</span>
                  </div>
                </div>
                <div v-if="t.notes" class="material-txn-notes">{{ t.notes }}</div>
              </div>
            </div>

            <!-- Desktop Transaction Table -->
            <div class="table-wrapper desktop-only">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 50px;" class="text-center">No</th>
                    <th style="min-width: 120px;">Tanggal</th>
                    <th class="text-center" style="width: 100px;">Tipe</th>
                    <th class="text-center" style="width: 100px;">Jumlah</th>
                    <th style="width: 80px;">Satuan</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(t, index) in sortedTxns" :key="t.id">
                    <td class="text-center text-muted">{{ index + 1 }}</td>
                    <td class="whitespace-nowrap font-medium">{{ formatDateFull(t.transaction_date) }}</td>
                    <td class="text-center">
                      <span :class="['txn-type-badge', 'txn-' + t.transaction_type.toLowerCase()]">
                        {{ t.transaction_type === 'OUT' ? 'Keluar' : 'Masuk' }}
                      </span>
                    </td>
                    <td class="text-center font-semibold">{{ formatNumber(t.quantity) }}</td>
                    <td>{{ t.satuan }}</td>
                    <td class="text-muted truncate-cell" :title="t.notes">{{ t.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- EDIT MATERIAL FORM -->
      <template v-else>
        <div class="flex items-center gap-4 mb-6 mt-2">
          <button class="btn-back" @click="closeEditForm" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 class="home-title m-0" style="font-size: 1.5rem;">Edit Data Material</h1>
        </div>

        <form @submit.prevent="submitEditMaterial" class="card">
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Satuan <span class="text-danger">*</span></label>
                <input type="text" v-model="materialForm.unit" class="form-input" required placeholder="Contoh: Kg, Pcs, Liter" />
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

            <div v-if="itemType === 'essential'" class="form-group mb-6">
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
              
              <!-- Existing Images (jika ada yg ingin dihapus saat edit) -->
              <div v-if="materialForm.existingImages.length > 0" class="mb-3">
                <small class="text-muted mb-2 block">Gambar Tersimpan:</small>
                <div class="flex gap-3 flex-wrap">
                  <div v-for="(img, idx) in materialForm.existingImages" :key="idx" style="position: relative; width: 80px; height: 80px; border-radius: 8px; border: 1px solid var(--glass-border); flex-shrink: 0;">
                    <img :src="img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block;" />
                    <button type="button" @click.prevent="removeExistingImage(idx)" style="position: absolute; top: 4px; right: 4px; background-color: #ef4444; color: #ffffff; border: 1px solid #dc2626; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; padding: 0;" aria-label="Hapus Foto" title="Hapus foto ini">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 mt-4">
                <input type="file" ref="fileInput" @change="handleFileUpload" multiple accept="image/*" class="form-input" style="padding: 10px; flex: 1;" />
              </div>
              <div v-if="materialForm.imageUrls.length > 0" class="mt-3 flex gap-3 flex-wrap">
                <div v-for="(img, idx) in materialForm.imageUrls" :key="idx" style="position: relative; width: 80px; height: 80px; border-radius: 8px; border: 1px solid var(--glass-border); flex-shrink: 0;">
                  <img :src="img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block;" />
                  <button type="button" @click.prevent="removeNewImage(idx)" style="position: absolute; top: 4px; right: 4px; background-color: #ef4444; color: #ffffff; border: 1px solid #dc2626; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; padding: 0;" aria-label="Hapus Foto" title="Hapus foto ini">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
              <small class="text-muted block mt-2">Boleh lebih dari 1 foto. Kosongkan jika tidak ingin menambah foto.</small>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
              <button type="button" class="btn btn-secondary" @click="closeEditForm" :disabled="isSubmittingEdit">Batal</button>
              <button type="submit" class="btn btn-primary flex items-center" :disabled="isSubmittingEdit">
                <span v-if="isSubmittingEdit" class="spinner spinner-sm mr-2" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></span>
                {{ isSubmittingEdit ? 'Menyimpan...' : 'Perbarui Material' }}
              </button>
            </div>
          </div>
        </form>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { engines } from '~/utils/pmCycles'
const route = useRoute()
const router = useRouter()
const itemId = route.params.id as string
const itemType = (route.query.type as string) || 'fast-moving'

const loading = ref(true)
const txnPending = ref(false)
const material = ref<any>(null)
const txns = ref<any[]>([])
const txnSortDesc = ref(true) // Terbaru

// Default image placeholder — diisi setelah fetch
const PLACEHOLDER = `/images/material-placeholder.png`
const images = ref<string[]>([PLACEHOLDER])
const activeImageIdx = ref(0)

// Helper logic
const goBack = () => router.back()
const scrollToTxn = () => {
  router.push(`/material/${itemType}`)
  // Redirect to parent page since this page doesn't have the input form to simplify
  // In a real app we might open the modal here
}

const isDeleting = ref(false)
const isEditing = ref(false)
const isSubmittingEdit = ref(false)

const handleEdit = () => {
  // Populate form with current material data
  materialForm.name = material.value.name || material.value.nama || ''
  materialForm.part_number = material.value.part_number || ''
  materialForm.unit = material.value.unit || material.value.satuan || ''
  materialForm.status = material.value.status || 'Baru'
  materialForm.spesification = material.value.spesification || ''
  materialForm.notes = material.value.notes || ''
  
  if (material.value.isCommon === false || material.value.isCommon === 'false') {
    materialForm.isCommon = false
  } else {
    materialForm.isCommon = true
  }

  // Pre-fill engines safely
  materialForm.engines = []
  if (material.value.engines) {
    if (Array.isArray(material.value.engines)) {
      materialForm.engines = material.value.engines
    } else if (typeof material.value.engines === 'string') {
      materialForm.engines = material.value.engines.split(',').map((e:string) => e.trim())
    }
  }

  // Pre-fill existing images safely
  materialForm.existingImages = []
  if (images.value && images.value.length > 0 && images.value[0] !== PLACEHOLDER) {
    materialForm.existingImages = [...images.value]
  }

  materialForm.imageUrls.forEach(url => URL.revokeObjectURL(url))
  materialForm.imageUrls = []
  materialForm.imageFiles = []

  isEditing.value = true
}

const closeEditForm = () => {
  isEditing.value = false
}

const handleDelete = async () => {
  const confirmMessage = `Apakah Anda yakin ingin menghapus material ini?\n\nPerhatian: Data material dan riwayat transaksi akan dihapus secara permanen dari database lokal, beserta SEMUA GAMBAR fisiknya yang tersimpan di server cloud AuraStorage.`
  if (confirm(confirmMessage)) {
    isDeleting.value = true
    try {
      await $fetch(`/api/materials/essential/${itemId}`, { method: 'DELETE' })
      alert('Data material berhasil dihapus.')
      router.push('/material/essential') // Kembali ke daftar list
    } catch (e: any) {
      console.error('Delete error:', e)
      alert('Gagal menghapus material.')
    } finally {
      isDeleting.value = false
    }
  }
}

const deleteFromAuraStorage = async (url: string) => {
   // Already handled in Backend
}

const toggleTxnSort = () => {
  txnSortDesc.value = !txnSortDesc.value
}

// ==== Form Editing Logic ====
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
  notes: '',
  spesification: '',
  isCommon: true,
  engines: [] as string[],
  existingImages: [] as string[],
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

const removeExistingImage = (idx: number) => {
  materialForm.existingImages.splice(idx, 1)
}

const removeNewImage = (idx: number) => {
  materialForm.imageFiles.splice(idx, 1)
  URL.revokeObjectURL(materialForm.imageUrls[idx])
  materialForm.imageUrls.splice(idx, 1)
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

const submitEditMaterial = async () => {
  if (isSubmittingEdit.value) return
  isSubmittingEdit.value = true

  try {
    const formData = new FormData()
    formData.append('name', materialForm.name)
    formData.append('part_number', materialForm.part_number)
    formData.append('unit', materialForm.unit)
    formData.append('status', materialForm.status)
    formData.append('notes', materialForm.notes)
    formData.append('spesification', materialForm.spesification)
    formData.append('isCommon', materialForm.isCommon.toString())
    formData.append('existing_images', materialForm.existingImages.join(','))
    
    materialForm.engines.forEach(engine => {
      formData.append('engines', engine)
    })
    
    materialForm.imageFiles.forEach(file => {
       formData.append('images', file)
    })

    await $fetch(`/api/materials/essential/${itemId}`, {
      method: 'PUT' as any,
      body: formData
    })

    alert('Perubahan material berhasil disimpan.')
    
    // Reload full data to display
    isEditing.value = false
    loading.value = true
    await loadEssentialMockData()
    loading.value = false
  } catch (error) {
    console.error('Edit error:', error)
    alert('Terjadi kesalahan saat memperbarui material.')
  } finally {
    isSubmittingEdit.value = false
  }
}
// ====================

const sortedTxns = computed(() => {
  const data = [...txns.value]
  data.sort((a, b) => {
    const timeA = new Date(a.transaction_date).getTime()
    const timeB = new Date(b.transaction_date).getTime()
    return txnSortDesc.value ? timeB - timeA : timeA - timeB
  })
  return data
})

const getStockLevel = (stock: number) => {
  if (stock <= 0) return 'stock-empty'
  if (stock <= 10) return 'stock-low'
  if (stock <= 50) return 'stock-medium'
  return 'stock-good'
}

const formatNumber = (num: any) => {
  if (!num && num !== 0) return '-'
  const n = parseFloat(num)
  return n % 1 === 0 ? n.toLocaleString('id-ID') : n.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Data fetching
onMounted(async () => {
  loading.value = true
  
  try {
    if (itemType === 'essential') {
      // Load mock data for essential
      await loadEssentialMockData()
    } else {
      // Fetch DB data for fast-moving
      await loadFastMovingData()
    }
  } catch (e) {
    console.error('Error loading material details:', e)
  } finally {
    loading.value = false
  }
})

const loadEssentialMockData = async () => {
  try {
    const res: any = await $fetch(`/api/materials/essential/${itemId}`)
    material.value = res.data
    txns.value = res.transactions || []

    // Set up image array from AuraStorage URLs
    if (res.data.images && res.data.images.length > 0) {
      images.value = res.data.images
    } else {
      images.value = [PLACEHOLDER]
    }
    activeImageIdx.value = 0
  } catch (e: any) {
    console.error('Error loading essential material:', e)
    material.value = null
    txns.value = []
    images.value = [PLACEHOLDER]
  }
}

const loadFastMovingData = async () => {
  // Fetch from `/api/materials/inventory`
  const res = await fetch(`/api/materials/inventory`)
  if (!res.ok) return
  const json = await res.json()
  const allInventories = json.data
  const target = allInventories.find((i: any) => i.id == parseInt(itemId))
  
  if (target) {
    // Basic mapping is extracted here if necessary, but we can just assign it
    material.value = target
    // In real scenario we'd re-apply the estHabis logic, but for simplicity we rely on the object if we had processed it, or we just ignore the complex calculation here since it's just a view page.
    
    // Fetch individual txns
    txnPending.value = true
    try {
      const txRes = await fetch(`/api/materials/transactions?material_id=${target.id}&limit=50`)
      if (txRes.ok) {
        const txJson = await txRes.json()
        txns.value = txJson.data
        // attach satuan to each
        txns.value.forEach(t => t.satuan = target.satuan)
      }
    } finally {
      txnPending.value = false
    }
  }
}
</script>

<style scoped>
.detail-page-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); padding-top: var(--space-2); }
.detail-page-title-wrapper { display: flex; align-items: center; gap: var(--space-3); flex: 1; }


.material-hero-card {
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .hero-grid {
    grid-template-columns: 2fr 3fr;
  }
}

/* CAROUSEL / GALLERY */
.hero-gallery {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: rgba(0,0,0,0.15);
  border-right: 1px solid var(--glass-border);
}

.main-image-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05);
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 4px;
}

.thumbnail-list::-webkit-scrollbar {
  height: 4px;
}
.thumbnail-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
}

.thumbnail-item {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
  flex-shrink: 0;
}

.thumbnail-item:hover {
  opacity: 0.9;
}

.thumbnail-item.active {
  border-color: var(--primary-400);
  opacity: 1;
  box-shadow: 0 0 10px var(--primary-glow);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* MATERIAL INFO */
.hero-info {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
}

.material-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-top: 0;
  margin-bottom: var(--space-4);
  line-height: 1.3;
}

.material-meta-row {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px dashed var(--glass-border);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.meta-value {
  font-weight: 500;
  color: var(--gray-700);
}
.part-number {
  font-family: monospace;
  background: rgba(255,255,255,0.05);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

/* STOCK BOX */
.stock-box {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-2);
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.stock-label {
  font-weight: 600;
  color: var(--gray-800);
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
}
.stock-good { background: var(--success-light); color: var(--success); }
.stock-medium { background: var(--warning-light); color: var(--warning); }
.stock-low { background: var(--danger-light); color: var(--danger); box-shadow: 0 0 10px var(--danger-glow); }
.stock-empty { background: rgba(239, 68, 68, 0.3); color: #f87171; box-shadow: 0 0 12px rgba(239, 68, 68, 0.3); }

.stock-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}
.stock-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--accent));
  border-radius: 4px;
  transition: width 1s ease-out;
}

/* INFO LIST */
.detail-info-list {
  display: flex;
  flex-direction: column;
}
.detail-info-row { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); 
}
.detail-info-row:last-child { border-bottom: none; }
.detail-info-label { color: var(--gray-500); font-size: 0.85rem; }
.detail-info-value { color: var(--gray-800); font-size: 0.85rem; font-weight: 600; text-align: right; }

.btn-sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  color: var(--gray-700);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-sort:hover {
  background: rgba(255,255,255,0.1);
  color: var(--gray-900);
}

.txn-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}
.txn-out { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
.txn-in { background: rgba(52, 211, 153, 0.15); color: #34d399; }

@media (max-width: 640px) {
  .hero-gallery {
    padding: var(--space-3);
    border-right: none;
    border-bottom: 1px solid var(--glass-border);
  }
  .hero-info {
    padding: var(--space-4);
  }
}
</style>
