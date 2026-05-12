/**
 * WhatsApp Maintenance Report Parser
 * 
 * Parses informal WhatsApp-style PM reports into structured data.
 * Supports multiple reporting formats (Unit 1-7 style and Unit 8-9 style).
 * 
 * Key logic:
 * - Only materials that are explicitly REPLACED (ganti/pakai) are counted
 * - Materials that are only cleaned (bersih), checked (periksa), or inspected are ignored
 * - Matches informal field names to actual database material names
 */

// Alias map: maps informal report terms → canonical DB material names
// Each entry: keyword patterns → { dbName, matchPartNumbers[] }
const materialAliases: Array<{
  patterns: RegExp[]
  dbName: string
  partNumberHints: string[]  // for extra disambiguation if needed
}> = [
  {
    // "Filter Oli", "F.Oli", "filter oli", "oil filter", "lube oil filter"
    patterns: [
      /f(?:ilter)?[\.\s]*oli(?!\s*by)/i,
      /(?:lube\s*)?oil\s*filter(?!\s*by)/i,
    ],
    dbName: 'Lube Oil Filter',
    partNumberHints: ['LF3325', '0118-2001', '37540-11100'],
  },
  {
    // "Filter Oli Bypass", "F.Oli Bypass", "by pass", "bypass"
    patterns: [
      /f(?:ilter)?[\.\s]*oli\s*by\s*?pass/i,
      /(?:lube\s*)?oil\s*filter\s*by\s*?pass/i,
      /filter\s*by\s*?pass/i,
    ],
    dbName: 'Lube Oil Filter Bypass',
    partNumberHints: ['LF777', '37540-02100'],
  },
  {
    // "Filter Hsd", "Filter HSD", "F.HSD", "Fuel Filter", "filter solar"
    patterns: [
      /f(?:ilter)?[\.\s]*hsd/i,
      /fuel\s*filter/i,
      /filter\s*solar/i,
      /f(?:ilter)?[\.\s]*bahan\s*bakar/i,
    ],
    dbName: 'Fuel Filter',
    partNumberHints: ['FS1006', '0117-4423', '32562-60300'],
  },
  {
    // "Filter udara", "air filter" — ONLY when replaced (ganti), NOT "bersih filter udara"
    patterns: [
      /f(?:ilter)?[\.\s]*udara/i,
      /air\s*filter/i,
    ],
    dbName: 'Air Filter',
    partNumberHints: ['AF25278', '0118-0870', '47220-38802'],
  },
  {
    // "Filter Racor", "Racor", "Racor Filter"
    patterns: [
      /(?:filter\s*)?racc?or/i,
      /racc?or\s*filter/i,
    ],
    dbName: 'Racor Filter',
    partNumberHints: ['2020TM'],
  },
  {
    // "Water Filter", "Water Coolant", "WF", "water coolant filter"
    patterns: [
      /water\s*(?:coolant\s*filter|filter|coolant)/i,
      /wf\s*\d/i,
    ],
    dbName: 'Water Filter',
    partNumberHints: ['WF2076'],
  },
  {
    // "Ganti Oli" (standalone, not "filter oli") — means Lube Oil change
    // "OLI CHARTER", "Oli mesin", "Oli *liter"
    patterns: [
      /^ganti\s*oli\b/i,
      /oli\s*(?:charter|mesin)/i,
      /\boli\b.*\d+\s*(?:liter|ltr|lt)\b/i,
      /lube\s*oil\b(?!\s*filter)/i,
    ],
    dbName: 'Lube Oil',
    partNumberHints: ['Meditran', 'Mediterania'],
  },
]

// Words that indicate actual replacement/usage (material consumed)
const REPLACE_VERBS = [
  /\bganti\b/i,
  /\btambah\b/i,
  /\bpakai\b/i,
  /\bpemakaian\b/i,
  /\bgnt\b/i,
  /\bisi\b/i,
]

