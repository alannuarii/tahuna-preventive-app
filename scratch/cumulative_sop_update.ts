
import { query } from '../server/utils/db'

const PM_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5']

async function cumulativeUpdate() {
  try {
    const docs: any = await query(`SELECT * FROM sop_documents`)
    
    // Group by engine
    const engineGroups: Record<string, any[]> = {}
    docs.forEach((doc: any) => {
      if (!engineGroups[doc.mesin]) engineGroups[doc.mesin] = []
      engineGroups[doc.mesin].push(doc)
    })

    for (const mesin in engineGroups) {
      console.log(`Processing engine: ${mesin}`)
      const machineDocs = engineGroups[mesin].sort((a, b) => PM_ORDER.indexOf(a.jenis_pm) - PM_ORDER.indexOf(b.jenis_pm))
      
      let inheritedMaterials: string[] = []
      let inheritedMekanik: string[] = []
      let inheritedListrik: string[] = []

      for (const doc of machineDocs) {
        const pmLevel = doc.jenis_pm
        
        // Merge materials: current doc materials take precedence over inherited ones
        const materialMap = new Map<string, string>()
        inheritedMaterials.forEach(m => {
          const base = m.split(' (')[0].toLowerCase()
          materialMap.set(base, m)
        })
        doc.material.forEach((m: string) => {
          const base = m.split(' (')[0].toLowerCase()
          materialMap.set(base, m)
        })
        let currentMaterials = Array.from(materialMap.values())

        let currentMekanik = [...new Set([...inheritedMekanik, ...doc.pelaksanaan_mekanik])]
        let currentListrik = [...new Set([...inheritedListrik, ...doc.pelaksanaan_listrik])]

        // Apply Global Volume Rules
        currentMaterials = currentMaterials.map(m => {
          const lower = m.toLowerCase()
          if (lower.includes('kain lap majun')) {
            return PM_ORDER.indexOf(pmLevel) <= 2 ? 'Kain lap majun (1 kg)' : 'Kain lap majun (1.5 kg)'
          }
          if (lower.includes('detergen')) {
            return PM_ORDER.indexOf(pmLevel) <= 1 ? 'Detergen (6 sachet @40 gram)' : 'Detergen (12 sachet @40 gram)'
          }
          if (lower.includes('grease')) {
            return 'Grease (1 kaleng @100 gram)'
          }
          if (lower.includes('contact cleaner')) {
            return 'Cairan pembersih kontak (1 kaleng @550 ml)'
          }
          if (lower.includes('vernis isolasi')) {
            return 'Vernis isolasi (2 kaleng @400 ml)'
          }
          if (lower.includes('thinner')) {
            return 'Thinner (1 kaleng @4 liter)'
          }
          return m
        })

        // Special case: If Varnish task is present, ensure Thinner and Varnish are in materials
        const hasVarnishTask = currentListrik.some(p => p.toLowerCase().includes('pelapisan ulang vernis isolasi'))
        if (hasVarnishTask) {
          if (!currentMaterials.some(m => m.toLowerCase().includes('vernis isolasi'))) {
            currentMaterials.push('Vernis isolasi (2 kaleng @400 ml)')
          }
          if (!currentMaterials.some(m => m.toLowerCase().includes('thinner'))) {
            currentMaterials.push('Thinner (1 kaleng @4 liter)')
          }
        }

        const finalMaterials = currentMaterials;

        // Update Database
        await query(`
          UPDATE sop_documents 
          SET material = $1, pelaksanaan_mekanik = $2, pelaksanaan_listrik = $3 
          WHERE id = $4
        `, [JSON.stringify(finalMaterials), JSON.stringify(currentMekanik), JSON.stringify(currentListrik), doc.id])

        console.log(`  Updated ${pmLevel}`)

        // Propagate to next level
        inheritedMaterials = finalMaterials
        inheritedMekanik = currentMekanik
        inheritedListrik = currentListrik
      }
    }
    console.log('Cumulative update complete.')
  } catch (err) {
    console.error(err)
  }
}

cumulativeUpdate()
