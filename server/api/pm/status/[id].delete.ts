import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    await query('DELETE FROM engine_downtime WHERE id = $1', [id])
    return { success: true }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete downtime record' })
  }
})
