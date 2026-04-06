import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { engines } from "~/lib/engineData";
import PMCalendar from "~/components/PMCalendar";
import CommonPagination from "~/components/CommonPagination";
import SegmentedControl from "~/components/SegmentedControl";
import "~/components/PreventiveRealisasi.css";

export default function PreventiveRealisasi() {
  const [viewMode, setViewMode] = createSignal("table");
  const [filters, setFilters] = createSignal({ start: "", end: "", unit: "", page: 1, limit: 10 });
  const [responseData, setResponseData] = createSignal<any>(null);
  const [calendarData, setCalendarData] = createSignal<any>(null);
  const [pending, setPending] = createSignal(false);

  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [selectedDetail, setSelectedDetail] = createSignal<any>(null);
  const [itemToDelete, setItemToDelete] = createSignal<any>(null);
  const [deleting, setDeleting] = createSignal(false);
  const [loadingDetail, setLoadingDetail] = createSignal(false);

  const refresh = async () => {
    setPending(true);
    try {
      const q = new URLSearchParams();
      if (filters().start) q.set("start", filters().start);
      if (filters().end) q.set("end", filters().end);
      if (filters().unit) q.set("unit", filters().unit);
      q.set("page", filters().page.toString());
      q.set("limit", filters().limit.toString());
      
      const res = await fetch(`/api/pm/realizations?${q.toString()}`);
      if (res.ok) setResponseData(await res.json());
    } finally {
      setPending(false);
    }
  };

  const loadCalendarData = async () => {
    const q = new URLSearchParams();
    if (filters().start) q.set("start", filters().start);
    if (filters().end) q.set("end", filters().end);
    if (filters().unit) q.set("unit", filters().unit);
    q.set("limit", "0");
    const res = await fetch(`/api/pm/realizations?${q.toString()}`);
    if (res.ok) setCalendarData(await res.json());
  };

  onMount(() => {
    refresh();
  });

  // Watch for viewMode change handled manually since SolidJS effects run reactively:
  createMemo(() => {
    if (viewMode() === "calendar" && !calendarData()) {
      loadCalendarData();
    }
  });

  const realizations = createMemo(() => responseData()?.data || []);

  const changePage = (newPage: number) => {
    setFilters({ ...filters(), page: newPage });
    refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calendarEvents = createMemo(() => {
    const sourceData = calendarData()?.data || [];
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
    }));
  });

  const handleEventClick = async (event: any) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pm/realizations/${event.id}`);
      if (res.ok) {
        setSelectedDetail(await res.json());
        setShowDetailModal(true);
      } else {
        alert("Gagal memuat detail realisasi");
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const applyFilters = () => {
    setFilters({ ...filters(), page: 1 });
    refresh();
  };

  const resetFilters = () => {
    setFilters({ start: "", end: "", unit: "", page: 1, limit: 10 });
    refresh();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "2-digit"
    });
  };

  const getPMBadgeClass = (pm: string) => {
    const classes: Record<string, string> = {
      P1: "badge-info",
      P2: "badge-success",
      P3: "badge-warning",
      P4: "badge-danger",
      P5: "badge-primary"
    };
    return classes[pm] || "badge-secondary";
  };

  const confirmDelete = (item: any) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const deleteRealization = async () => {
    if (!itemToDelete()) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pm/realizations/${itemToDelete().id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(false);
        setItemToDelete(null);
        refresh();
      } else {
        alert("Gagal menghapus data");
      }
    } finally {
      setDeleting(false);
    }
  };

  const viewOptions = [
    {
      value: 'table',
      label: 'Data',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      )
    },
    {
      value: 'calendar',
      label: 'Kalender',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    }
  ];

  return (
    <div class="animate-fade-in">
      <div class="page-header">
        <h1 class="home-title m-0">Realisasi Preventive Maintenance</h1>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="flex-1 md:flex-none">
            <SegmentedControl
              options={viewOptions}
              value={viewMode()}
              onChange={setViewMode}
            />
          </div>
          
          <A href="/realisasi/input" class="btn btn-primary btn-icon-only" style="flex-shrink: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span class="hidden sm:inline">Tambah</span>
          </A>
        </div>
      </div>

      <Show when={viewMode() === "table"}>
        <div class="card mb-4">
          <div class="card-body">
            <div class="realisasi-filter-grid">
              <div class="form-group mb-0">
                <label class="form-label">Dari Tanggal</label>
                <input 
                  type="date" 
                  value={filters().start}
                  onInput={e => setFilters({ ...filters(), start: e.currentTarget.value })}
                  class="form-input form-input-sm"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={filters().end}
                  onInput={e => setFilters({ ...filters(), end: e.currentTarget.value })}
                  class="form-input form-input-sm"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Unit</label>
                <select 
                  value={filters().unit}
                  onChange={e => setFilters({ ...filters(), unit: e.currentTarget.value })}
                  class="form-input form-input-sm"
                >
                  <option value="">Semua</option>
                  <For each={engines}>
                    {engine => (
                      <option value={engine.unit}>Unit {engine.unit}</option>
                    )}
                  </For>
                </select>
              </div>
              <div class="form-group mb-0 realisasi-filter-actions">
                <label class="form-label" style="opacity: 0; display: none;">&nbsp;</label>
                <div class="flex gap-2">
                  <button class="btn btn-primary btn-sm flex-1" onClick={applyFilters}>
                    Filter
                  </button>
                  <button class="btn btn-secondary btn-sm flex-1" onClick={resetFilters}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={pending()}>
        <div class="loading-container">
          <div class="spinner spinner-lg"></div>
          <p class="mt-4 text-muted">Memuat data...</p>
        </div>
      </Show>

      <Show when={!pending() && realizations().length === 0}>
        <div class="card">
          <div class="card-body text-center py-8">
            <p class="text-muted text-lg mb-4">Belum ada data realisasi</p>
            <A href="/realisasi/input" class="btn btn-primary">
              + Tambah Realisasi Pertama
            </A>
          </div>
        </div>
      </Show>

      <Show when={!pending() && realizations().length > 0 && viewMode() === "calendar"}>
        <PMCalendar events={calendarEvents()} onEventClick={handleEventClick} />
      </Show>

      <Show when={!pending() && realizations().length > 0 && viewMode() === "table"}>
        <div class="card bg-white shadow-md rounded-xl">
          <div class="table-wrapper">
            <table class="table table-mobile-optimized">
              <thead>
                <tr>
                  <th style="min-width: 90px;">Tanggal</th>
                  <th style="min-width: 70px;">Unit</th>
                  <th style="min-width: 100px;" class="hidden sm:table-cell">Mesin</th>
                  <th>Jenis PM</th>
                  <th style="min-width: 120px;" class="hidden sm:table-cell">Catatan</th>
                  <th style="min-width: 80px;" class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <For each={realizations()}>{item => (
                  <tr>
                    <td class="whitespace-nowrap">{formatDate(item.tanggal_pelaksanaan)}</td>
                    <td class="font-semibold">Unit {item.unit}</td>
                    <td class="text-xs hidden sm:table-cell">{item.mesin}</td>
                    <td>
                      <span class={`badge ${getPMBadgeClass(item.jenis_pm)}`}>
                        {item.jenis_pm}
                      </span>
                    </td>
                    <td class="text-xs text-muted max-w-[150px] truncate hidden sm:table-cell" title={item.catatan}>{item.catatan || "-"}</td>
                    <td>
                      <div class="flex gap-1 justify-end">
                        <A 
                          href={`/realisasi/input?edit=${item.id}`} 
                          class="btn btn-sm btn-secondary btn-icon-sm"
                          title="Edit"
                        >
                          ✏️
                        </A>
                        <button 
                          class="btn btn-sm btn-danger btn-icon-sm" 
                          onClick={() => confirmDelete(item)}
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        </div>
        
        <Show when={responseData()?.meta?.totalPages > 1}>
          <CommonPagination 
            currentPage={responseData().meta.page}
            totalPages={responseData().meta.totalPages}
            total={responseData().meta.total}
            onChange={changePage}
          />
        </Show>
      </Show>

      <Show when={showDetailModal()}>
        <div class="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}>
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3 class="modal-title">Detail Realisasi</h3>
              <button class="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div class="modal-body">
              <Show when={selectedDetail()}>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Tanggal Pelaksanaan</span>
                    <span class="detail-value">{formatDate(selectedDetail().tanggal_pelaksanaan)}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Unit</span>
                    <span class="detail-value">Unit {selectedDetail().unit}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Mesin</span>
                    <span class="detail-value">{selectedDetail().mesin}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Jenis PM</span>
                    <span class="detail-value">
                      <span class={`badge ${getPMBadgeClass(selectedDetail().jenis_pm)}`}>
                        {selectedDetail().jenis_pm}
                      </span>
                    </span>
                  </div>
                  <Show when={selectedDetail().catatan}>
                    <div class="detail-item full-width">
                      <span class="detail-label">Catatan</span>
                      <span class="detail-value">{selectedDetail().catatan}</span>
                    </div>
                  </Show>
                </div>

                <Show when={selectedDetail().materials && selectedDetail().materials.length > 0}>
                  <div class="mt-4">
                    <h4 class="section-subtitle">Material yang Digunakan</h4>
                    <div class="table-wrapper">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Cycle</th>
                            <th class="text-right">Standar</th>
                            <th class="text-right">Realisasi</th>
                            <th>Satuan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={selectedDetail().materials}>{mat => (
                            <tr>
                              <td>{mat.nama_material}</td>
                              <td>
                                <span class={`badge badge-sm ${getPMBadgeClass(mat.cycle)}`}>
                                  {mat.cycle}
                               </span>
                              </td>
                              <td class="text-right">{mat.jumlah_standar}</td>
                              <td class="text-right font-bold">{mat.jumlah_realisasi}</td>
                              <td>{mat.satuan}</td>
                            </tr>
                          )}</For>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
              <A 
                href={`/realisasi/input?edit=${selectedDetail()?.id}`} 
                class="btn btn-primary"
              >
                ✏️ Edit
              </A>
            </div>
          </div>
        </div>
      </Show>

      <Show when={showDeleteModal()}>
        <div class="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">Konfirmasi Hapus</h3>
            </div>
            <div class="modal-body">
              <p>Apakah Anda yakin ingin menghapus realisasi ini?</p>
              <p class="text-muted text-sm mt-2">
                Unit {itemToDelete()?.unit} - {itemToDelete()?.jenis_pm} 
                ({formatDate(itemToDelete()?.tanggal_pelaksanaan)})
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button class="btn btn-danger" onClick={deleteRealization} disabled={deleting()}>
                {deleting() ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
