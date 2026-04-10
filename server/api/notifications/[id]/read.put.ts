import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID not provided' })
    }
    
    await query(
      `UPDATE pm_notifications SET is_read = true WHERE id = $1`,
      [parseInt(id)]
    )
    
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Gagal menandai notifikasi'
    })
  }
})
