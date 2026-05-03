import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, unit, status, start_date, end_date, notes } = body

  try {
    if (status === 'Normal') {
      // If setting to normal, we end any ongoing downtime for this unit
      await query(`
        UPDATE engine_downtime 
        SET end_date = CURRENT_DATE 
        WHERE unit = $1 AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      `, [unit])
    } else {
      if (id) {
        await query(`
          UPDATE engine_downtime 
          SET status = $1, start_date = $2, end_date = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [status, start_date, end_date || null, notes || null, id])
      } else {
        await query(`
          INSERT INTO engine_downtime (unit, status, start_date, end_date, notes)
          VALUES ($1, $2, $3, $4, $5)
        `, [unit, status, start_date, end_date || null, notes || null])
      }
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update engine status' })
  }
})