// Words that indicate NON-consumption (just maintenance action)
const SKIP_VERBS = [
  /\bbersih(?:kan)?\b/i,
  /\bcuci\b/i,
  /\bperiksa\b/i,
  /\bcek\b/i,
  /\bcheck\b/i,
  /\bkencang(?:kan)?\b/i,
  /\bsetel\b/i,
  /\bpriming\b/i,
]

/**
 * Determine if a line describes a material being replaced vs just maintained.
 * Returns true if the material is being CONSUMED (used/replaced).
 */
function isReplacementAction(line: string): boolean {
  const normalized = line.trim().toLowerCase()
  
  // If it starts with a skip verb explicitly, it's NOT a replacement
  for (const skip of SKIP_VERBS) {
    if (skip.test(normalized.split(/\s+/).slice(0, 2).join(' '))) {
      return false
    }
  }
  
  // If line contains a replace verb, it's a replacement
  for (const verb of REPLACE_VERBS) {
    if (verb.test(normalized)) return true
  }
  
  // If the line has a quantity pattern (e.g., "2 bh", "4 buah", "169 liter"),
  // and it mentions a known material, assume it's a consumption
  // This handles shorthand like "Filter Hsd 1 bh" (no verb, implies ganti)
  if (/\d+\s*(?:bh|buah|bua|pcs|liter|ltr|lt|kg|btl|bks|bungkus|psg)\b/i.test(normalized)) {
    return true
  }
  
  return false
}

export interface ParsedMaterial {
  dbName: string
  quantity: number
  unit: string  // "buah", "liter", etc.
  rawLine: string
}

export interface ParsedReport {
  tanggal: string  // ISO date string YYYY-MM-DD
  unit: number
  jenisPm: string  // P1-P5
  materials: ParsedMaterial[]
  catatan: string
  rawText: string
  warnings: string[]
}

/**
 * Extract date from various informal formats:
 * - "Rabu, 08 April 2026"
 * - "Selasa,07 April 2026"
 * - "SABTU , 04 APRIL 2026"
 * - "08/04/2026", "08-04-2026"
 */
function extractDate(text: string): string | null {
  const months: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04',
    mei: '05', juni: '06', juli: '07', agustus: '08',
    september: '09', oktober: '10', november: '11', desember: '12',
    january: '01', february: '02', march: '03', may: '05',
    june: '06', july: '07', august: '08', october: '10', december: '12',
  }

  // Pattern: "08 April 2026" or "08-April-2026" (with optional day name prefix)
  const longDateRe = /(\d{1,2})\s*[-/]?\s*(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|october|december)\s*[-/]?\s*(\d{4})/i
  const m = text.match(longDateRe)
  if (m) {
    const day = m[1].padStart(2, '0')
    const month = months[m[2].toLowerCase()]
    const year = m[3]
    if (month) return `${year}-${month}-${day}`
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const shortDateRe = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
  const m2 = text.match(shortDateRe)
  if (m2) {
    const day = m2[1].padStart(2, '0')
    const month = m2[2].padStart(2, '0')
    const year = m2[3]
    return `${year}-${month}-${day}`
  }

  return null
}

/**
 * Extract unit number from text.
 * Matches: "unit 5", "unit#8", "Cummins #8", "#8 P4"
 */
