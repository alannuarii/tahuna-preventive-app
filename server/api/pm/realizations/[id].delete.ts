import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  try {
    const result = await query(`DELETE FROM pm_realizations WHERE id = $1 RETURNING id`, [id])
    if (result.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    return { success: true, message: 'Deleted' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
