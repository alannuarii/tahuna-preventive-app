
import { query } from '../server/utils/db'

async function updateSopMaterials() {
  try {
    const documents: any = await query(`SELECT id, jenis_pm, material, pelaksanaan_listrik FROM sop_documents`)
    
    for (const doc of documents) {
      let updated = false
      const newMaterials = doc.material.map((m: string) => {
        // Kain lap majun
        if (m.toLowerCase().includes('kain lap majun')) {
          updated = true
          if (['P1', 'P2', 'P3'].includes(doc.jenis_pm)) {
            return 'Kain lap majun (1 kg)'
          } else if (['P4', 'P5'].includes(doc.jenis_pm)) {
            return 'Kain lap majun (1.5 kg)'
          }
        }
        // Detergen
        if (m.toLowerCase().includes('detergen')) {
          updated = true
          if (['P1', 'P2'].includes(doc.jenis_pm)) {
            return 'Detergen (6 sachet @40 gram)'
          } else if (['P3', 'P4', 'P5'].includes(doc.jenis_pm)) {
            return 'Detergen (12 sachet @40 gram)'
          }
        }
        // Grease
        if (m.toLowerCase().includes('grease')) {
          updated = true
          return 'Grease (1 kaleng @100 gram)'
        }
        // Contact Cleaner
        if (m.toLowerCase().includes('contact cleaner')) {
          updated = true
          return 'Cairan pembersih kontak (1 kaleng @550 ml)'
        }
        // Vernis isolasi
        if (m.toLowerCase().includes('vernis isolasi')) {
          updated = true
          return 'Vernis isolasi (2 kaleng @400 ml)'
        }
        return m
      })

      // Add Thinner if the specific task exists
      const hasVarnishTask = doc.pelaksanaan_listrik?.some((p: string) => p.toLowerCase().includes('pelapisan ulang vernis isolasi'))
      if (hasVarnishTask) {
        if (!newMaterials.some((m: string) => m.toLowerCase().includes('thinner'))) {
          newMaterials.push('Thinner (1 kaleng @4 liter)')
          updated = true
        } else {
          // Update existing thinner
          const thinnerIndex = newMaterials.findIndex((m: string) => m.toLowerCase().includes('thinner'))
          if (newMaterials[thinnerIndex] !== 'Thinner (1 kaleng @4 liter)') {
            newMaterials[thinnerIndex] = 'Thinner (1 kaleng @4 liter)'
            updated = true
          }
        }
      }

      if (updated) {
        await query(`UPDATE sop_documents SET material = $1 WHERE id = $2`, [JSON.stringify(newMaterials), doc.id])
        console.log(`Updated ID ${doc.id} (${doc.jenis_pm})`)
      }
    }
    console.log('Update complete.')
  } catch (err) {
    console.error(err)
  }
}

updateSopMaterials()
