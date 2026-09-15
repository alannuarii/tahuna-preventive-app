import dns from 'node:dns'
dns.setDefaultResultOrder('ipv4first')

import { query } from '~/server/utils/db'
import { QdrantClient } from '@qdrant/js-client-rest'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ChatMessage {
  sender: 'user' | 'bot'
  text: string
}

// SQL validation to prevent destructive commands
function isSafeSql(sql: string): boolean {
  const upperSql = sql.toUpperCase().trim()
  
  // Must start with SELECT or WITH
  if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('WITH')) {
    return false
  }

  // Blacklist modification operations to prevent SQL injections or schema alterations
  const blacklistedKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 
    'REPLACE', 'GRANT', 'REVOKE', 'TRUNCATE', 'EXEC ', 'EXECUTE',
    '--', 'UNION', 'INTO', 'COPY', 'PG_SLEEP'
  ]

  for (const keyword of blacklistedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(upperSql)) {
      return false
    }
  }

  return true
}

async function fetchWithRetry(url: string, options: any, maxRetries = 2): Promise<Response> {
  let lastError: any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (res.status === 429 || res.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
        continue
      }
      return res
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
      }
    }
  }
  throw lastError
}

export default defineEventHandler(async (event) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY is not configured in .env'
    })
  }

  const body = await readBody<{ messages: ChatMessage[] }>(event)
  if (!body || !body.messages || body.messages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Messages are required'
    })
  }

  const messages = body.messages
  const latestMessage = messages[messages.length - 1].text

  // Map messages history to Gemini format
  const geminiHistory = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }))

  const modelName = 'gemini-3.1-flash-lite-preview'
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  // STAGE 1: PLANNING & ROUTING
  // Instruct Gemini to analyze the user's prompt and decide whether to fetch data
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
   PLTD Tahuna Unit to Engine Mapping:
   - Unit 1: SWD (6FHD 240)
   - Unit 4 & Unit 5: DEUTZ MWM (TBD 616 V12)
   - Unit 6 & Unit 7: MITSUBISHI (S16R-PTA)
   - Unit 8 & Unit 9: CUMMINS (KTA-50-G8)

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
   CRITICAL NOTE: Daily logs in the database might have a delay (e.g. today is July 9, 2026, but the latest record might be July 6, 2026). If the user asks for relative dates like "kemarin" (yesterday) or "hari ini" (today), ALWAYS generate a query that sorts by target date match descending, then by waktu descending, and limits to 1 (e.g. ORDER BY (waktu = CURRENT_DATE - INTERVAL '1 day') DESC, waktu DESC LIMIT 1). DO NOT use UNION because the safety filter blocks the UNION keyword. This ensures it retrieves the target date's data if available, and automatically falls back to the latest available daily record if not, so the synthesis model can report the most recent data to the user.

8. Table 'materials_essential':
   Columns: id (int), name (varchar), part_number (varchar), unit (varchar), status (varchar), current_stock (numeric), notes (text), spesification (text)
   Note: Stores ESSENTIAL materials (e.g. Sensor Water Temperature Switch, Dioda Putar, Magnetic Pick Up, Speed Control, Varistor, Vbelt Alternator, Seal Crankshaft, Flexible Joint). If user asks for essential materials that need ordering, use SQL to find items with current_stock <= 1.

