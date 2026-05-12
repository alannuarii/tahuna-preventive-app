
import { query } from '../server/utils/db'

async function listAllSlugs() {
  try {
    const res = await query('SELECT unit, jenis_pm, public_slug FROM pm_public_links')
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error(err)
  }
}

listAllSlugs()
