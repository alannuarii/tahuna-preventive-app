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
      <h1 class="home-title m-0">Material Fast Moving</h1>
      <div class="page-header-actions">
        <SegmentedControl
          :options="tabOptions"
          v-model="activeTab"
        />
      </div>
    </div>

    <!-- ==================== TAB 1: STOK GUDANG ==================== -->
    <template v-if="activeTab === 'stock'">
      <!-- ROP Status Summary Grid -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <!-- Safe Card -->
        <div class="card summary-rop-card rop-card-safe">
          <div class="card-body py-2 px-3 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-muted leading-tight">Stok Aman</div>
              <div class="text-lg font-bold mt-0.5 text-success">{{ getRopCount('SAFE') }}</div>
            </div>
            <div class="summary-rop-icon text-success">✅</div>
          </div>
        </div>
        <!-- Reorder Card -->
        <div class="card summary-rop-card rop-card-reorder">
          <div class="card-body py-2 px-3 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-muted leading-tight">Perlu Order</div>
              <div class="text-lg font-bold mt-0.5 text-warning">{{ getRopCount('REORDER') }}</div>
            </div>
            <div class="summary-rop-icon text-warning">⚠️</div>
          </div>
        </div>
        <!-- Critical Card -->
        <div class="card summary-rop-card rop-card-critical">
          <div class="card-body py-2 px-3 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-muted leading-tight">Stok Kritis</div>
              <div class="text-lg font-bold mt-0.5 text-danger">{{ getRopCount('CRITICAL') }}</div>
            </div>
            <div class="summary-rop-icon text-danger">🚨</div>
          </div>
        </div>
      </div>

      <div class="flex justify-end mb-3 mobile-only">
        <button class="btn btn-secondary btn-sm" @click="showMobileStockFilter = !showMobileStockFilter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {{ showMobileStockFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
        </button>
      </div>

      <div class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobileStockFilter }">
        <div class="card-body">
          <div class="material-filter-row">
            <div class="form-group mb-0 flex-1">
              <label class="form-label">Jenis Mesin</label>
              <select v-model="stockMachineFilter" class="form-input form-input-sm">
                <option value="">Semua Mesin</option>
                <option v-for="opt in machineOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="form-group mb-0" style="min-width: 200px;">
              <label class="form-label">Urutkan</label>
              <select v-model="stockSort" class="form-input form-input-sm" @change="loadInventory">
                <option value="name_asc">Nama A–Z</option>
                <option value="name_desc">Nama Z–A</option>
                <option value="stock_asc">Stok Terendah</option>
                <option value="stock_desc">Stok Tertinggi</option>
                <option value="rop_status_desc">Status ROP (Kritis Teratas)</option>
                <option value="est_asc">Habis Tercepat</option>
                <option value="est_desc">Habis Terlama</option>
              </select>
            </div>
            <div class="form-group mb-0 material-filter-action" style="flex: 1; display: flex; align-items: flex-end; justify-content: flex-end;">
              <label class="form-label desktop-only">&nbsp;</label>
              <div class="flex gap-2 flex-wrap justify-end">
                <button class="btn btn-secondary btn-sm" @click="downloadStockExcel" :disabled="isDownloading" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border);">
                  <span v-if="isDownloading" class="spinner spinner-sm mr-2"></span>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {{ isDownloading ? 'Menyiapkan...' : 'Download' }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-if="stockLoading" class="loading-container" style="min-height: 30vh;">
        <div class="spinner spinner-lg"></div>
        <p class="mt-4 text-muted">Memuat data stok...</p>
      </div>

      <div v-else-if="inventoryData.length === 0" class="card">
        <div class="card-body text-center py-8">
          <div class="empty-icon">📦</div>
          <p class="text-muted text-lg">Tidak ada data material ditemukan</p>
        </div>
      </div>

      <template v-else>
        <!-- Mobile Cards -->
        <div class="material-card-list mobile-only">
          <div v-for="item in enrichedInventory" :key="item.id" class="material-stock-card mb-3 cursor-pointer" @click="navigateTo(`/material/detail/${item.id}?type=fast-moving`)">
            <div class="material-stock-header" style="align-items: flex-start;">
              <div>
                <div class="material-stock-name">{{ item.name }}</div>
                <div v-if="item.unitsText" class="cycle-range-tag mt-1" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-flex;">
                  {{ item.unitsText }}
                </div>
              </div>
              <div class="text-right">
                <div :class="['stock-badge', getStockLevel(item)]">
                  {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                </div>
                <div v-if="item.drumText" class="text-xs text-muted mt-1">{{ item.drumText }}</div>
              </div>
            </div>
            <div class="material-stock-meta flex justify-between mt-3">
              <div>
                <div class="text-xs text-muted">Part Number</div>
                <span class="material-part-number">{{ item.part_number || '-' }}</span>
              </div>
              <div class="text-right">
                <div class="text-xs text-muted">Est. Habis</div>
                <template v-if="item.estHabis">
                  <div class="font-semibold text-sm" :class="item.estHabis.days < 30 ? 'text-danger' : 'text-gray-700'">
                    {{ item.estHabis.date ? formatDateShort(item.estHabis.date) : '> 5 Tahun' }}
                  </div>
                  <div v-if="item.estHabis.date" class="text-xs text-muted">({{ item.estHabis.days }} hari)</div>
                </template>
                <template v-else>
                  <span class="text-muted text-sm">-</span>
                </template>
              </div>
            </div>
            <!-- ROP Details for Mobile -->
            <div class="material-stock-rop-details mt-3 pt-3 grid grid-cols-3 gap-2" style="border-top: 1px dashed var(--glass-border);">
              <div>
                <div class="text-xs text-muted">ROP</div>
                <div class="font-semibold text-xs">{{ formatNumber(item.rop) }} {{ item.satuan }}</div>
                <div v-if="getDrumTextForValue(item.rop, item.satuan)" class="text-[10px] text-muted">{{ getDrumTextForValue(item.rop, item.satuan) }}</div>
              </div>
              <div>
                <div class="text-xs text-muted">ROQ</div>
                <div class="font-semibold text-xs">{{ formatNumber(Math.round(item.roq)) }} {{ item.satuan }}</div>
                <div v-if="getDrumTextForValue(item.roq, item.satuan)" class="text-[10px] text-muted">{{ getDrumTextForValue(item.roq, item.satuan) }}</div>
              </div>
              <div class="text-right flex items-center justify-end">
                <span :class="['rop-badge', 'rop-' + (item.rop_status || 'safe').toLowerCase()]" style="padding: 0.15rem 0.4rem; font-size: 0.6rem;">
                  {{ getRopStatusLabel(item.rop_status) }}
                </span>
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
                  <th>NAMA MATERIAL & SPEK</th>
                  <th class="text-center">PART NUMBER</th>
                  <th class="text-center">STOCK</th>
                  <th class="text-center">ROP (SAFETY)</th>
                  <th class="text-center">ROQ</th>
                  <th class="text-center">EST. HABIS</th>
                  <th class="text-center" style="width: 120px;">STATUS ROP</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in enrichedInventory" :key="item.id" class="cursor-pointer hover:bg-white/5" @click="navigateTo(`/material/detail/${item.id}?type=fast-moving`)" title="Klik untuk rincian">
                  <td class="text-center text-muted">{{ index + 1 }}</td>
                  <td>
                    <div class="font-semibold">{{ item.name }}</div>
                    <div v-if="item.unitsText" class="cycle-range-tag mt-1" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-flex;">
                      {{ item.unitsText }}
                    </div>
                  </td>
                  <td class="text-center text-muted">{{ item.part_number || '-' }}</td>
                  <td class="text-center">
                    <div>
                      <span :class="['stock-badge', getStockLevel(item)]">
                        {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                      </span>
                    </div>
                    <div v-if="item.drumText" class="text-xs text-muted mt-1">{{ item.drumText }}</div>
                  </td>
                  <td class="text-center">
                    <div class="font-semibold">{{ formatNumber(item.rop) }} {{ item.satuan }}</div>
                    <div v-if="getDrumTextForValue(item.rop, item.satuan)" class="text-xs text-muted mt-1">
                      {{ getDrumTextForValue(item.rop, item.satuan) }}
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="font-semibold">{{ formatNumber(Math.round(item.roq)) }} {{ item.satuan }}</div>
                    <div v-if="getDrumTextForValue(item.roq, item.satuan)" class="text-xs text-muted mt-1">
                      {{ getDrumTextForValue(item.roq, item.satuan) }}
                    </div>
                  </td>
                  <td class="text-center">
                    <template v-if="item.estHabis">
                      <template v-if="item.estHabis.date">
                        <div class="font-semibold" :class="item.estHabis.days < 30 ? 'text-danger' : ''">
                          {{ formatDateShort(item.estHabis.date) }}
                        </div>
                        <div class="text-xs text-muted mt-1">({{ item.estHabis.days }} hari)</div>
                      </template>
                      <template v-else>
                        <div class="text-sm text-muted" style="margin-top: 5px;">> 5 Tahun</div>
                      </template>
                    </template>
                    <template v-else>
                      <span class="text-muted">-</span>
                    </template>
                  </td>
                  <td class="text-center">
                    <span :class="['rop-badge', 'rop-' + (item.rop_status || 'safe').toLowerCase()]">
                      {{ getRopStatusLabel(item.rop_status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Keterangan Asumsi & Parameter ROP/ROQ -->
        <div class="card mt-4 p-4 text-xs text-muted" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border);">
          <h3 class="font-semibold text-sm mb-3 flex items-center gap-2" style="color: var(--primary-300); margin: 0 0 12px 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Keterangan Asumsi &amp; Parameter Perhitungan Stok
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="flex flex-col gap-1.5">
              <span class="font-semibold text-gray-300">ROP (Reorder Point)</span>
              <p class="m-0 text-[11px] leading-relaxed">
                Batas pemesanan kembali yang setara dengan total kebutuhan material selama <strong>45 hari</strong> (akumulasi Lead Time 30 hari + Safety Stock 15 hari).
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="font-semibold text-gray-300">ROQ (Reorder Quantity)</span>
              <p class="m-0 text-[11px] leading-relaxed">
                Jumlah pemesanan optimal, dihitung dari estimasi kebutuhan material untuk <strong>90 hari ke depan</strong> ditambah <strong>faktor pengaman (buffer) 5%</strong>.
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="font-semibold text-gray-300">Est. Habis</span>
              <p class="m-0 text-[11px] leading-relaxed">
                Estimasi tanggal stok material akan habis (&le; 0) berdasarkan simulasi konsumsi stok terhadap rencana jadwal PM secara kronologis.
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <span class="font-semibold text-gray-300">Lead Time (Waktu Pengiriman)</span>
              <p class="m-0 text-[11px] leading-relaxed">
                Waktu tunggu sejak pemesanan hingga material tiba di lokasi, yang diasumsikan default selama <strong>30 hari</strong>.
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <span class="font-semibold text-gray-300">Status ROP</span>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <span class="rop-badge rop-safe" style="padding: 2px 6px; font-size: 10px; line-height: 1; flex-shrink: 0; min-width: 60px; text-align: center;">AMAN</span>
                  <span class="text-[11px] text-muted">Stok &gt; ROP</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rop-badge rop-reorder" style="padding: 2px 6px; font-size: 10px; line-height: 1; flex-shrink: 0; min-width: 60px; text-align: center;">ORDER</span>
                  <span class="text-[11px] text-muted">Stok &le; ROP, tapi &gt; Safety Stock (15 hari buffer)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rop-badge rop-critical" style="padding: 2px 6px; font-size: 10px; line-height: 1; flex-shrink: 0; min-width: 60px; text-align: center;">KRITIS</span>
                  <span class="text-[11px] text-muted">Stok &le; Safety Stock (15 hari buffer)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              <select v-model="txnFilters.material_id" class="form-input form-input-sm">
                <option value="">Semua Material</option>
                <option v-for="mat in enrichedInventory" :key="mat.id" :value="mat.id">
                  {{ mat.name }} - {{ mat.enginesText }}
                </option>
              </select>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Tipe</label>
              <select v-model="txnFilters.type" class="form-input form-input-sm w-32">
                <option value="">Semua Tipe</option>
                <option value="IN">Masuk</option>
                <option value="OUT">Keluar</option>
              </select>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Dari Tanggal</label>
              <input type="date" v-model="txnFilters.start" class="form-input form-input-sm w-36" />
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Sampai Tanggal</label>
              <input type="date" v-model="txnFilters.end" class="form-input form-input-sm" />
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Urutkan</label>
              <select v-model="txnFilters.sort" class="form-input form-input-sm w-32">
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
            </div>
            <div class="form-group mb-0 material-filter-action" style="flex: 1; display: flex; align-items: flex-end; justify-content: flex-end;">
              <label class="form-label desktop-only">&nbsp;</label>
              <div class="flex gap-2 flex-wrap justify-end">
                <button class="btn btn-primary btn-sm" @click="applyTxnFilters">Filter</button>
                <button class="btn btn-secondary btn-sm" @click="resetTxnFilters">Reset</button>
                <button class="btn btn-secondary btn-sm" @click="downloadTxnExcel" :disabled="isDownloadingTxn">
                  <span v-if="isDownloadingTxn" class="spinner spinner-sm mr-2"></span>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {{ isDownloadingTxn ? 'Menyiapkan...' : 'Download' }}
                </button>
                <button class="btn btn-primary btn-sm ml-auto desktop-only" style="background-color: var(--primary-700);" @click="openTxnModal">+ Input Transaksi</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="txnLoading" class="loading-container" style="min-height: 30vh;">
        <div class="spinner spinner-lg"></div>
        <p class="mt-4 text-muted">Memuat transaksi...</p>
      </div>

      <div v-else-if="txnData.length === 0" class="card">
        <div class="card-body text-center py-8">
          <div class="empty-icon">📋</div>
          <p class="text-muted text-lg">Tidak ada data transaksi</p>
        </div>
      </div>

      <template v-else>
        <!-- Mobile Cards -->
        <div class="material-card-list mobile-only">
          <div v-for="item in txnData" :key="item.id" class="material-txn-card mb-3">
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
            
            <div class="material-txn-actions mt-3 pt-3 flex justify-end gap-2" style="border-top: 1px solid var(--glass-border);">
              <template v-if="item.reference_doc && item.reference_doc.startsWith('PM_REALIZATION_')">
                <span class="text-xs text-muted italic flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Sistem (Realisasi PM)
                </span>
              </template>
              <template v-else>
                <button type="button" class="btn btn-secondary btn-xs flex items-center gap-1" @click="openEditTxnModal(item)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button type="button" class="btn btn-xs flex items-center gap-1" style="border: 1px solid #ef4444; color: #ef4444; background: rgba(239,68,68,0.1);" @click="handleDeleteTxn(item)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Hapus
                </button>
              </template>
            </div>
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
                  <th class="text-center" style="width: 100px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in txnData" :key="item.id">
                  <td class="text-center text-muted">{{ (txnMeta.page - 1) * txnMeta.limit + index + 1 }}</td>
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
                  <td class="text-center">
                    <div class="flex justify-center gap-2">
                      <template v-if="item.reference_doc && item.reference_doc.startsWith('PM_REALIZATION_')">
                        <span class="inline-flex items-center justify-center text-gray-500 opacity-60 cursor-help" title="Transaksi otomatis dari Realisasi PM tidak dapat diubah/dihapus">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </span>
                      </template>
                      <template v-else>
                        <button type="button" class="btn-action-icon edit" @click="openEditTxnModal(item)" title="Edit Transaksi">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button type="button" class="btn-action-icon delete" @click="handleDeleteTxn(item)" title="Hapus Transaksi">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <CommonPagination
          v-if="txnMeta.totalPages > 1"
          :current-page="txnMeta.page"
          :total-pages="txnMeta.totalPages"
          :total="txnMeta.total"
          @change="changeTxnPage"
        />
      </template>
      </template>
      
      <!-- FORM INLINE INSTEAD OF MODAL -->
      <template v-else>
        <div class="flex items-center gap-4 mb-6 mt-2">
          <button class="btn-back" @click="closeTxnModal" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 class="home-title m-0" style="font-size: 1.5rem;">{{ editingTxnId ? 'Edit Transaksi' : 'Input Transaksi' }}</h1>
        </div>

        <form @submit.prevent="submitTxn" class="card">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-group mb-0">
                <label class="form-label">Material <span class="text-danger">*</span></label>
                <select v-model="txnForm.material_id" class="form-input" required>
                  <option value="">Pilih Material...</option>
                  <option v-for="item in enrichedInventory" :key="item.id" :value="item.id">
                    {{ item.name }}{{ item.enginesText ? ' - ' + item.enginesText : '' }} - Stock: {{ formatNumber(item.current_stock) }} {{ item.satuan }}
                  </option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Tanggal Transaksi <span class="text-danger">*</span></label>
                <input type="date" v-model="txnForm.transaction_date" class="form-input" required />
                <small class="text-muted" style="display:block; margin-top:0.25rem;">Biarkan default untuk hari ini (Sekarang).</small>
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
              <textarea v-model="txnForm.notes" class="form-input" rows="3" placeholder="Contoh: Stok Baru / Pemakaian Unit 1"></textarea>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-5" style="border-top: 1px solid var(--glass-border);">
              <button type="button" class="btn btn-secondary" @click="closeTxnModal">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmittingTxn">
                {{ isSubmittingTxn ? 'Menyimpan...' : (editingTxnId ? 'Perbarui' : 'Simpan') }}
              </button>
            </div>
          </div>
        </form>
      </template>
    </template>

    <!-- ==================== TAB 3: KEBUTUHAN PM ==================== -->
    <template v-if="activeTab === 'usage'">
      <!-- Data per Mesin -->
      <div v-for="machineData in machineGroupedUsageData" :key="machineData.mesin" class="card mb-4">
        <div class="card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
          <span class="font-semibold">{{ machineData.mesin }}</span>
          <span class="badge badge-primary ml-2">{{ machineData.material.length }} material</span>
        </div>

        <!-- Mobile Cards -->
        <div class="card-body mobile-only" style="padding: 0;">
          <div v-for="(mat, idx) in machineData.material" :key="idx" class="usage-item-card">
            <div class="usage-item-header">
              <span class="usage-item-name">{{ mat.nama }}</span>
              <div class="cycle-range-badges">
                <span class="cycle-range-tag">{{ getCycleRange(mat.cycle) }}</span>
              </div>
            </div>
            <div class="usage-item-stats">
              <div class="usage-stat">
                <span class="usage-stat-label">Kebutuhan / PM</span>
                <span class="usage-stat-value font-semibold">{{ formatNumber(mat.jumlah) }} {{ mat.satuan }}</span>
              </div>
              <div class="usage-stat">
                <span class="usage-stat-label">Siklus</span>
                <span class="usage-stat-value">{{ getCycleRange(mat.cycle) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="table-wrapper desktop-only">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 50px;" class="text-center">No</th>
                <th>Material</th>
                <th class="text-center">Jumlah / PM</th>
                <th class="text-center">Satuan</th>
                <th class="text-center">Siklus</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mat, idx) in machineData.material" :key="idx">
                <td class="text-center text-muted">{{ idx + 1 }}</td>
                <td class="font-semibold">{{ mat.nama }}</td>
                <td class="text-center font-semibold">{{ formatNumber(mat.jumlah) }}</td>
                <td class="text-center">{{ mat.satuan }}</td>
                <td class="text-center">
                  <span class="cycle-range-tag">{{ getCycleRange(mat.cycle) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ==================== TAB 4: PERENCANAAN ==================== -->
    <template v-if="activeTab === 'planning'">
      <div class="flex justify-end mb-3 mobile-only">
        <button class="btn btn-secondary btn-sm" @click="showMobilePlanFilter = !showMobilePlanFilter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {{ showMobilePlanFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter' }}
        </button>
      </div>
      <!-- Filter Card -->
      <div class="card mb-4" :class="{ 'mobile-collapse-hidden': !showMobilePlanFilter }">
        <div class="card-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="font-semibold">Filter Perencanaan</span>
        </div>
        <div class="card-body">
          <div class="material-filter-row" style="gap: 12px;">
            <div class="form-group mb-0">
              <label class="form-label">Waktu Awal</label>
              <input type="date" v-model="planFilter.start" class="form-input form-input-sm" />
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Waktu Akhir</label>
              <input type="date" v-model="planFilter.end" class="form-input form-input-sm" />
            </div>
            <div class="form-group mb-0" style="flex: 2; min-width: 220px;">
              <label class="form-label">Mesin/Unit</label>
              <select v-model="planFilter.unitKey" class="form-input form-input-sm">
                <option value="">Pilih unit...</option>
                <optgroup label="Unit Individu">
                  <option v-for="e in engines" :key="'u'+e.unit" :value="'unit:'+e.unit">
                    {{ e.mesin }} Unit {{ e.unit }}
                  </option>
                </optgroup>
                <optgroup label="Mesin Sejenis">
                  <option v-for="opt in machineOptions" :key="'m'+opt.value" :value="'group:'+opt.value">
                    {{ opt.label }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="form-group mb-0 material-filter-action">
              <label class="form-label desktop-only">&nbsp;</label>
              <button class="btn btn-primary btn-sm" @click="calculatePlanning" :disabled="!planFilter.start || !planFilter.end || !planFilter.unitKey">Hitung</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!planResult" class="card">
        <div class="card-body text-center py-8">
          <div class="empty-icon">📊</div>
          <p class="text-muted text-lg">Pilih rentang waktu dan unit mesin, lalu tekan <strong>Hitung</strong> untuk melihat perencanaan material.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="planLoading" class="loading-container" style="min-height: 30vh;">
        <div class="spinner spinner-lg"></div>
        <p class="mt-4 text-muted">Menghitung perencanaan...</p>
      </div>

      <!-- Result -->
      <template v-if="planResult && !planLoading">
        <!-- Summary Cards -->
        <div class="plan-summary-grid mb-4">
          <!-- Total PM Card -->
          <div class="card">
            <div class="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span class="font-semibold">Total PM</span>
            </div>
            <div class="card-body text-center">
              <div class="plan-total-number">{{ planResult.totalPM }}</div>
              <div class="text-muted text-sm mb-4">Pemeliharaan</div>
              <div class="plan-pm-breakdown">
                <div v-for="pm in ['P1','P2','P3','P4','P5']" :key="pm" class="plan-pm-item">
                  <div class="plan-pm-label">{{ pm }}</div>
                  <div class="plan-pm-value">{{ planResult.pmCounts[pm] || 0 }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Machine Info Card -->
          <div class="card">
            <div class="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
              <span class="font-semibold">Informasi Mesin</span>
            </div>
            <div class="card-body">
              <div class="plan-info-grid">
                <div class="plan-info-item">
                  <span class="plan-info-label">Unit</span>
                  <span class="plan-info-value" style="color: var(--primary-500);">{{ planResult.unitLabel }}</span>
                </div>
                <div class="plan-info-item">
                  <span class="plan-info-label">Mesin</span>
                  <span class="plan-info-value">{{ planResult.mesinLabel }}</span>
                </div>
                <div class="plan-info-item">
                  <span class="plan-info-label">Periode</span>
                  <span class="plan-info-value">{{ planResult.periodeLabel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Material Needs Table -->
        <div class="card">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span class="font-semibold">Material Fast Moving</span>
            <span class="badge badge-primary ml-2">{{ planResult.materials.length }} item</span>
          </div>

          <!-- Mobile Cards -->
          <div class="card-body mobile-only" style="padding: 0;">
            <div v-if="planResult.materials.length === 0" class="text-center py-6 text-muted">
              <p>Tidak ada material yang dibutuhkan pada periode ini.</p>
            </div>
            <div v-for="(mat, idx) in planResult.materials" :key="idx" class="usage-item-card mb-3">
              <div class="flex justify-between items-start mb-2">
                <div class="usage-item-name font-semibold flex-1">{{ Number(idx) + 1 }}. {{ mat.nama }}</div>
                <div class="text-xs text-muted ml-2" style="font-family: monospace; padding-top: 2px;">{{ mat.part_number || '-' }}</div>
              </div>
              
              <div class="grid grid-cols-2 gap-3 mt-3 pt-3" style="border-top: 1px dashed var(--glass-border);">
                <div>
                  <div class="text-xs text-muted mb-1">Kebutuhan PM</div>
                  <div class="font-semibold" style="color: var(--primary-500);">
                    {{ formatNumber(mat.totalJumlah) }} <span class="text-xs font-normal text-muted">{{ mat.satuan }}</span>
                  </div>
                  <div v-if="mat.isLubeOil" class="text-xs text-muted italic mt-0.5">≈ {{ (mat.totalJumlah / 209).toFixed(1) }} drum</div>
                </div>
                
                <div>
                  <div class="text-xs text-muted mb-1">Stok Saat Ini</div>
                  <div class="font-semibold">
                    {{ formatNumber(mat.currentStock) }} <span class="text-xs font-normal text-muted">{{ mat.satuan }}</span>
                  </div>
                  <div v-if="mat.isLubeOil" class="text-xs text-muted italic mt-0.5">≈ {{ (mat.currentStock / 209).toFixed(1) }} drum</div>
                </div>
              </div>
                
              <div class="w-full mt-4 flex justify-between items-center" style="background: rgba(0,0,0,0.2); padding: 10px 12px; border-radius: 6px;">
                <div class="text-sm text-muted">Selisih (Stok - Kebutuhan)</div>
                <div class="font-semibold flex flex-col items-end gap-1 text-right" :class="mat.selisih < 0 ? 'text-danger' : 'text-success'">
                  <div class="text-base">{{ formatNumber(mat.selisih) }} <span class="text-sm font-normal opacity-80">{{ mat.satuan }}</span></div>
                  <div v-if="mat.isLubeOil" class="text-xs italic opacity-80" style="font-weight: normal;">(≈ {{ (mat.selisih / 209).toFixed(1) }} drum)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="table-wrapper desktop-only">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 50px;" class="text-center">No</th>
                  <th>Nama Material</th>
                  <th>Part Number</th>
                  <th class="text-center" style="width: 120px;">Jumlah</th>
                  <th class="text-center" style="width: 120px;">Stok Saat Ini</th>
                  <th class="text-center" style="width: 100px;">Selisih</th>
                  <th class="text-center" style="width: 100px;">Satuan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="planResult.materials.length === 0">
                  <td colspan="7" class="text-center text-muted py-6">Tidak ada material yang dibutuhkan pada periode ini.</td>
                </tr>
                <tr v-for="(mat, idx) in planResult.materials" :key="idx">
                  <td class="text-center text-muted">{{ Number(idx) + 1 }}</td>
                  <td class="font-semibold">{{ mat.nama }}</td>
                  <td class="text-xs text-muted" style="font-family: monospace;">{{ mat.part_number }}</td>
                  <td class="text-center">
                    <div class="flex flex-col items-center">
                      <span class="plan-qty-badge">{{ formatNumber(mat.totalJumlah) }}</span>
                      <span v-if="mat.isLubeOil" class="text-xs text-muted mt-1" style="font-style: italic;">≈ {{ (mat.totalJumlah / 209).toFixed(1) }} drum</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="flex flex-col items-center">
                      <span class="font-semibold">{{ formatNumber(mat.currentStock) }}</span>
                      <span v-if="mat.isLubeOil" class="text-xs text-muted mt-1" style="font-style: italic;">≈ {{ (mat.currentStock / 209).toFixed(1) }} drum</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="flex flex-col items-center">
                      <span :class="mat.selisih < 0 ? 'text-danger font-semibold' : 'text-success font-semibold'">
                        {{ formatNumber(mat.selisih) }}
                      </span>
                      <span v-if="mat.isLubeOil" :class="mat.selisih < 0 ? 'text-danger text-xs mt-1' : 'text-success text-xs mt-1'" style="font-style: italic; opacity: 0.8;">
                        ≈ {{ (mat.selisih / 209).toFixed(1) }} drum
                      </span>
                    </div>
                  </td>
                  <td class="text-center">{{ mat.satuan }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>


  </div>
</template>

<script setup lang="ts">
const { engines } = useEngines()

const getCycleRange = (baseCycle: string): string => {
  if (!baseCycle) return '-'
  const level = parseInt(baseCycle.replace('P', ''))
  if (isNaN(level)) return baseCycle
  if (level >= 5) return 'P5'
  return `${baseCycle} – P5`
}
import ExcelJS from 'exceljs'

const categoryOptions = [
  { value: 'fast-moving', label: 'Fast Moving', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
  { value: 'essential', label: 'Essential', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' }
]

const materialCategory = ref('fast-moving')

watch(materialCategory, (val) => {
  if (val !== 'fast-moving') {
    navigateTo(`/material/${val}`)
  }
})

const activeTab = ref('stock')

const showMobileStockFilter = ref(false)
const showMobileTxnFilter = ref(false)
const showMobilePlanFilter = ref(false)

// ===== PM SCHEDULE =====
const pmSchedules = ref<any[]>([])

const loadSchedules = async () => {
  try {
    const res = await fetch('/api/pm/schedule')
    if (res.ok) {
      const data = await res.json()
      pmSchedules.value = data.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    }
  } catch (err) {
    console.error('Failed to load pm schedule', err)
  }
}

// ===== STOCK TAB =====
const stockSearch = ref('')
const stockSort = ref('rop_status_desc')
const stockMachineFilter = ref('')
const stockLoading = ref(false)
const inventoryData = ref<any[]>([])

const machineOptions = computed(() => {
  const groups: Record<string, number[]> = {}
  engines.value.forEach((e: any) => {
    if (!groups[e.mesin]) groups[e.mesin] = []
    groups[e.mesin].push(e.unit)
  })
  
  return Object.entries(groups).map(([mesin, units]) => {
    const unitsStr = units.length > 1 
      ? units.slice(0, -1).join(', ') + ' & ' + units[units.length - 1] 
      : units[0]
    return {
      label: `${mesin} (Unit ${unitsStr})`,
      value: units.join(',')
    }
  })
})

const materialConfigs = ref<any[]>([])

const loadConfigs = async () => {
  try {
    const res = await fetch('/api/materials/usage')
    if (res.ok) {
      const json = await res.json()
      // Transform grouped data back to the flat structure for easier lookup
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
    console.error('Failed to load material configs', err)
  }
}

const materialUsageMap = computed(() => {
  const map = new Map<string, Array<{ unit: number, jumlah: number, minLevel: number }>>()
  materialConfigs.value.forEach(fm => {
    const unitNumber = fm.unit
    fm.material.forEach((mat: any) => {
      const keysToMap = [mat.nama.toLowerCase()]
      if ((mat as any).part_number) keysToMap.push((mat as any).part_number.toLowerCase())
      
      const minLevel = parseInt(mat.cycle.replace('P', ''))
      
      keysToMap.forEach(key => {
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push({ unit: unitNumber, jumlah: mat.jumlah, minLevel })
      })
    })
  })
  return map
})

const getUsageRules = (item: any) => {
  let rules = item.part_number ? materialUsageMap.value.get(item.part_number.toLowerCase()) : null
  if (!rules || rules.length === 0) {
    rules = materialUsageMap.value.get(item.name.toLowerCase())
  }
  return rules
}

const getMaterialUnits = (item: any) => {
  const usageRules = getUsageRules(item)
  if (!usageRules || usageRules.length === 0) return ''
  const units = [...new Set(usageRules.map((r: any) => r.unit))].sort((a: any, b: any) => a - b)
  return `Unit: ${units.join(', ')}`
}

const getMaterialEngines = (item: any) => {
  const usageRules = getUsageRules(item)
  if (!usageRules || usageRules.length === 0) return ''
  const unitNumbers = [...new Set(usageRules.map((r: any) => r.unit))]
  const engineNames = [...new Set(unitNumbers.map(u => {
    const engine = engines.value.find((e: any) => e.unit === u)
    return engine ? engine.mesin : `Unit ${u}`
  }))]
  return engineNames.join(', ')
}

const getDrumEquiv = (item: any) => {
  if (item.satuan?.toLowerCase() === 'liter' && (item.name?.toLowerCase().includes('oil') || item.name?.toLowerCase().includes('oli'))) {
    const drums = Math.round(item.current_stock / 209)
    return `(${drums} Drum)`
  }
  return null
}

const calculateEstHabis = (item: any) => {
  if (!pmSchedules.value || pmSchedules.value.length === 0) return null
  const usageRules = getUsageRules(item)
  if (!usageRules || usageRules.length === 0) return null

  let remainingStock = parseFloat(item.current_stock)
  
  for (const sched of pmSchedules.value) {
    const schedUnit = sched.extendedProps.unit
    const titleMatch = sched.title.match(/P(\d)/i)
    if (!titleMatch) continue
    const schedLevel = parseInt(titleMatch[1])
    
    // Sum all rules for this unit where schedLevel >= requiredLevel
    const rulesForUnit = usageRules.filter((r: any) => r.unit === schedUnit && schedLevel >= r.minLevel)
    for (const rule of rulesForUnit) {
      remainingStock -= rule.jumlah
    }

    if (remainingStock <= 0) {
      const estDate = new Date(sched.start)
      const today = new Date()
      today.setHours(0,0,0,0)
      let diffDays = Math.ceil((estDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) diffDays = 0
      return { date: estDate, days: diffDays }
    }
  }
  
  return { date: null, days: '> 5 Tahun' }
}

const enrichedInventory = computed(() => {
  let mapped = inventoryData.value.map(item => {
    return {
      ...item,
      unitsText: getMaterialUnits(item),
      enginesText: getMaterialEngines(item),
      drumText: getDrumEquiv(item),
      estHabis: calculateEstHabis(item)
    }
  })

  if (stockMachineFilter.value) {
    const filterUnits = stockMachineFilter.value.split(',')
    mapped = mapped.filter(item => {
      const rules = getUsageRules(item)
      if (!rules) return false
      return rules.some((r: any) => filterUnits.includes(r.unit.toString()))
    })
  }

  if (stockSort.value === 'rop_status_desc') {
    mapped.sort((a, b) => {
      const weight: Record<string, number> = { 'CRITICAL': 3, 'REORDER': 2, 'SAFE': 1 }
      const weightA = weight[a.rop_status] || 1
      const weightB = weight[b.rop_status] || 1
      
      if (weightB !== weightA) {
        return weightB - weightA
      }
      
      const daysA = (a.estHabis && typeof a.estHabis.days === 'number') ? a.estHabis.days : 999999;
      const daysB = (b.estHabis && typeof b.estHabis.days === 'number') ? b.estHabis.days : 999999;
      if (daysA !== daysB) {
        return daysA - daysB
      }
      
      return a.name.localeCompare(b.name)
    });
  } else if (stockSort.value === 'est_asc' || stockSort.value === 'est_desc') {
    mapped.sort((a, b) => {
      const daysA = (a.estHabis && typeof a.estHabis.days === 'number') ? a.estHabis.days : 999999;
      const daysB = (b.estHabis && typeof b.estHabis.days === 'number') ? b.estHabis.days : 999999;
      return stockSort.value === 'est_asc' ? daysA - daysB : daysB - daysA;
    });
  }

  return mapped
})

const isDownloading = ref(false)
const downloadStockExcel = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  
  try {
    const response = await fetch('/api/materials/template-proxy?url=' + encodeURIComponent('https://aurastorage.serveer.biz.id/api/files/28b89f3a-cc5a-4505-b6bd-bb5c8083da00.xlsx'))
    if (!response.ok) throw new Error('Template file not found')
    const buffer = await response.arrayBuffer()
    
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.getWorksheet(1)
    
    if (!worksheet) throw new Error('Worksheet not found in template')

    let currentRow = 5
    enrichedInventory.value.forEach((item, index) => {
      const estHabisText = item.estHabis?.date ? new Date(item.estHabis.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '> 5 Tahun'
      const durasiText = item.estHabis?.days === '> 5 Tahun' ? '> 5 Tahun' : (item.estHabis?.days != null ? `${item.estHabis.days} Hari` : '-')
      
      const row = worksheet.getRow(currentRow)
      row.getCell('A').value = index + 1
      row.getCell('B').value = item.name
      row.getCell('C').value = item.part_number || '-'
      const getShortName = (text: string) => {
        if (!text || text === '-') return '-';
        return text.split(',').map(s => {
          const t = s.trim().toLowerCase();
          if (t.includes('mitsubishi')) return 'Mitsubishi';
          if (t.includes('cummins')) return 'Cummins';
          if (t.includes('deutz')) return 'Deutz';
          if (t.includes('swd')) return 'SWD';
          return s.trim().split(' ')[0];
        }).join(', ');
      };
      row.getCell('D').value = getShortName(item.enginesText || '-');
      row.getCell('E').value = item.satuan || '-'
      row.getCell('F').value = Number(item.current_stock)
      row.getCell('G').value = item.rop
      row.getCell('H').value = item.roq
      row.getCell('I').value = estHabisText
      row.getCell('J').value = durasiText
      row.getCell('K').value = getRopStatusLabel(item.rop_status)
      
      const borderStyle = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      };

      for (let i = 1; i <= 11; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle;
        cell.font = { bold: false };
        cell.fill = { type: 'pattern', pattern: 'none' };
        if (i === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
      
      currentRow++
    })

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    // Hapus placeholder lama jika ada di template
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string' && cell.value.includes('Data terakhir:')) {
          cell.value = null;
        }
      });
    });

    // Tulis di baris (currentRow + 1) untuk melompati 1 baris kosong
    const dateRow = worksheet.getRow(currentRow + 1);
    dateRow.getCell('A').value = `Data terakhir: ${todayStr}`;
    dateRow.getCell('A').font = { bold: false };
    dateRow.getCell('A').alignment = { horizontal: 'left' };
    
    const outBuffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Stok_Material_Fast_Moving_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to download excel', err)
    showAlert('Gagal mengunduh Excel', 'error')
  } finally {
    isDownloading.value = false
  }
}

const isDownloadingTxn = ref(false)
const downloadTxnExcel = async () => {
  if (isDownloadingTxn.value) return
  isDownloadingTxn.value = true
  
  try {
    const q = new URLSearchParams()
    if (txnFilters.start) q.set('start', txnFilters.start)
    if (txnFilters.end) q.set('end', txnFilters.end)
    if (txnFilters.type) q.set('type', txnFilters.type)
    if (txnFilters.material_id) q.set('material_id', txnFilters.material_id)
    q.set('sort', txnFilters.sort)
    q.set('page', '1')
    q.set('limit', '1000000')

    const res = await fetch(`/api/materials/transactions?${q.toString()}`)
    if (!res.ok) throw new Error('Gagal mengambil data transaksi')
    const json = await res.json()
    const txns = json.data || []

    const response = await fetch('/api/materials/template-proxy?url=' + encodeURIComponent('https://aurastorage.serveer.biz.id/api/files/b7fd8fb0-ff58-46ec-8121-f80ff26724d9.xlsx'))
    if (!response.ok) throw new Error('Template file not found')
    const buffer = await response.arrayBuffer()
    
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.getWorksheet(1)
    
    if (!worksheet) throw new Error('Worksheet not found in template')

    worksheet.getCell('A3').value = `Dari tanggal: ${txnFilters.start ? formatDateShort(txnFilters.start) : '-'}`
    worksheet.getCell('A4').value = `Sampai Tanggal: ${txnFilters.end ? formatDateShort(txnFilters.end) : '-'}`

    let currentRow = 8
    txns.forEach((item, index) => {
      const row = worksheet.getRow(currentRow)
      row.getCell('A').value = index + 1
      row.getCell('B').value = formatDateShort(item.transaction_date)
      row.getCell('C').value = item.material_name
      row.getCell('D').value = item.part_number || '-'
      
      const getShortName = (text: string) => {
        if (!text || text === '-' || text === 'Common') return text || '-';
        return text.split(',').map(s => {
          const t = s.trim().toLowerCase();
          if (t.includes('mitsubishi')) return 'Mitsubishi';
          if (t.includes('cummins')) return 'Cummins';
          if (t.includes('deutz')) return 'Deutz';
          if (t.includes('swd')) return 'SWD';
          return s.trim().split(' ')[0];
        }).join(', ');
      };
      const inv = enrichedInventory.value.find(i => Number(i.id) === Number(item.material_id))
      row.getCell('E').value = getShortName(inv?.enginesText || '-')
      
      row.getCell('F').value = item.transaction_type === 'IN' ? 'Masuk' : 'Keluar'
      row.getCell('G').value = Number(item.quantity)
      row.getCell('H').value = item.satuan || '-'
      row.getCell('I').value = (item.notes || '-').replace(' (Otomatis Webhook)', '')
      
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      for (let i = 1; i <= 9; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle;
        cell.font = { bold: false };
        cell.fill = { type: 'pattern', pattern: 'none' };
        if (i === 3 || i === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
      
      currentRow++
    })

    const outBuffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Log_Transaksi_Material_Fast_Moving_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to download excel', err)
    showAlert('Gagal mengunduh Excel Transaksi', 'error')
  } finally {
    isDownloadingTxn.value = false
  }
}

const loadInventory = async () => {
  stockLoading.value = true
  try {
    const q = new URLSearchParams()
    if (stockSearch.value) q.set('search', stockSearch.value)
    if (stockSort.value) q.set('sort', stockSort.value)
    const res = await fetch(`/api/materials/inventory?${q.toString()}`)
    if (res.ok) {
      const json = await res.json()
      inventoryData.value = json.data
    }
  } finally {
    stockLoading.value = false
  }
}

// ===== TRANSACTIONS TAB =====
const txnFilters = reactive({ start: '', end: '', sort: 'desc', type: '', material_id: '', page: 1, limit: 10 })
const txnLoading = ref(false)
const txnData = ref<any[]>([])
const txnMeta = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })

const loadTransactions = async () => {
  txnLoading.value = true
  try {
    const q = new URLSearchParams()
    if (txnFilters.start) q.set('start', txnFilters.start)
    if (txnFilters.end) q.set('end', txnFilters.end)
    if (txnFilters.sort) q.set('sort', txnFilters.sort)
    if (txnFilters.type) q.set('type', txnFilters.type)
    if (txnFilters.material_id) q.set('material_id', txnFilters.material_id)
    q.set('page', txnFilters.page.toString())
    q.set('limit', txnFilters.limit.toString())
    const res = await fetch(`/api/materials/transactions?${q.toString()}`)
    if (res.ok) {
      const json = await res.json()
      txnData.value = json.data
      txnMeta.value = json.meta
    }
  } finally {
    txnLoading.value = false
  }
}

const applyTxnFilters = () => { txnFilters.page = 1; loadTransactions() }
const resetTxnFilters = () => { txnFilters.start = ''; txnFilters.end = ''; txnFilters.sort = 'desc'; txnFilters.type = ''; txnFilters.material_id = ''; txnFilters.page = 1; loadTransactions() }
const changeTxnPage = (p: number) => { txnFilters.page = p; loadTransactions(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

// ===== TXN MODAL FORM =====
const showTxnModal = ref(false)
const isSubmittingTxn = ref(false)
const editingTxnId = ref<number | null>(null)
const txnForm = reactive({
  material_id: '',
  transaction_type: 'OUT',
  quantity: '1',
  transaction_date: new Date().toISOString().slice(0, 10),
  notes: ''
})

const openTxnModal = () => {
  editingTxnId.value = null
  txnForm.material_id = ''
  txnForm.transaction_type = 'OUT'
  txnForm.quantity = '1'
  txnForm.transaction_date = new Date().toISOString().slice(0, 10)
  txnForm.notes = ''
  showTxnModal.value = true
}

const openEditTxnModal = (item: any) => {
  editingTxnId.value = item.id
  txnForm.material_id = item.material_id.toString()
  txnForm.transaction_type = item.transaction_type
  txnForm.quantity = item.quantity.toString()
  txnForm.transaction_date = new Date(item.transaction_date).toISOString().slice(0, 10)
  txnForm.notes = item.notes || ''
  showTxnModal.value = true
}

const closeTxnModal = () => {
  showTxnModal.value = false
  editingTxnId.value = null
}

const submitTxn = async () => {
  if (!txnForm.material_id || !txnForm.quantity) {
    showAlert('Harap isi material dan jumlah!', 'warning')
    return
  }
  isSubmittingTxn.value = true
  try {
    const url = editingTxnId.value 
      ? `/api/materials/transactions/${editingTxnId.value}`
      : '/api/materials/transactions'
    const method = editingTxnId.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txnForm)
    })
    if (res.ok) {
      showAlert(editingTxnId.value ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil disimpan', 'success')
      closeTxnModal()
      loadInventory() // update stock
      if (activeTab.value === 'transactions') {
        loadTransactions() // update logs directly
      }
    } else {
      const err = await res.json()
      showAlert(err.statusMessage || 'Gagal menyimpan transaksi', 'error')
    }
  } catch(e) {
    showAlert('Gagal menyimpan transaksi', 'error')
  } finally {
    isSubmittingTxn.value = false
  }
}

const handleDeleteTxn = async (item: any) => {
  const confirmMsg = `Transaksi ini akan dihapus secara permanen dari log transaksi dan stok material "${item.material_name}" akan disesuaikan kembali.`
  const isConfirmed = await showConfirm(confirmMsg, 'Hapus Transaksi?')
  if (!isConfirmed) return

  try {
    const res = await fetch(`/api/materials/transactions/${item.id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      showAlert('Transaksi berhasil dihapus', 'success')
      loadInventory() // update stock
      loadTransactions() // refresh list
    } else {
      const err = await res.json()
      showAlert(err.statusMessage || 'Gagal menghapus transaksi', 'error')
    }
  } catch (err) {
    console.error('Error deleting transaction:', err)
    showAlert('Gagal menghapus transaksi', 'error')
  }
}

// ===== USAGE TAB (client-side data) =====
const machineGroupedUsageData = computed(() => {
  const grouped: Record<string, any[]> = {}
  
  materialConfigs.value.forEach(item => {
    if (!grouped[item.mesin]) {
      grouped[item.mesin] = item.material
    }
  })
  
  return Object.keys(grouped).map(mesin => ({
    mesin,
    material: grouped[mesin]
  }))
})

// ===== PLANNING TAB =====
const planFilter = reactive({ start: '', end: '', unitKey: '' })
const planResult = ref<any>(null)
const planLoading = ref(false)

const calculatePlanning = async () => {
  if (!planFilter.start || !planFilter.end || !planFilter.unitKey) return
  planLoading.value = true
  planResult.value = null

  try {
    // Determine which units to include
    let targetUnits: number[] = []
    if (planFilter.unitKey.startsWith('unit:')) {
      targetUnits = [parseInt(planFilter.unitKey.split(':')[1])]
    } else if (planFilter.unitKey.startsWith('group:')) {
      targetUnits = planFilter.unitKey.split(':')[1].split(',').map(Number)
    }

    // Fetch PM schedule for the date range
    const q = new URLSearchParams()
    q.set('start', planFilter.start)
    q.set('end', planFilter.end)
    const res = await fetch(`/api/pm/schedule?${q.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch schedule')
    const allSchedules: any[] = await res.json()

    // Filter schedules for target units
    const filtered = allSchedules.filter((s: any) => {
      const unit = s.extendedProps?.unit || parseInt(s.title?.match(/#(\d+)/)?.[1] || '0')
      return targetUnits.includes(unit)
    })

    // Count PM types
    const pmCounts: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 }
    filtered.forEach((s: any) => {
      const pmType = s.title?.match(/^(P\d)/)?.[1]
      if (pmType && pmCounts[pmType] !== undefined) {
        pmCounts[pmType]++
      }
    })
    const totalPM = Object.values(pmCounts).reduce((a, b) => a + b, 0)

    // Calculate material needs
    // For each unit, each material has a base cycle. That material is used
    // whenever PM level >= base cycle level.
    // e.g. cycle P2 material is used in P2, P3, P4, P5 events.
    const materialMap = new Map<string, { nama: string; part_number: string; totalJumlah: number; currentStock: number; selisih: number; satuan: string; isLubeOil: boolean }>()

    targetUnits.forEach(unitNum => {
      const unitData = materialConfigs.value.find(fm => fm.unit === unitNum)
      if (!unitData) return

      // Count PMs for this specific unit
      const unitPMCounts: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 }
      filtered.forEach((s: any) => {
        const unit = s.extendedProps?.unit || parseInt(s.title?.match(/#(\d+)/)?.[1] || '0')
        const pmType = s.title?.match(/^(P\d)/)?.[1]
        if (unit === unitNum && pmType && unitPMCounts[pmType] !== undefined) {
          unitPMCounts[pmType]++
        }
      })

      unitData.material.forEach((mat: any) => {
        const baseCycleLevel = parseInt(mat.cycle.replace('P', ''))
        // This material is used in all PM types >= baseCycleLevel
        let timesUsed = 0
        for (let level = baseCycleLevel; level <= 5; level++) {
          timesUsed += unitPMCounts['P' + level] || 0
        }

        if (timesUsed > 0) {
          const part_number = (mat as any).part_number || '-'
          const key = mat.nama + '|' + part_number + '|' + mat.satuan
          if (materialMap.has(key)) {
            const entry = materialMap.get(key)!
            entry.totalJumlah += mat.jumlah * timesUsed
            entry.selisih = entry.currentStock - entry.totalJumlah
          } else {
            // Find current stock
            let currentStock = 0
            const inventoryMatch = inventoryData.value.find(inv => inv.name.toLowerCase() === mat.nama.toLowerCase() && (inv.part_number === part_number || part_number === '-'))
            if (inventoryMatch) {
                currentStock = inventoryMatch.current_stock
            } else {
                 const nameMatch = inventoryData.value.find(inv => inv.name.toLowerCase() === mat.nama.toLowerCase())
                 if (nameMatch) currentStock = nameMatch.current_stock
            }

            materialMap.set(key, {
              nama: mat.nama,
              part_number: part_number,
              totalJumlah: mat.jumlah * timesUsed,
              currentStock: currentStock,
              selisih: currentStock - (mat.jumlah * timesUsed),
              satuan: mat.satuan,
              isLubeOil: mat.nama.toLowerCase().includes('lube oil') && !mat.nama.toLowerCase().includes('filter')
            })
          }
        }
      })
    })

    const materials = Array.from(materialMap.values())

    // Build labels
    const unitEngines = targetUnits.map(u => engines.value.find((e: any) => e.unit === u)!).filter(Boolean)
    const unitLabel = targetUnits.length === 1
      ? 'Unit ' + targetUnits[0]
      : 'Unit ' + targetUnits.join(' & ')
    const mesinLabel = [...new Set(unitEngines.map(e => e.mesin))].join(', ')
    const periodeLabel = new Date(planFilter.start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' - '
      + new Date(planFilter.end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

    planResult.value = {
      totalPM,
      pmCounts,
      unitLabel,
      mesinLabel,
      periodeLabel,
      materials
    }
  } catch (err) {
    console.error('Planning calculation error:', err)
    showAlert('Gagal menghitung perencanaan material', 'error')
  } finally {
    planLoading.value = false
  }
}

// ===== LAZY LOADING =====
const stockLoaded = ref(false)
const txnLoaded = ref(false)

watch(activeTab, (tab) => {
  if (tab === 'stock' && !stockLoaded.value) { loadInventory(); stockLoaded.value = true }
  if (tab === 'transactions' && !txnLoaded.value) { loadTransactions(); txnLoaded.value = true }
})

onMounted(() => { 
  loadSchedules()
  loadInventory()
  loadConfigs()
  stockLoaded.value = true 
})

// ===== HELPERS =====
const formatNumber = (num: any) => {
  if (!num && num !== 0) return '-'
  const n = parseFloat(num)
  return n % 1 === 0 ? n.toLocaleString('id-ID') : n.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

const formatDateShort = (dateInput: any) => {
  if (!dateInput) return '-'
  const date = new Date(dateInput)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')
}

const getStockLevel = (item: any) => {
  if (item.current_stock <= 0) return 'stock-empty'
  if (item.rop_status === 'CRITICAL') return 'stock-low'
  if (item.rop_status === 'REORDER') return 'stock-medium'
  return 'stock-good'
}

const getStockCompare = (item: any) => {
  if (item.current_stock <= 0) return 'text-danger'
  if (item.current_stock < item.qty_per_pm * 2) return 'text-warning'
  return 'text-success'
}

const getEnoughCount = (item: any) => {
  if (!item.qty_per_pm || item.qty_per_pm === 0) return '∞'
  return Math.floor(item.current_stock / item.qty_per_pm)
}

const getRopCount = (status: string) => {
  return enrichedInventory.value.filter((item: any) => item.rop_status === status).length
}

const getRopStatusLabel = (status?: string) => {
  if (!status) return '-'
  if (status === 'SAFE') return 'Aman'
  if (status === 'REORDER') return 'Order'
  if (status === 'CRITICAL') return 'Kritis'
  return status
}

const getDrumTextForValue = (value: number, satuan: string) => {
  if (satuan?.toLowerCase() === 'liter' && value > 0) {
    const drums = Math.ceil(value / 209)
    return `(≈ ${drums} Drum)`
  }
  return ''
}

// Tab options with icons
const stockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
const txnIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>'
const usageIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'

const planIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const tabOptions = [
  { value: 'stock', label: 'Stok', icon: stockIcon },
  { value: 'transactions', label: 'Transaksi', icon: txnIcon },
  { value: 'planning', label: 'Perencanaan', icon: planIcon },
  { value: 'usage', label: 'Kebutuhan', icon: usageIcon },
]
</script>

<style>
@media (max-width: 767px) {
  .mobile-collapse-hidden {
    display: none !important;
  }
}

/* ===== Filter Layout ===== */
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



/* ===== Search Input ===== */
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

/* ===== Stock Badges ===== */
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

/* ===== Transaction Type Badge ===== */
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

/* ===== Cycle Pills ===== */
.cycle-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.cycle-pill-p1 { background: rgba(52, 211, 153, 0.2); color: #34d399; }
.cycle-pill-p2 { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
.cycle-pill-p1p2 { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
.cycle-pill-p3 { background: rgba(250, 204, 21, 0.2); color: #facc15; }
.cycle-pill-p4 { background: rgba(251, 113, 133, 0.2); color: #fb7185; }
.cycle-pill-p5 { background: rgba(192, 132, 252, 0.2); color: #c084fc; }

/* ===== Cycle Range ===== */
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

.cycle-range-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cycle-range-text {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  font-weight: 500;
}

/* ===== Cycle Legend ===== */
.cycle-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}
.cycle-legend-item {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
}
.cycle-cascade-visual {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.cascade-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-md);
}
.cascade-arrow {
  color: var(--gray-400);
  font-size: var(--font-size-xs);
}
.cascade-text {
  font-size: 0.7rem;
  color: var(--gray-500);
}
@media (max-width: 640px) {
  .cycle-cascade-visual { flex-direction: column; }
}

.cursor-pointer { cursor: pointer; }

/* Color helpers */
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }

.truncate-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-3);
  opacity: 0.6;
}

/* ===== Mobile Stock Cards ===== */
.material-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.material-stock-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  transition: all var(--transition-base);
}
.material-stock-card:hover { border-color: rgba(255, 255, 255, 0.1); }

.material-stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}
.material-stock-name {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--font-size-sm);
}
.material-stock-meta {
  margin-top: var(--space-2);
}
.material-part-number {
  font-size: var(--font-size-xs);
  color: var(--gray-400);
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
}

/* ===== Mobile Transaction Cards ===== */
.material-txn-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  transition: all var(--transition-base);
}
.material-txn-card:hover { border-color: rgba(255, 255, 255, 0.1); }

.material-txn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
.material-txn-name {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--font-size-sm);
}
.material-txn-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.txn-detail-item { display: flex; flex-direction: column; gap: 2px; }
.txn-detail-label { font-size: var(--font-size-xs); color: var(--gray-400); }
.txn-detail-value { font-size: var(--font-size-sm); color: var(--gray-700); }

.material-txn-notes {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--glass-border);
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  font-style: italic;
}

/* ===== Mobile Usage Cards ===== */
.usage-item-card {
  padding: var(--space-4);
  border-bottom: 1px solid var(--glass-border);
}
.usage-item-card:last-child { border-bottom: none; }

.usage-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
.usage-item-name {
  font-weight: 600;
  color: var(--gray-800);
  font-size: var(--font-size-sm);
}
.usage-item-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
}
.usage-stat { display: flex; flex-direction: column; gap: 2px; }
.usage-stat-label { font-size: var(--font-size-xs); color: var(--gray-400); }
.usage-stat-value { font-size: var(--font-size-sm); color: var(--gray-700); }

.whitespace-nowrap { white-space: nowrap; }

/* ===== Planning Tab ===== */
.plan-summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .plan-summary-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.plan-total-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-500);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.plan-pm-breakdown {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.plan-pm-item {
  background: var(--bg-input);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  min-width: 56px;
  text-align: center;
}

.plan-pm-label {
  font-size: var(--font-size-xs);
  color: var(--gray-500);
  font-weight: 500;
  margin-bottom: 2px;
}

.plan-pm-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.plan-info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.plan-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--glass-border);
}
.plan-info-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.plan-info-label {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}

.plan-info-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-800);
  text-align: right;
}

.plan-qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-500);
  font-weight: 700;
  font-size: var(--font-size-sm);
}

/* Custom styles for transaction actions */
.btn-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--gray-400);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-action-icon:hover {
  color: var(--gray-800);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-action-icon.edit:hover {
  color: var(--primary-400);
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
}

.btn-action-icon.delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-xs {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  border-radius: var(--radius-md);
}

/* ROP & ROQ Custom Styles */
.rop-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}
.rop-safe {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}
.rop-reorder {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.3);
}
.rop-critical {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.2);
}
.summary-rop-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
}
.rop-card-safe {
  border-left: 4px solid var(--success) !important;
}
.rop-card-reorder {
  border-left: 4px solid var(--warning) !important;
}
.rop-card-critical {
  border-left: 4px solid var(--danger) !important;
}
.summary-rop-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

@media (max-width: 767px) {
  .summary-rop-card .summary-rop-icon {
    display: none !important;
  }
  
  .summary-rop-card .card-body {
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    padding: 0.6rem 0.25rem !important;
  }
  
  .summary-rop-card .card-body > div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .summary-rop-card {
    border-radius: var(--radius-lg) !important;
  }

  .rop-card-safe {
    border-left-width: 3px !important;
    background: rgba(34, 197, 94, 0.04) !important;
  }
  .rop-card-reorder {
    border-left-width: 3px !important;
    background: rgba(245, 158, 11, 0.04) !important;
  }
  .rop-card-critical {
    border-left-width: 3px !important;
    background: rgba(239, 68, 68, 0.04) !important;
  }
}
</style>