9. Table 'pm_realization_materials':
   Columns: id (int), realization_id (int), nama_material (varchar), jumlah_standar (numeric), jumlah_realisasi (numeric), satuan (varchar), cycle (varchar)
   Note: Stores actual usage/replacement of fast-moving materials during PM realizations. Join with pm_realizations on realization_id = pm_realizations.id.
   CRITICAL: The database stores material names in English. When querying, you MUST map Indonesian terms to these exact canonical English names:
   - "Air Filter" (for Indonesian "filter udara")
   - "Lube Oil Filter" (for Indonesian "filter oli" / "saringan oli")
   - "Lube Oil Filter Bypass" (for Indonesian "filter oli bypass" / "bypass")
   - "Fuel Filter" (for Indonesian "filter bbm" / "filter solar" / "filter hsd" / "saringan bahan bakar")
   - "Racor Filter" (for Indonesian "filter racor" / "racor filter" / "raccor")
   - "Water Filter" (for Indonesian "filter air" / "water filter" / "water coolant filter")
   - "Lube Oil" (for Indonesian "oli" / "pelumas mesin")
   For example, use: prm.nama_material ILIKE '%Air Filter%' when user asks about 'filter udara'.

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
- Route "sql": If user asks for downtime, realizations, historical usage (BBM/Oli, fast-moving material usage like 'Racor Filter' from pm_realization_materials, or essential material usage from material_essential_transactions), list of engines, ESSENTIAL materials, or SOP PLN (Standard Operating Procedure internal: prosedur, langkah kerja, APD, persiapan, penormalan teknisi PLN dari tabel 'sop_documents'). Generate a read-only SELECT statement. ALWAYS USE POSTGRESQL SYNTAX. Do NOT invent columns!
  CRITICAL 1: When querying material quantities/usage, ALWAYS also select/retrieve the unit of measurement column (e.g., 'satuan' in pm_realization_materials, or 'unit' in materials/materials_essential) in the SELECT clause (either directly or via MAX/MIN/first value, e.g. SELECT SUM(jumlah_realisasi) as total_qty, MAX(satuan) as satuan ...), so that the synthesis model knows the exact unit of measurement (e.g., 'Buah', 'Liter') instead of guessing.
  CRITICAL 2: When querying daily metrics, operational logs, or occurrences, ALWAYS select/retrieve the date/timestamp column (e.g. 'waktu' in pengusahaan_harian, 'tanggal_pelaksanaan' in pm_realizations, 'transaction_date' in material_transactions) in the SELECT clause, so that the synthesis model knows the exact date of the data and can report to the user if the data belongs to a fallback/latest available date instead of the requested date.
- Route "pm_schedule": If user specifically asks for UPCOMING PREVENTIVE MAINTENANCE SCHEDULES (Jadwal PM yang akan datang/besok). DO NOT USE SQL.
- Route "material_inventory": If user asks for FAST-MOVING material stocks, reorder status, material depletion, or which fast moving material needs to be ordered (e.g. Lube Oil, Air Filter, Lube Oil Filter, Fuel Filter / Filter BBM, Lube Oil Filter Bypass, Racor Filter, Water Filter). DO NOT USE SQL.
- Route "manual_book": If user asks about OEM Manual Books (Buku Manual Pabrikan), technical specifications, manufacturer tolerances, valve clearance (celah katup), tightening torque limits (torsi pengencangan baut), or OEM troubleshooting instructions for specific engines (e.g. Mitsubishi S16R, Cummins, Deutz, SWD).
  CRITICAL for 'manual_search_query':
  1. Map the engine unit if mentioned (e.g. Unit 6/Unit 7 -> "Mitsubishi S16R").
  2. Formulate a BILINGUAL technical search query combining English OEM terms and Indonesian keywords (e.g. "Mitsubishi S16R valve clearance celah katup cold standard limit adjustment").
- Route "general": If it is a greeting, basic explanation, chat, or doesn't need database knowledge. Provide conversational response in 'direct_reply'.

