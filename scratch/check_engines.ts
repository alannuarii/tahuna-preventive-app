
import { query } from '../server/utils/db'

async function checkEngines() {
  try {
    const res = await query('SELECT unit_id, mesin_merek, mesin_tipe FROM units_profile')
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error(err)
  }
}

checkEngines()
