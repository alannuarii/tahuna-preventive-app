import { query } from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const sqlQuery = `
      SELECT waktu, unit, ganti_oli, overhaul AS jamoperasi FROM (
        SELECT waktu, unit, ganti_oli, overhaul
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `
    const rows = await query(sqlQuery)
    return rows
  } catch (err) {
    console.error('Database error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch service hours' })
  }
})
