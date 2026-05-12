
import { query } from '../server/utils/db'

async function checkData() {
  try {
    const units = await query('SELECT * FROM units_profile ORDER BY unit_id ASC')
    console.log('Units Profile:', JSON.stringify(units, null, 2))

    const cycles = await query('SELECT * FROM pm_cycle_definitions ORDER BY min_hours ASC')
    console.log('PM Cycle Definitions:', JSON.stringify(cycles, null, 2))
  } catch (err) {
    console.error(err)
  }
}

checkData()
