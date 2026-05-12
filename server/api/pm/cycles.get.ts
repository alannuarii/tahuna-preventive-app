
import { query } from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const rows = await query('SELECT * FROM pm_cycle_definitions ORDER BY min_hours ASC')
    
    return rows.map(row => ({
      min: row.min_hours,
      max: row.max_hours,
      pm: row.pm_type
    }))
  } catch (error) {
    console.error('Error fetching PM cycles:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch PM cycles' })
  }
})