You MUST respond ONLY in valid JSON format matching this schema:
{
  "route": "sql" | "pm_schedule" | "material_inventory" | "manual_book" | "general",
  "sql": "SELECT ... (only if route is sql)",
  "manual_search_query": "text to search in vector db (only if route is manual_book)",
  "direct_reply": "reply text (only if route is general)"
}
`

  let routeResult: { route: string; sql?: string; sop_search_query?: string; manual_search_query?: string; direct_reply?: string }

  try {
    const response = await fetchWithRetry(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiHistory,
        systemInstruction: {
          parts: [{ text: plannerSystemInstruction }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini Planner API Error:', errorText)
      throw new Error(`Gemini planning call failed: ${response.statusText}`)
    }

    const data = await response.json() as any
    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
    routeResult = JSON.parse(rawJsonText || '{}')
  } catch (err) {
    console.error('Error during Stage 1 Planning:', err)
    // Fallback to general chat if planner fails
    routeResult = { route: 'general', direct_reply: 'Maaf, saya mengalami kendala teknis saat merencanakan pencarian informasi. Bisakah Anda mengulangi pertanyaannya?' }
  }

  let dbContext = ''
  let queryExecuted = ''

  // STAGE 2: DATA EXECUTION (RAG)
  if (routeResult.route === 'sql' && routeResult.sql) {
    const rawSql = routeResult.sql
    if (isSafeSql(rawSql)) {
      try {
        const rows = await query(rawSql)
        dbContext = JSON.stringify(rows, null, 2)
        queryExecuted = rawSql
      } catch (dbErr: any) {
        console.error('SQL Execution failed:', dbErr)
        dbContext = `Error executing database query: ${dbErr.message || 'Unknown error'}`
      }
    } else {
      console.warn('Unsafe SQL blocked:', rawSql)
      dbContext = 'Error: Generated query was rejected by safety rules (read-only queries only).'
    }
  } else if (routeResult.route === 'pm_schedule') {
    try {
      const scheduleData = await $fetch('/api/pm/schedule') as any[]
      
      // Filter schedules to upcoming (daysFromToday >= 0) and sort by closest
      const upcoming = scheduleData
         .filter(s => s.extendedProps && s.extendedProps.daysFromToday >= 0)
         .sort((a, b) => a.extendedProps.daysFromToday - b.extendedProps.daysFromToday)
         .slice(0, 15)
         
      dbContext = upcoming.length > 0 ? JSON.stringify(upcoming, null, 2) : 'Tidak ada jadwal pemeliharaan (PM) yang akan datang dalam waktu dekat berdasarkan proyeksi jam kerja.'
      queryExecuted = 'Internal API Projection: /api/pm/schedule'
    } catch (err: any) {
      console.error('PM Schedule API failed:', err)
      dbContext = `Error fetching PM schedule: ${err.message}`
    }
  } else if (routeResult.route === 'material_inventory') {
    try {
      // By default the endpoint returns sorted array (rop_status_desc) so criticals are at the top
      const inventoryRes = await $fetch('/api/materials/inventory') as any
      const inventoryData = inventoryRes.data || inventoryRes
      
      const mappedMaterials = (Array.isArray(inventoryData) ? inventoryData : []).slice(0, 20).map(m => ({
        nama: m.name,
        part_number: m.part_number,
        stok_saat_ini: m.current_stock,
        satuan: m.satuan,
        status_reorder: m.rop_status,
        safety_stock: m.ss,
        reorder_point: m.rop,
        saran_qty_pesan: m.roq
      }))
      
      dbContext = JSON.stringify(mappedMaterials, null, 2)
      queryExecuted = 'Internal API: /api/materials/inventory (Dynamic ROP/ROQ)'
    } catch (err: any) {
      console.error('Material Inventory API failed:', err)
      dbContext = `Error fetching material inventory: ${err.message}`
    }
  } else if (routeResult.route === 'manual_book' && routeResult.manual_search_query) {
    try {
      // Embedding using gemini-embedding-001 (matching Qdrant collection manual_book_engine vector space)
      const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`
      const embedRes = await fetchWithRetry(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text: routeResult.manual_search_query }] }
        })
      })

      if (!embedRes.ok) {
        const errorText = await embedRes.text()
        console.error('Gemini Embedding API Error:', errorText)
        throw new Error(`Embedding API failed: ${embedRes.statusText}`)
      }

      const embedData = await embedRes.json() as any
      const queryVector = embedData.embedding?.values

      if (!queryVector || queryVector.length === 0) {
        throw new Error('Gagal menghasilkan vector embedding dari Gemini.')
      }

      const qdrantClient = new QdrantClient({
        url: process.env.QDRANT_URL || 'http://100.101.143.95:6333',
        apiKey: process.env.QDRANT_API_KEY || 'sZjjtFrVfIXAMOtkkAukBpXSHjZZvo'
      })

      const searchResult = await qdrantClient.search('manual_book_engine', {
        vector: queryVector,
        limit: 5,
        with_payload: true,
        score_threshold: 0.65
      })

      if (!searchResult || searchResult.length === 0) {
        dbContext = 'Tidak ditemukan data manual book yang relevan dengan pertanyaan ini (skor kemiripan di bawah ambang batas relevansi).'
      } else {
        const mappedResults = searchResult.map(r => ({
          buku: r.payload?.document_title || 'Unknown',
          mesin: r.payload?.category || 'Unknown',
          judul_bagian: r.payload?.section_title || 'General',
          teks_manual: r.payload?.source_text || '',
          skor_kemiripan: `${Math.round((r.score || 0) * 100)}%`
        }))

        dbContext = JSON.stringify(mappedResults, null, 2)
      }
      queryExecuted = `Qdrant Vector Search: "${routeResult.manual_search_query}" (score_threshold: 0.65)`
    } catch (err: any) {
      console.error('Qdrant Search failed:', err)
      dbContext = `Error searching manual books: ${err.message}`
    }
  } else if (routeResult.route === 'general' && routeResult.direct_reply) {
    // If route is general, we already have the direct reply. We can skip Stage 3!
    return {
      text: routeResult.direct_reply,
      route: 'general'
    }
  }

  // STAGE 3: SYNTHESIS & RESPONSE GENERATION
  const synthesisInstruction = `
You are TahunaBot, a friendly and professional AI assistant for the PLTD Tahuna Preventive Maintenance Web Application.
Your goal is to answer the user's question accurately and strictly based on the provided database search results.

General Instructions:
1. Respond in Indonesian.
2. Jawablah langsung "to the point" (langsung ke intinya). JANGAN gunakan kalimat pembuka basa-basi seperti "Halo! Berdasarkan data...", "Berikut adalah...", atau kalimat pembuka/penutup lainnya yang tidak perlu. Langsung sajikan informasi secara padat, lugas, dan terstruktur.
3. Present lists, stocks, schedules, or SOP steps clearly using Markdown formatting (bullet points, bold text, or Markdown tables).
4. If the database context shows an empty array or states that data was not found, politely state that the data was not found. DO NOT make up information or invent facts.

Rules for Database PostgreSQL (db_tahuna) Context:
- Perhatikan kolom 'satuan' atau 'unit' dari database. Gunakan satuan asli dari database (misal: 'Buah', 'Liter', dll.) dalam tanggapan Anda. JANGAN menggunakan kata "unit" untuk menyebutkan jumlah material/barang (seperti "44 unit filter") agar tidak membingungkan dengan penomoran unit mesin (seperti "Unit 6").
- Jika menyajikan SOP dari database, format tahapan menjadi nomor urut yang rapi (persiapan, pelaksanaan mekanik/listrik, penormalan).
- Jika menyajikan metrik operasional atau log harian, sebutkan tanggal data yang ditampilkan jika berbeda dari tanggal yang diminta pengguna.

Rules for Manual Book (Qdrant Vector) Context:
- STRICT ANTI-HALLUCINATION: HANYA gunakan angka spesifikasi (torsi, celah katup, tekanan, temperatur, dll.) dan prosedur yang TERCANTUM EKSPLISIT pada kutipan teks manual. DILARANG KERAS mengarang, mengasumsikan, atau mengekstrapolasi angka teknis.
- KESESUAIAN MEREK/MESIN: Periksa apakah merek/tipe mesin yang ditanyakan pengguna sesuai dengan merek ('mesin' atau 'buku') pada konteks data manual book. Jika pengguna menanyakan mesin tertentu (misal Caterpillar, Cummins, Deutz) tetapi potongan manual yang tersedia berasal dari mesin lain (misal Mitsubishi S16R), tegaskan secara sopan bahwa manual untuk mesin yang ditanyakan belum tersedia di sistem.
- INFORMASI TIDAK LENGKAP: Jika prosedur ada namun angka toleransi spesifik tidak tercantum dalam potongan teks manual, nyatakan secara jujur bahwa angka spesifik tersebut tidak tertulis pada kutipan manual yang ditemukan.
- SITASI SUMBER: Cantumkan rujukan nama buku dan judul bagian/subbab (misal: *Referensi: [Nama Buku] - Bagian: [Judul Bagian]*) di bagian akhir jawaban teknis agar teknisi dapat memverifikasi langsung.
`

  // Construct context prompt for synthesis
  const sourceLabel = routeResult.route === 'manual_book' 
    ? 'Manual Book OEM (Qdrant Vector Database)' 
    : (routeResult.route === 'sql' ? 'PostgreSQL Database (db_tahuna)' : 'Internal Service API')

  const synthesisContent = [
    ...geminiHistory,
    {
      role: 'user',
      parts: [{
        text: `[SISTEM CONTEXT RAG]
Sumber Data: ${sourceLabel}
Query / Operasi: ${queryExecuted || 'None'}
Data yang Ditemukan:
${dbContext || 'Tidak ditemukan kecocokan data.'}
-------------------
Berdasarkan data resmi di atas, berikan jawaban akhir yang terstruktur, akurat, bebas halusinasi, dan mudah dipahami untuk pertanyaan pengguna.`
      }]
    }
  ]

  try {
    const response = await fetchWithRetry(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: synthesisContent,
        systemInstruction: {
          parts: [{ text: synthesisInstruction }]
        },
        generationConfig: {
          temperature: 0.0
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini Synthesis API Error:', errorText)
      throw new Error(`Gemini synthesis call failed: ${response.statusText}`)
    }

    const data = await response.json() as any
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak dapat merumuskan respon saat ini.'
    
    return {
      text: replyText,
      route: routeResult.route,
      query: queryExecuted
    }
  } catch (err: any) {
    console.error('Error during Stage 3 Synthesis:', err)
    return {
      text: 'Maaf, terjadi kesalahan saat merumuskan respon berdasarkan data database. Silakan coba lagi beberapa saat lagi.',
      route: routeResult.route,
      error: err.message
    }
  }
})
