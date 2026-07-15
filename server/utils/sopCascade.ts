import { query } from './db'

const PM_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5']

const FORMULIR_MAPPING = [
  {
    regex: /tahanan\s+isolasi\s+generator/i,
    title: 'Formulir Pengukuran Tahanan Isolasi Generator',
    path: 'https://aurastorage.serveer.biz.id/api/files/ee402a39-d942-4abd-b36f-3d8b5d908ad8.pdf'
  },
  {
    regex: /mengukur\s+tegangan\s+baterai/i,
    title: 'Formulir Pengukuran Baterai',
    path: 'https://aurastorage.serveer.biz.id/api/files/fdb510d9-74e2-4c81-84bb-07027244e0ea.pdf'
  },
  {
    regex: /tahanan\s+isolasi\s+motor\s+fan\s+radiator/i,
    title: 'Formulir Pengukuran Tahanan Isolasi Motor Listrik Auxiliary',
    path: 'https://aurastorage.serveer.biz.id/api/files/9113c2d2-5e33-419a-8cd3-45eb1b1e7a7c.pdf'
  },
  {
    regex: /tahanan\s+isolasi\s+trafo/i,
    title: 'Formulir Pengukuran Tahanan Isolasi Trafo',
    path: 'https://aurastorage.serveer.biz.id/api/files/aaf65eb3-0ef8-49de-8187-00578cbcaa6b.pdf'
  },
  {
    regex: /clearance\s+valve/i,
    title: 'Formulir Pengukuran Clearance Valve',
    path: 'https://aurastorage.serveer.biz.id/api/files/b6d9598e-bb23-408e-92bf-e46ea42e3d68.pdf'
  }
]

export function getLampiranFormulir(rows: any[]): any[] {
  const matchedPaths = new Set<string>()
  const result: any[] = []

  for (const doc of rows) {
    const dbFormulir = parseJsonField(doc.lampiran_formulir)
    if (dbFormulir.length > 0) {
      for (const form of dbFormulir) {
        if (form && form.path && !matchedPaths.has(form.path)) {
          matchedPaths.add(form.path)
          result.push({
            title: form.title || '',
            path: form.path
          })
        }
      }
    } else {
      const mekanik = parseJsonField(doc.pelaksanaan_mekanik)
      const listrik = parseJsonField(doc.pelaksanaan_listrik)
      const allSteps = [...mekanik, ...listrik]

      for (const step of allSteps) {
        if (typeof step !== 'string') continue
        for (const form of FORMULIR_MAPPING) {
          if (form.regex.test(step)) {
            if (!matchedPaths.has(form.path)) {
              matchedPaths.add(form.path)
              result.push({
                title: form.title,
                path: form.path
              })
            }
          }
        }
      }
    }
  }
  return result
}

export function parseJsonField(val: any): any[] {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }
  return Array.isArray(val) ? val : []
}

function mergeStringArrays(arrays: string[][]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const arr of arrays) {
    if (!arr) continue
    for (const item of arr) {
      if (typeof item !== 'string') continue
      const cleaned = item.trim()
      if (!cleaned) continue
      const lower = cleaned.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        result.push(cleaned)
      }
    }
  }
  return result
}

function mergeMaterials(arrays: string[][]): string[] {
  const materialMap = new Map<string, string>()
  for (const arr of arrays) {
    if (!arr) continue
    for (const item of arr) {
      if (typeof item !== 'string') continue
      const cleaned = item.trim()
      if (!cleaned) continue
      const base = cleaned.split(' (')[0].trim().toLowerCase()
      materialMap.set(base, cleaned)
    }
  }
  return Array.from(materialMap.values())
}

