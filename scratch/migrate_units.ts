
import { query } from '../server/utils/db'

async function migrate() {
  try {
    console.log('Adding columns to units_profile...')
    await query('ALTER TABLE units_profile ADD COLUMN IF NOT EXISTS ganti_oli_cycle INTEGER')
    await query('ALTER TABLE units_profile ADD COLUMN IF NOT EXISTS overhaul_cycle INTEGER')

    const updates = [
      { unit: 1, ganti: 500, overhaul: 6000 },
      { unit: 4, ganti: 250, overhaul: 6000 },
      { unit: 5, ganti: 250, overhaul: 6000 },
      { unit: 6, ganti: 500, overhaul: 5000 },
      { unit: 7, ganti: 500, overhaul: 5000 },
      { unit: 8, ganti: 250, overhaul: 6000 },
      { unit: 9, ganti: 250, overhaul: 6000 }
    ]

    for (const up of updates) {
      await query('UPDATE units_profile SET ganti_oli_cycle = $1, overhaul_cycle = $2 WHERE unit_id = $3', [up.ganti, up.overhaul, up.unit])
    }
    
    console.log('Migration complete.')
  } catch (err) {
    console.error(err)
  }
}

migrate()
