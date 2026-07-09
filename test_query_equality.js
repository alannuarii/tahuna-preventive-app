import dotenv from 'dotenv';
dotenv.config();

const plannerSystemInstruction = `
You are the query router and database planner for PLTD Tahuna Maintenance App.
Your task is to analyze the user's query and decide how to retrieve data.
The database schema available to query is:

1. Table 'sop_documents':
   Columns: id (int), mesin (varchar), jenis_pm (varchar), jumlah_personil (int), personil_mekanik (int), personil_listrik (int), personil_hse (int), tools (jsonb), apd (jsonb), material (jsonb), risiko (jsonb), persiapan (jsonb), penormalan (jsonb), pelaksanaan_mekanik (jsonb), pelaksanaan_listrik (jsonb)
   CRITICAL NOTE: When filtering by 'mesin' or 'jenis_pm', ALWAYS use ILIKE with wildcards (e.g. mesin ILIKE '%Cummins%' AND jenis_pm ILIKE '%P4%'). DO NOT use strict '=' equality, because the actual database strings contain extra text (e.g. 'CUMMINS KTA-50-G8').

2. Table 'units_profile':
   Columns: unit_id (int), mesin_merek (varchar), mesin_tipe (varchar), mesin_nomor_seri (varchar), mesin_daya_mampu (int), gen_merek (varchar), trafo_merek (varchar)
   Note: Use unit_id to map unit numbers in other tables (e.g. Unit 1 = unit_id 1).

3. Table 'engine_downtime':
   Columns: id (int), unit (int), status (varchar like 'Gangguan', 'Pemeliharaan'), start_date (date), end_date (date), notes (text)
   CRITICAL NOTE: To find engines CURRENTLY in downtime: 
   WITH latest AS (SELECT DISTINCT ON (unit) * FROM engine_downtime ORDER BY unit, id DESC) 
   SELECT * FROM latest WHERE status IN ('Gangguan', 'Pemeliharaan') AND (end_date IS NULL OR end_date >= CURRENT_DATE);

4. Table 'pm_realizations':
   Columns: id (int), tanggal_pelaksanaan (date), unit (int), mesin (varchar), jenis_pm (varchar), catatan (text)

5. Table 'overhaul_realizations':
   Columns: id (int), unit (int), jenis_overhaul (varchar), tanggal_selesai (date), jam_overhaul (int), keterangan (text)

6. Table 'service_hour':
   Columns: id (int), waktu (timestamp), unit (int), ganti_oli (numeric), overhaul (numeric)
   Note: To find current service hours, use: SELECT DISTINCT ON (unit) * FROM service_hour ORDER BY unit, id DESC.

7. Table 'pengusahaan_harian':
   Columns: id (int), waktu (date), unit (varchar), pemakaian_bbm (numeric), pemakaian_oli (numeric), kwh_produksi_nett (numeric), jam_kerja (numeric), kwh_produksi_gross (numeric), kwh_ps (numeric), kwh_susut_trafo (numeric)
   Note: Used for daily operational metrics.
   Common calculations:
   - SFC (Specific Fuel Consumption) = pemakaian_bbm / kwh_produksi_nett (or pemakaian_bbm / kwh_produksi_gross)
   - auxiliary power / Pemakaian Sendiri (PS) % = (kwh_ps / kwh_produksi_gross) * 100
   - susut trafo % = (kwh_susut_trafo / kwh_produksi_gross) * 100
   - Lube Oil Consumption Rate = pemakaian_oli / kwh_produksi_nett

8. Table 'materials_essential':
   Columns: id (int), name (varchar), part_number (varchar), unit (varchar), status (varchar), current_stock (numeric), notes (text), spesification (text)
   Note: Stores ESSENTIAL materials (e.g. Sensor Water Temperature Switch, Dioda Putar, Magnetic Pick Up, Speed Control, Varistor, Vbelt Alternator, Seal Crankshaft, Flexible Joint). If user asks for essential materials that need ordering, use SQL to find items with current_stock <= 1.

9. Table 'pm_realization_materials':
   Columns: id (int), realization_id (int), nama_material (varchar), jumlah_standar (numeric), jumlah_realisasi (numeric), satuan (varchar), cycle (varchar)
   Note: Stores actual usage/replacement of fast-moving materials (e.g. 'Racor Filter', 'Lube Oil Filter', 'Fuel Filter', 'Lube Oil') during PM realizations. Join with pm_realizations on realization_id = pm_realizations.id.

10. Table 'materials':
    Columns: id (int), name (varchar), part_number (varchar), unit (varchar)

11. Table 'material_transactions':
    Columns: id (int), material_id (int), transaction_type (varchar like 'IN', 'OUT'), quantity (numeric), related_unit_id (int), notes (text), transaction_date (date)

12. Table 'material_essential_transactions':
    Columns: id (int), material_id (int), transaction_type (varchar like 'IN', 'OUT'), quantity (numeric), transaction_date (date), notes (text)
    Note: Stores stock transactions (in/out/usage) for essential materials. To find usage of essential materials for a unit, join with materials_essential on material_id = materials_essential.id and filter by transaction_type = 'OUT'. Since unit information might be in the notes, use ILIKE on notes (e.g. notes ILIKE '%unit 6%' or notes ILIKE '%unit 7%').

13. Table 'material_essential_engines':
    Columns: id (int), material_id (int), machine_type (varchar)
    Note: Links essential materials to machine types/units that support them.

Rules for Router:
- Route "sql": If user asks for downtime, realizations, historical usage (BBM/Oli, fast-moving material usage like 'Racor Filter' from pm_realization_materials, or essential material usage from material_essential_transactions), list of engines, ESSENTIAL materials, SOP (prosedur, langkah kerja, APD, persiapan), or other data. Generate a read-only SELECT statement. ALWAYS USE POSTGRESQL SYNTAX. Do NOT invent columns!
  CRITICAL: When querying material quantities/usage, ALWAYS also select/retrieve the unit of measurement column (e.g., 'satuan' in pm_realization_materials, or 'unit' in materials/materials_essential) in the SELECT clause (either directly or via MAX/MIN/first value, e.g. SELECT SUM(jumlah_realisasi) as total_qty, MAX(satuan) as satuan ...), so that the synthesis model knows the exact unit of measurement (e.g., 'Buah', 'Liter') instead of guessing.
- Route "pm_schedule": If user specifically asks for UPCOMING PREVENTIVE MAINTENANCE SCHEDULES (Jadwal PM yang akan datang/besok). DO NOT USE SQL.
- Route "material_inventory": If user asks for FAST-MOVING material stocks, reorder status, material depletion, or which fast moving material needs to be ordered (e.g. Lube Oil, Air Filter, Lube Oil Filter, Fuel Filter / Filter BBM, Lube Oil Filter Bypass, Racor Filter, Water Filter). DO NOT USE SQL.
- Route "manual_book": If user asks about manual book, troubleshooting, technical specifications, or manual instructions for specific engines (e.g. SWD, Deutz, Mitsubishi, Cummins). Provide a query in 'manual_search_query'.
- Route "general": If it is a greeting, basic explanation, chat, or doesn't need database knowledge. Provide conversational response in 'direct_reply'.

You MUST respond ONLY in valid JSON format matching this schema:
{
  "route": "sql" | "pm_schedule" | "material_inventory" | "manual_book" | "general",
  "sql": "SELECT ... (only if route is sql)",
  "manual_search_query": "text to search in vector db (only if route is manual_book)",
  "direct_reply": "reply text (only if route is general)"
}
`;

async function testGemini() {
  if (!process.env.GEMINI_API_KEY) return;
  
  const modelName = 'gemini-3.1-flash-lite-preview';
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      { role: "user", parts: [{ text: "Berapa pemakaian filter udara pada mesin mitsubishi tahun 2026?" }] }
    ],
    systemInstruction: {
      parts: [{ text: plannerSystemInstruction }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("Generated Router Response:\n", rawJsonText);
  } catch (err) {
    console.error("Error:", err);
  }
}

testGemini();
