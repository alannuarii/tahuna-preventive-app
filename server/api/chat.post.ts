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
   Columns: id (int), waktu (date), unit (varchar), pemakaian_bbm (numeric), pemakaian_oli (numeric), kwh_produksi_nett (numeric), jam_kerja (numeric)

8. Table 'materials_essential':
   Columns: id (int), name (varchar), part_number (varchar), unit (varchar), status (varchar), current_stock (numeric), notes (text), spesification (text)
   Note: Stores ESSENTIAL materials (e.g. Sensor Water Temperature Switch, Dioda Putar, Magnetic Pick Up, Speed Control, Varistor, Vbelt Alternator, Seal Crankshaft, Flexible Joint). If user asks for essential materials that need ordering, use SQL to find items with current_stock <= 1.

Rules for Router:
- Route "sql": If user asks for downtime, realizations, historical usage (BBM/Oli), list of engines, ESSENTIAL materials (e.g. Sensor Water Temperature, Dioda Putar, Magnetic Pick Up, Speed Control, Varistor, Vbelt, Seal, Flexible Joint), SOP (prosedur, langkah kerja, APD, persiapan), or other data. Generate a read-only SELECT statement. ALWAYS USE POSTGRESQL SYNTAX. Do NOT invent columns!
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
`

  let routeResult: { route: string; sql?: string; sop_search_query?: string; manual_search_query?: string; direct_reply?: string }

  try {
    const response = await fetch(apiEndpoint, {
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
      const genAI = new GoogleGenerativeAI(apiKey)
      const embedModel = genAI.getGenerativeModel({ model: 'models/gemini-embedding-2' })
      const embedRes = await embedModel.embedContent(routeResult.manual_search_query)
      const queryVector = embedRes.embedding.values
      
      if (!queryVector || queryVector.length === 0) {
        throw new Error('Gagal menghasilkan vector embedding dari Gemini.')
      }

      const qdrantClient = new QdrantClient({
        url: process.env.QDRANT_URL || 'http://100.101.143.95:6333',
        apiKey: process.env.QDRANT_API_KEY || 'sZjjtFrVfIXAMOtkkAukBpXSHjZZvo'
      })

      const searchResult = await qdrantClient.search('manual_book_engine', {
        vector: queryVector,
        limit: 3,
        with_payload: true
      })

      const mappedResults = searchResult.map(r => ({
        buku: r.payload?.document_title || 'Unknown',
        mesin: r.payload?.category || 'Unknown',
        teks_manual: r.payload?.source_text || '',
        skor_kemiripan_vektor: r.score
      }))

      dbContext = JSON.stringify(mappedResults, null, 2)
      queryExecuted = `Qdrant Vector Search: "${routeResult.manual_search_query}"`
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
Your goal is to answer the user's question accurately based on the provided database search results.

Instructions:
1. Respond in Indonesian.
2. Present lists, stocks, schedules, or SOP steps clearly using Markdown formatting (like bullet points, bold text, or Markdown tables).
3. If the database context shows an empty array or no results, politely state that the data was not found in the database. DO NOT make up information or invent facts.
4. Keep your tone professional, neat, and engineering-focused (fokus pada keteknikan dan pemeliharaan mesin).
5. If query results contain raw JSON arrays for SOPs, format them nicely into step-by-step procedures.
6. Jawablah langsung "to the point" (langsung ke intinya). JANGAN gunakan kalimat pembuka basa-basi seperti "Halo! Berdasarkan data dari database kami...", "Berikut adalah rincian...", atau pembuka/penutup lainnya yang tidak perlu. Langsung sajikan informasi atau jawab pertanyaan secara padat, lugas, dan terstruktur.
`

  // Construct context prompt for synthesis
  const synthesisContent = [
    ...geminiHistory,
    {
      role: 'user',
      parts: [{
        text: `[SISTEM CONTEXT RAG]
Berikut adalah hasil pencarian dari database kami untuk menjawab pertanyaan Anda:
Query yang Dijalankan: ${queryExecuted || 'None'}
Hasil Database:
${dbContext || 'Tidak ditemukan kecocokan data.'}
-------------------
Berdasarkan data di atas, berikan jawaban akhir yang terstruktur dan mudah dipahami untuk pertanyaan pengguna.`
      }]
    }
  ]

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: synthesisContent,
        systemInstruction: {
          parts: [{ text: synthesisInstruction }]
        },
        generationConfig: {
          temperature: 0.2
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
