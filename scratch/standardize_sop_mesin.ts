
import { query } from '../server/utils/db'

async function standardizeSopMesin() {
  const mapping = [
    { old: 'Mitsubishi S16R-PTA-S', new: 'MITSUBISHI S16R-PTA' },
    { old: 'Cummins KTA50-G8', new: 'CUMMINS KTA-50-G8' },
    { old: 'Deutz MWM TBD 616 V12', new: 'DEUTZ MWM TBD 616 V12' },
    { old: 'SWD 6FHD 240', new: 'SWD 6FHD 240' } // Already correct but for completeness
  ]

  for (const m of mapping) {
    await query('UPDATE sop_documents SET mesin = $1 WHERE mesin = $2', [m.new, m.old])
    console.log(`Updated ${m.old} -> ${m.new}`)
  }
}

standardizeSopMesin()
