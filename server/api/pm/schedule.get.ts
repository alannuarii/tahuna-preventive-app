import { query } from '~/server/utils/db'
import { generatePMSchedule } from '~/server/utils/pmSchedule'

export default defineEventHandler(async (event) => {
  const { start, end } = getQuery(event)

  const sqlQuery = `
    SELECT unit, overhaul AS jamoperasi FROM (
      SELECT unit, overhaul
      FROM service_hour
      ORDER BY id DESC
      LIMIT 7
    ) AS subquery
    ORDER BY unit ASC;
  `

  try {
    const units = await query(sqlQuery)
    const schedule = generatePMSchedule(units, (start as string) || null, (end as string) || null)
    return schedule
  } catch (err) {
    console.error('Database error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate PM schedule' })
  }
})
