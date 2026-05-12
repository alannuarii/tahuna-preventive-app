
import { query } from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const rows = await query('SELECT * FROM units_profile ORDER BY unit_id ASC')
    
    return rows.map(row => ({
      unit: row.unit_id,
      mesin: `${row.mesin_merek} ${row.mesin_tipe}`,
      ganti_oli_cycle: row.ganti_oli_cycle,
      overhaul_cycle: row.overhaul_cycle,
      full_profile: row
    }))
  } catch (error) {
    console.error('Error fetching engines:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch engines' })
  }
})
