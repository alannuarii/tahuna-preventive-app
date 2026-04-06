import { createSignal, onMount, Switch, Match, For, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { engines } from "~/lib/engineData";
import "~/components/PreventiveDetail.css";

export default function PreventiveDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = createSignal<any>({});
  const [materialsData, setMaterialsData] = createSignal<any>({});
  const [materialsPending, setMaterialsPending] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  onMount(async () => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("selectedEvent");
      if (stored) {
        const parsed = JSON.parse(stored);
        setEventData(parsed);
        setLoaded(true);
        setMaterialsPending(true);
        try {
          const res = await fetch(`/api/materials?unit=${parsed.unit}`);
          if (res.ok) setMaterialsData(await res.json());
        } finally {
          setMaterialsPending(false);
        }
      } else {
        setLoaded(true);
      }
    }
  });

  const formatNumber = (num: any) => {
    if (!num && num !== 0) return "-";
    return Math.round(num).toLocaleString("id-ID");
  };

  const goBack = () => {
    navigate(-1);
  };

  const getEngineName = (unit: number) => {
    const engine = engines.find(e => e.unit === unit);
    return engine?.mesin || `Engine Unit ${unit}`;
  };

  const getPMBadgeClass = (pm: string) => {
    if (!pm) return "badge-secondary";
    const p = pm.replace(/\s.*/, "");
    const classes: Record<string, string> = {
      P1: "badge-info",
      P2: "badge-success",
      P3: "badge-warning",
      P4: "badge-danger",
      P5: "badge-primary"
    };
    return classes[p] || "badge-secondary";
  };

  const getProgressPercent = () => {
    const current = eventData().currentHours || 0;
    const target = eventData().targetHours || 1;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressClass = () => {
    const pct = getProgressPercent();
    if (pct >= 95) return "progress-danger";
    if (pct >= 80) return "progress-warning";
    return "progress-primary";
  };

  const getTimeToGoLabel = () => {
    const days = eventData().timeToGo;
    if (!days && days !== 0) return "-";
    if (days < 0) return "Terlambat";
    if (days === 0) return "Hari ini";
    return `${Math.ceil(days)} hari lagi`;
  };

  const getTimeToGoClass = () => {
    const days = eventData().timeToGo;
    if (!days && days !== 0) return "";
    if (days < 0) return "text-danger-glow";
    if (days <= 7) return "text-warning-glow";
    return "text-success-glow";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "pagi";
    if (hour < 15) return "siang";
    if (hour < 18) return "sore";
    return "malam";
  };

  const getReportText = () => {
    if (!eventData().unit) return "";
    const pm = eventData().pm ? eventData().pm.split(" ")[0] : "";
    const fullEngine = getEngineName(eventData().unit);
    const engineShort = fullEngine.split(" ")[0] || "Mesin";
    return `Selamat ${getGreeting()}, besok akan dilaksanakan pemeliharaan rutin ${pm} pada mesin ${engineShort} #${eventData().unit}`;
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div class="animate-fade-in">
      {/* Header */}
      <div class="detail-page-header">
        <button class="btn-back" onClick={goBack} aria-label="Kembali">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div class="detail-page-title-wrapper">
          <h1 class="home-title m-0">Detail Jadwal PM</h1>
          <Show when={eventData().pm}>
            <span class={`badge ${getPMBadgeClass(eventData().pm)}`}>
              {eventData().pm}
            </span>
          </Show>
        </div>
      </div>

      <Show when={!loaded()}>
        <div class="loading-container">
          <div class="spinner spinner-lg"></div>
          <p class="mt-4 text-muted">Memuat data...</p>
        </div>
      </Show>

      <Show when={loaded() && !eventData().unit}>
        <div class="card">
          <div class="card-body text-center py-8">
            <div class="empty-state-icon">📋</div>
            <p class="text-muted text-lg mb-4">Data tidak ditemukan</p>
            <button class="btn btn-primary" onClick={goBack}>
              ← Kembali
            </button>
          </div>
        </div>
      </Show>

      <Show when={loaded() && eventData().unit}>
        {/* Status Overview Card */}
        <div class="detail-status-card">
          <div class="detail-status-header">
            <div class="detail-status-unit">
              <span class="detail-unit-number">Unit {eventData().unit}</span>
              <span class="detail-unit-engine">{getEngineName(eventData().unit)}</span>
            </div>
            <div class={`detail-countdown ${getTimeToGoClass()}`}>
              <span class="detail-countdown-value">{getTimeToGoLabel()}</span>
              <span class="detail-countdown-label">Jadwal PM</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div class="detail-progress-section">
            <div class="detail-progress-labels">
              <span class="text-muted text-xs">Jam Operasi</span>
              <span class="text-xs font-semibold">
                {formatNumber(eventData().currentHours)} / {formatNumber(eventData().targetHours)} jam
              </span>
            </div>
            <div class="detail-progress-track">
              <div 
                class={`detail-progress-fill ${getProgressClass()}`}
                style={`width: ${getProgressPercent()}%`}
              ></div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div class="detail-cards-grid">
          {/* Machine Info */}
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
                  <span class="detail-info-value">Unit {eventData().unit}</span>
                </div>
                <div class="detail-info-row">
                  <span class="detail-info-label">Mesin</span>
                  <span class="detail-info-value">{getEngineName(eventData().unit)}</span>
                </div>
                <div class="detail-info-row">
                  <span class="detail-info-label">Jenis PM</span>
                  <span class="detail-info-value">
                    <span class={`badge ${getPMBadgeClass(eventData().pm)}`}>{eventData().pm}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
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
                  <span class="detail-info-value font-mono">{formatNumber(eventData().currentHours)} jam</span>
                </div>
                <div class="detail-info-row">
                  <span class="detail-info-label">Target</span>
                  <span class="detail-info-value font-mono">{formatNumber(eventData().targetHours)} jam</span>
                </div>
                <Show when={eventData().gantiOli !== undefined}>
                  <div class="detail-info-row">
                    <span class="detail-info-label">Ganti Oli</span>
                    <span class="detail-info-value font-mono">
                      {formatNumber(eventData().gantiOli)} / {formatNumber(eventData().gantiOliCycles)} jam
                    </span>
                  </div>
                </Show>
                <Show when={eventData().overhaul !== undefined}>
                  <div class="detail-info-row">
                    <span class="detail-info-label">Overhaul</span>
                    <span class="detail-info-value font-mono">
                      {formatNumber(eventData().overhaul)} / {formatNumber(eventData().overhaulCycles)} jam
                    </span>
                  </div>
                </Show>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
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
                  <span class="detail-info-value">{eventData().tanggalPM || "-"}</span>
                </div>
                <div class="detail-info-row">
                  <span class="detail-info-label">Estimasi</span>
                  <span class={`detail-info-value ${getTimeToGoClass()}`}>
                    {getTimeToGoLabel()}
                  </span>
                </div>
                <Show when={eventData().operasi !== undefined}>
                  <div class="detail-info-row">
                    <span class="detail-info-label">Sisa Operasi</span>
                    <span class="detail-info-value font-mono">
                      {formatNumber(eventData().targetHours - eventData().currentHours)} jam
                    </span>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Table */}
        <div class="card mt-6">
          <div class="card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Material yang Dibutuhkan
            <Show when={materialsData()?.applicableCycles}>
              <span class="badge-cycles">
                {materialsData().applicableCycles.join(" + ")}
              </span>
            </Show>
          </div>
          <div class="card-body" style="padding: 0;">
            <Switch fallback={
              <div class="materials-table-container">
                <div class="table-responsive">
                  <table class="materials-table">
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 50px;">No</th>
                        <th>Nama Material</th>
                        <th class="text-center" style="width: 100px;">Jumlah</th>
                        <th class="text-center" style="width: 100px;">Satuan</th>
                        <th class="text-center" style="width: 80px;">Siklus</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={materialsData().materials}>
                        {(item: any, index) => (
                          <tr classList={{ "highlight-row": item.isCurrentCycle }}>
                            <td class="text-center">{index() + 1}</td>
                            <td>{item.nama}</td>
                            <td class="text-center font-semibold">{item.jumlah}</td>
                            <td class="text-center">{item.satuan}</td>
                            <td class="text-center">
                              <span class={`cycle-badge cycle-${String(item.cycle || '').toLowerCase()}`}>
                                {item.cycle}
                              </span>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
                <Show when={materialsData()?.materials?.length}>
                  <div class="materials-legend">
                    <div class="legend-item">
                      <span class="legend-dot current"></span>
                      <span class="text-muted text-sm">Material siklus {eventData().pm} (saat ini)</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot inherited"></span>
                      <span class="text-muted text-sm">Material dari siklus sebelumnya</span>
                    </div>
                  </div>
                </Show>
              </div>
            }>
              <Match when={materialsPending()}>
                <div class="loading-container" style="min-height: 200px;">
                  <div class="spinner"></div>
                  <p class="mt-2 text-muted">Memuat material...</p>
                </div>
              </Match>
              <Match when={!materialsData()?.materials?.length}>
                <div class="text-center py-6">
                  <p class="text-muted">Tidak ada data material untuk unit ini</p>
                </div>
              </Match>
            </Switch>
          </div>
        </div>

        {/* Report Text Card */}
        <div class="card mt-6 mb-6">
          <div class="card-header flex justify-between items-center w-full">
            <div class="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Format Laporan
            </div>
            <button 
              class={`btn btn-sm ${copied() ? 'btn-success' : 'btn-secondary'} flex items-center gap-1`}
              onClick={copyToClipboard}
              style="padding: 4px 10px;"
            >
              <Show when={!copied()} fallback={
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Tersalin
                </>
              }>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </Show>
            </button>
          </div>
          <div class="card-body">
            <div class="p-3 rounded-lg" style="background: rgba(0,0,0,0.2); border: 1px dashed var(--glass-border);">
              <p class="text-sm text-gray-300 m-0" style="line-height: 1.6;">
                {getReportText()}
              </p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
