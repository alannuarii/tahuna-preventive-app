import { query } from '../server/utils/db'

const PM_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5']

function parseJsonField(val: any): string[] {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }
  return Array.isArray(val) ? val : []
}

async function deCascadeSop() {
  try {
    const docs: any = await query('SELECT * FROM sop_documents')
    
    // Group by engine (mesin)
    const engineGroups: Record<string, any[]> = {}
    docs.forEach((doc: any) => {
      const key = doc.mesin.trim()
      if (!engineGroups[key]) engineGroups[key] = []
      engineGroups[key].push(doc)
    })

    for (const mesin in engineGroups) {
      console.log(`Processing engine: ${mesin}`)
      const machineDocs = engineGroups[mesin].sort(
        (a, b) => PM_ORDER.indexOf(a.jenis_pm) - PM_ORDER.indexOf(b.jenis_pm)
      )

      // Let's create a map of current/polluted lists for lookups
      const currentMekanikMap = new Map<string, string[]>()
      const currentListrikMap = new Map<string, string[]>()
      
      for (const doc of machineDocs) {
        currentMekanikMap.set(doc.jenis_pm, parseJsonField(doc.pelaksanaan_mekanik))
        currentListrikMap.set(doc.jenis_pm, parseJsonField(doc.pelaksanaan_listrik))
      }

      // Now, update P2, P3, P4, P5 by subtracting the lower level's tasks from the current level's tasks
      for (const doc of machineDocs) {
        const pmLevel = doc.jenis_pm
        const index = PM_ORDER.indexOf(pmLevel)
        if (index <= 0) continue // Skip P1 since it's already correct

        const lowerPmLevel = PM_ORDER[index - 1]
        const lowerMekanik = currentMekanikMap.get(lowerPmLevel) || []
        const lowerListrik = currentListrikMap.get(lowerPmLevel) || []

        const currentMekanik = parseJsonField(doc.pelaksanaan_mekanik)
        const currentListrik = parseJsonField(doc.pelaksanaan_listrik)

        // Set difference: remove items that exist in lower level
        const lowerMekanikSet = new Set(lowerMekanik.map(s => s.trim().toLowerCase()))
        const lowerListrikSet = new Set(lowerListrik.map(s => s.trim().toLowerCase()))

        const originalMekanik = currentMekanik.filter(
          item => !lowerMekanikSet.has(item.trim().toLowerCase())
        )
        const originalListrik = currentListrik.filter(
          item => !lowerListrikSet.has(item.trim().toLowerCase())
        )

        console.log(`  PM Level ${pmLevel}:`)
        console.log(`    Mekanik: ${currentMekanik.length} -> ${originalMekanik.length}`)
        console.log(`    Listrik: ${currentListrik.length} -> ${originalListrik.length}`)

        // Update database for this document
        await query(
          'UPDATE sop_documents SET pelaksanaan_mekanik = $1, pelaksanaan_listrik = $2 WHERE id = $3',
          [JSON.stringify(originalMekanik), JSON.stringify(originalListrik), doc.id]
        )
      }
    }
    console.log('De-cascade database cleanup complete!')
  } catch (error) {
    console.error('Error during de-cascade:', error)
  }
}

deCascadeSop()