function extractUnit(text: string): number | null {
  // Direct "unit X" pattern
  const unitRe = /unit\s*[#]?\s*(\d+)/i
  const m = unitRe.exec(text)
  if (m) return parseInt(m[1])

  // "#X P{n}" or "Cummins #X" pattern (Unit 8,9 style)
  const hashRe = /#\s*(\d+)/
  const m2 = hashRe.exec(text)
  if (m2) return parseInt(m2[1])

  return null
}

/**
 * Extract PM type (P1-P5) from text.
 */
function extractPM(text: string): string | null {
  const pmRe = /\b(P[1-5])\b/i
  const m = pmRe.exec(text)
  if (m) return m[1].toUpperCase()
  return null
}

/**
 * Extract quantity and unit from a material line.
 * Examples: "1 bh", "4 buah", "2 bua", "169 liter", "1 kg"
 */
function extractQuantity(line: string): { qty: number, unit: string } | null {
  // Handle part number prefix like "( LF 3325) : 5 Buah"
  const cleaned = line.replace(/\([^)]*\)/g, '').replace(/:/g, ' ')
  
  const patterns = [
    // "5 Buah", "1 bh", "2 bua", "4 pcs"
    /(\d+(?:[.,]\d+)?)\s*(buah|bh|bua|pcs|btl|bks|bungkus|psg|kg|liter|ltr|lt)\b/i,
  ]
  
  for (const pat of patterns) {
    const m = pat.exec(cleaned)
    if (m) {
      const qty = parseFloat(m[1].replace(',', '.'))
      let unit = m[2].toLowerCase()
      // Normalize units
      if (['bh', 'bua', 'pcs'].includes(unit)) unit = 'buah'
      if (['ltr', 'lt'].includes(unit)) unit = 'liter'
      if (['bks', 'bungkus'].includes(unit)) unit = 'buah'
      if (unit === 'btl') unit = 'buah'
      if (unit === 'psg') unit = 'buah'
      return { qty, unit }
    }
  }

  return null
}

/**
 * Try to match a line to a known fast-moving material via alias patterns.
 */
function matchMaterial(line: string): string | null {
  const normalized = line.toLowerCase()
  
  // Check bypass FIRST (more specific) before generic oil filter
  for (const alias of materialAliases) {
    if (alias.dbName === 'Lube Oil Filter Bypass') {
      for (const pat of alias.patterns) {
        if (pat.test(normalized)) return alias.dbName
      }
    }
  }
  
  // Then check all others
  for (const alias of materialAliases) {
    if (alias.dbName === 'Lube Oil Filter Bypass') continue  // already checked
    for (const pat of alias.patterns) {
      if (pat.test(normalized)) return alias.dbName
    }
  }
  
  // Check for part number mentions directly
  const partNumberPatterns = [
    { pattern: /\bLF\s*3325\b/i, dbName: 'Lube Oil Filter' },
    { pattern: /\bLF\s*777\b/i, dbName: 'Lube Oil Filter Bypass' },
    { pattern: /\bWF\s*2076\b/i, dbName: 'Water Filter' },
    { pattern: /\bFS\s*1006\b/i, dbName: 'Fuel Filter' },
    { pattern: /\bAF\s*25278\b/i, dbName: 'Air Filter' },
    { pattern: /\b2020\s*TM\b/i, dbName: 'Racor Filter' },
    { pattern: /\bmeditran/i, dbName: 'Lube Oil' },
    { pattern: /\bmediterania/i, dbName: 'Lube Oil' },
  ]
  
  for (const pp of partNumberPatterns) {
    if (pp.pattern.test(normalized)) return pp.dbName
  }
  
  return null
}

/**
 * Main parser: takes raw WhatsApp text and returns structured data.
 */
