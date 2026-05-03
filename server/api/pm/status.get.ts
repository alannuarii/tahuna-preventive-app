import { query } from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const statuses = await query(`
      SELECT DISTINCT ON (unit) id, unit, status, start_date, end_date, notes
      FROM engine_downtime
      ORDER BY unit, id DESC
    `)
    return statuses
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch engine status' })
  }
})
