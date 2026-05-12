import { query } from '~/server/utils/db'
import { generatePMSchedule } from '~/server/utils/pmSchedule'

export default defineEventHandler(async (event) => {
  const { start, end } = getQuery(event)

  const sqlQuery = `
    SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
      SELECT unit, overhaul, ganti_oli
      FROM service_hour
      ORDER BY id DESC
      LIMIT 7
    ) AS subquery
    ORDER BY unit ASC;
  `

  try {
    const units = await query(sqlQuery)
    const cycles = await query(`SELECT min_hours as min, max_hours as max, pm_type as pm FROM pm_cycle_definitions ORDER BY min_hours ASC`)
    const downtimes = await query(`SELECT unit, status, start_date, end_date FROM engine_downtime`)
    
    let averages = []
    try {
      averages = await query(`
        SELECT unit, AVG(CAST(jam_kerja AS NUMERIC)) as avg_jam_kerja
        FROM pengusahaan_harian
        WHERE waktu >= CURRENT_DATE - INTERVAL '90 days'
          AND unit IN ('1', '4', '5')
        GROUP BY unit
      `)
    } catch (e) {
      console.error("Failed to fetch historical averages:", e)
    }

    const schedule = generatePMSchedule(units, cycles, (start as string) || null, (end as string) || null, downtimes, averages)
    return schedule
  } catch (err) {
    console.error('Database error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate PM schedule' })
  }
})
