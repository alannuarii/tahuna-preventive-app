import { createSignal, createEffect, onMount, For, Show } from "solid-js";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { engines } from "~/lib/engineData";
import "~/components/PreventiveRealisasiInput.css";

export default function PreventiveRealisasiInput() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEdit = () => !!searchParams.edit;
  const editId = () => searchParams.edit;

  const [form, setForm] = createSignal({
    tanggal_pelaksanaan: "",
    unit: "",
    jenis_pm: "",
    catatan: ""
  });

  const [materials, setMaterials] = createSignal<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = createSignal(false);
  const [loadingData, setLoadingData] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  const loadMaterials = async (unitParam: string) => {
    if (!unitParam) return;
    setLoadingMaterials(true);
    try {
      const res = await fetch(`/api/materials?unit=${unitParam}`);
      if (res.ok) {
        const body = await res.json();
        setMaterials(body.materials.map((m: any) => ({ ...m, jumlah_realisasi: 0 })));
      } else {
        setMaterials([]);
      }
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  onMount(async () => {
    if (isEdit() && editId()) {
      setLoadingData(true);
      try {
        const res = await fetch(`/api/pm/realizations/${editId()}`);
        if (res.ok) {
          const data = await res.json();
          const dateStr = new Date(data.tanggal_pelaksanaan).toISOString().split('T')[0];
          setForm({
            tanggal_pelaksanaan: dateStr,
            unit: String(data.unit),
            jenis_pm: data.jenis_pm,
            catatan: data.catatan || ""
          });

          await loadMaterials(String(data.unit));

          if (data.materials && data.materials.length > 0) {
            setMaterials(prev => prev.map(m => {
              const savedItem = data.materials.find((s: any) => s.nama_material === m.nama);
              if (savedItem) return { ...m, jumlah_realisasi: savedItem.jumlah_realisasi };
              return m;
            }));
          }
        } else {
           navigate('/realisasi', { replace: true });
        }
      } catch {
        alert("Gagal memuat data");
        navigate('/realisasi', { replace: true });
      } finally {
        setLoadingData(false);
      }
    }
  });

  const onUnitChange = async (e: any) => {
    const val = e.currentTarget.value;
    setForm(prev => ({ ...prev, unit: val }));
    if (val) {
      await loadMaterials(val);
    } else {
      setMaterials([]);
    }
  };

  const updateMaterialQty = (index: number, val: string) => {
    const num = parseFloat(val);
    setMaterials(prev => {
      const next = [...prev];
      next[index].jumlah_realisasi = isNaN(num) ? 0 : num;
      return next;
    });
  };

  const getCycleBadgeClass = (cycle: string) => {
    const classes: Record<string, string> = {
      P1: "badge-info", P2: "badge-success", P3: "badge-warning", P4: "badge-danger", P5: "badge-primary"
    };
    return classes[cycle] || "badge-secondary";
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!form().tanggal_pelaksanaan || !form().unit || !form().jenis_pm) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const mData = materials()
      .filter(m => m.jumlah_realisasi > 0)
      .map(m => ({
        nama_material: m.nama,
        jumlah_standar: m.jumlah,
        jumlah_realisasi: m.jumlah_realisasi,
        satuan: m.satuan,
        cycle: m.cycle
      }));

    const payload = {
      tanggal_pelaksanaan: form().tanggal_pelaksanaan,
      unit: parseInt(form().unit),
      jenis_pm: form().jenis_pm,
      catatan: form().catatan || null,
      materials: mData
    };

    setSubmitting(true);
    try {
      const url = isEdit() ? `/api/pm/realizations/${editId()}` : `/api/pm/realizations`;
      const method = isEdit() ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        navigate('/realisasi');
      } else {
        alert("Gagal menyimpan data");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <h1 class="home-title m-0">{isEdit() ? "Edit" : "Input"} Realisasi PM</h1>
        
        <A href="/realisasi" class="btn btn-secondary">
          ← Kembali
        </A>
      </div>

      <Show when={isEdit() && loadingData()}>
        <div class="text-center py-8">
          <div class="spinner spinner-lg"></div>
          <p class="mt-4 text-muted">Memuat data...</p>
        </div>
      </Show>

      <Show when={!(isEdit() && loadingData())}>
        <form onSubmit={handleSubmit} class="card">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="form-group">
                <label class="form-label">Tanggal Pelaksanaan <span class="text-danger">*</span></label>
                <input 
                  type="date" 
                  value={form().tanggal_pelaksanaan}
                  onInput={e => setForm(f => ({ ...f, tanggal_pelaksanaan: e.currentTarget.value }))}
                  class="form-input"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Unit/Mesin <span class="text-danger">*</span></label>
                <select 
                  value={form().unit}
                  onChange={onUnitChange}
                  class="form-input"
                  required
                >
                  <option value="">Pilih Unit</option>
                  <For each={engines}>{engine => (
                    <option value={engine.unit}>Unit {engine.unit} - {engine.mesin}</option>
                  )}</For>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Jenis PM <span class="text-danger">*</span></label>
                <select 
                  value={form().jenis_pm}
                  onChange={e => setForm(f => ({ ...f, jenis_pm: e.currentTarget.value }))}
                  class="form-input" 
                  required
                >
                  <option value="">Pilih PM</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                  <option value="P4">P4</option>
                  <option value="P5">P5</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Catatan (Opsional)</label>
              <textarea 
                value={form().catatan}
                onInput={e => setForm(f => ({ ...f, catatan: e.currentTarget.value }))}
                class="form-input"
                rows="2"
                placeholder="Catatan tambahan..."
              ></textarea>
            </div>

            <div class="materials-section">
              <h3 class="section-title">Material yang Digunakan</h3>
              
              <Show when={!form().unit}>
                <div class="text-center py-6 text-muted">
                  <p>Pilih unit terlebih dahulu untuk melihat daftar material</p>
                </div>
              </Show>

              <Show when={form().unit && loadingMaterials()}>
                <div class="text-center py-6">
                  <div class="spinner"></div>
                  <p class="mt-2 text-muted">Memuat material...</p>
                </div>
              </Show>

              <Show when={form().unit && !loadingMaterials() && materials().length === 0}>
                <div class="text-center py-6 text-muted">
                  <p>Tidak ada material untuk unit ini</p>
                </div>
              </Show>

              <Show when={form().unit && !loadingMaterials() && materials().length > 0}>
                <div class="table-responsive">
                  <table class="table table-materials">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th style="width: 80px;">Cycle</th>
                        <th style="width: 120px;">Jumlah Standar</th>
                        <th style="width: 150px;">Jumlah Realisasi</th>
                        <th style="width: 80px;">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={materials()}>{(material, index) => (
                        <tr>
                          <td>{material.nama}</td>
                          <td>
                            <span class={`badge ${getCycleBadgeClass(material.cycle)}`}>
                              {material.cycle}
                            </span>
                          </td>
                          <td class="text-center">{material.jumlah}</td>
                          <td>
                            <input 
                              type="number" 
                              value={material.jumlah_realisasi}
                              onInput={e => updateMaterialQty(index(), e.currentTarget.value)}
                              class="form-input form-input-sm text-center"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </td>
                          <td>{material.satuan}</td>
                        </tr>
                      )}</For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-top">
              <A href="/realisasi" class="btn btn-secondary">
                Batal
              </A>
              <button type="submit" class="btn btn-primary" disabled={submitting()}>
                {submitting() ? "Menyimpan..." : (isEdit() ? "Update" : "Simpan")}
              </button>
            </div>
          </div>
        </form>
      </Show>
    </div>
  );
}