export async function getCascadedSop(mesin: string, jenis_pm: string) {
  const relatedRows = await query(
    'SELECT id, jenis_pm FROM sop_documents WHERE LOWER(mesin) = LOWER($1)',
    [mesin]
  )
  const related_pms: Record<string, number> = {}
  for (const r of relatedRows) {
    related_pms[r.jenis_pm] = r.id
  }

  const index = PM_ORDER.indexOf(jenis_pm)
  if (index === -1) {
    // fallback if not a standard PM type
    const rows = await query(
      'SELECT * FROM sop_documents WHERE LOWER(mesin) = LOWER($1) AND jenis_pm = $2 LIMIT 1',
      [mesin, jenis_pm]
    )
    if (rows.length === 0) return null
    const doc = rows[0]
    return {
      ...doc,
      tools: parseJsonField(doc.tools),
      apd: parseJsonField(doc.apd),
      material: parseJsonField(doc.material),
      risiko: parseJsonField(doc.risiko),
      persiapan: parseJsonField(doc.persiapan),
      pelaksanaan_mekanik: parseJsonField(doc.pelaksanaan_mekanik),
      pelaksanaan_listrik: parseJsonField(doc.pelaksanaan_listrik),
      penormalan: parseJsonField(doc.penormalan),
      related_pms,
      lampiran_formulir: getLampiranFormulir([doc]),
    }
  }

  const targetPms = PM_ORDER.slice(0, index + 1)
  const rows = await query(
    'SELECT * FROM sop_documents WHERE LOWER(mesin) = LOWER($1) AND jenis_pm = ANY($2)',
    [mesin, targetPms]
  )

  if (rows.length === 0) return null

  // Sort rows based on PM_ORDER (P1 first, up to target PM)
  rows.sort((a, b) => PM_ORDER.indexOf(a.jenis_pm) - PM_ORDER.indexOf(b.jenis_pm))

  // Find the exact requested row to use as our base structure
  const targetRow = rows.find(r => r.jenis_pm === jenis_pm) || rows[rows.length - 1]

  const allTools: string[][] = []
  const allApd: string[][] = []
  const allMaterials: string[][] = []
  const allRisiko: string[][] = []
  const allPersiapan: string[][] = []
  const allPenormalan: string[][] = []

  let maxMekanik = 0
  let maxListrik = 0
  let maxHse = 0

  for (const doc of rows) {
    allTools.push(parseJsonField(doc.tools))
    allApd.push(parseJsonField(doc.apd))
    allMaterials.push(parseJsonField(doc.material))
    allRisiko.push(parseJsonField(doc.risiko))
    allPersiapan.push(parseJsonField(doc.persiapan))
    allPenormalan.push(parseJsonField(doc.penormalan))

    maxMekanik = Math.max(maxMekanik, Number(doc.personil_mekanik || 0))
    maxListrik = Math.max(maxListrik, Number(doc.personil_listrik || 0))
    maxHse = Math.max(maxHse, Number(doc.personil_hse || 0))
  }

  // Merge the cascaded fields
  const cascadedTools = mergeStringArrays(allTools)
  const cascadedApd = mergeStringArrays(allApd)
  const cascadedMaterials = mergeMaterials(allMaterials)
  const cascadedRisiko = mergeStringArrays(allRisiko)
  const cascadedPersiapan = mergeStringArrays(allPersiapan)
  const cascadedPenormalan = mergeStringArrays(allPenormalan)

  const finalMekanikCount = maxMekanik || Number(targetRow.personil_mekanik || 0)
  const finalListrikCount = maxListrik || Number(targetRow.personil_listrik || 0)
  const finalHseCount = maxHse || Number(targetRow.personil_hse || 0)
  const finalJumlahPersonil = finalMekanikCount + finalListrikCount + finalHseCount

  return {
    ...targetRow,
    // Target PM specific fields (DO NOT CASCADE)
    pelaksanaan_mekanik: parseJsonField(targetRow.pelaksanaan_mekanik),
    pelaksanaan_listrik: parseJsonField(targetRow.pelaksanaan_listrik),
    persiapan: parseJsonField(targetRow.persiapan),
    penormalan: parseJsonField(targetRow.penormalan),
    
    // Cascaded/inherited fields
    tools: cascadedTools,
    apd: cascadedApd,
    material: cascadedMaterials,
    risiko: cascadedRisiko,
    
    // Cascaded personnel counts
    personil_mekanik: finalMekanikCount,
    personil_listrik: finalListrikCount,
    personil_hse: finalHseCount,
    jumlah_personil: finalJumlahPersonil,
    
    related_pms,
    lampiran_formulir: getLampiranFormulir(rows),
  }
}