export function parseWhatsAppReport(rawText: string): ParsedReport {
  // Normalize double-escaped newlines (e.g., from webhooks) or HTML line breaks
  const normalizedText = rawText
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')

  const warnings: string[] = []
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  // 1. Extract high-level metadata from full text
  const tanggal = extractDate(normalizedText)
  const unit = extractUnit(normalizedText)
  const jenisPm = extractPM(normalizedText)
  
  if (!tanggal) warnings.push('Tanggal tidak terdeteksi')
  if (!unit) warnings.push('Unit tidak terdeteksi')
  if (!jenisPm) warnings.push('Jenis PM tidak terdeteksi')
  
  // 2. Parse material lines
  const parsedMaterials: ParsedMaterial[] = []
  const seenMaterials = new Set<string>()
  
  // Special handling for "Ganti Oli" as standalone line (no quantity on same line)
  // If we find "Ganti Oli" standalone, we note it but don't assign quantity yet
  // The actual quantity might be in a different format or line
  let gantiOliDetected = false
  
  for (const line of lines) {
    // Skip metadata lines
    if (/^\s*[-•]\s*$/.test(line)) continue
    if (/^(semangat|info\s*har\b|rh\.|personil|durasi|pekerjaan|material\s*consumable|closing|clossing|accu|aki)/i.test(line.replace(/[-,\s]/g, ''))) continue
    
    // Check if this line is a skip action (bersih, periksa, etc.)
    if (!isReplacementAction(line)) continue
    
    // Try to match to a known material
    const matched = matchMaterial(line)
    if (!matched) continue
    
    // Avoid duplicates
    if (seenMaterials.has(matched)) continue
    
    // Extract quantity
    const qtyInfo = extractQuantity(line)
    
    if (matched === 'Lube Oil' && !qtyInfo) {
      gantiOliDetected = true
      continue  // We'll handle oli separately — quantity may be embedded differently
    }
    
    if (qtyInfo) {
      seenMaterials.add(matched)
      parsedMaterials.push({
        dbName: matched,
        quantity: qtyInfo.qty,
        unit: qtyInfo.unit,
        rawLine: line,
      })
    }
  }
  
  // Handle "Ganti Oli" that may have separate quantity line
  if (gantiOliDetected && !seenMaterials.has('Lube Oil')) {
    // Look for oil quantity in unique patterns like "OLI CHARTER (Mediterania SX) : 169 liter"
    const oilQtyRe = /(\d+(?:[.,]\d+)?)\s*(liter|ltr|lt)\b/i
    for (const line of lines) {
      if (/oli/i.test(line) || /meditran/i.test(line) || /mediterania/i.test(line)) {
        const m = oilQtyRe.exec(line)
        if (m) {
          seenMaterials.add('Lube Oil')
          parsedMaterials.push({
            dbName: 'Lube Oil',
            quantity: parseFloat(m[1].replace(',', '.')),
            unit: 'liter',
            rawLine: line,
          })
          break
        }
      }
    }
    
    // If still not found, add with quantity 0 and warn
    if (!seenMaterials.has('Lube Oil')) {
      warnings.push('Ganti Oli terdeteksi tapi jumlah tidak ditemukan')
      seenMaterials.add('Lube Oil')
      parsedMaterials.push({
        dbName: 'Lube Oil',
        quantity: 0,
        unit: 'liter',
        rawLine: 'Ganti Oli (jumlah tidak terdeteksi)',
      })
    }
  }
  
  // Also scan for standalone oli lines in unit 8/9 format
  if (!seenMaterials.has('Lube Oil')) {
    for (const line of lines) {
      if (/oli\s*(?:charter|mesin)/i.test(line) || (/\boli\b/i.test(line) && /\d+\s*(?:liter|ltr|lt)\b/i.test(line))) {
        if (!isReplacementAction(line) && !/ganti/i.test(line)) continue
        const qtyInfo = extractQuantity(line)
        if (qtyInfo) {
          seenMaterials.add('Lube Oil')
          parsedMaterials.push({
            dbName: 'Lube Oil',
            quantity: qtyInfo.qty,
            unit: qtyInfo.unit,
            rawLine: line,
          })
          break
        }
      }
    }
  }

  // Special: Unit 8/9 format — scan for lines with part numbers embedded
  // e.g., "- F.Oli ( LF 3325) : 5 Buah"
  if (!seenMaterials.has('Lube Oil Filter') || !seenMaterials.has('Lube Oil Filter Bypass') || !seenMaterials.has('Water Filter')) {
    for (const line of lines) {
      const matched = matchMaterial(line)
      if (!matched || seenMaterials.has(matched)) continue
      const qtyInfo = extractQuantity(line)
      if (qtyInfo) {
        seenMaterials.add(matched)
        parsedMaterials.push({
          dbName: matched,
          quantity: qtyInfo.qty,
          unit: qtyInfo.unit,
          rawLine: line,
        })
      }
    }
  }
  
  return {
    tanggal: tanggal || '',
    unit: unit || 0,
    jenisPm: jenisPm || '',
    materials: parsedMaterials,
    catatan: normalizedText.substring(0, 500),
    rawText: normalizedText,
    warnings,
  }
}
