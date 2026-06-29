import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID not provided' })
    }
    
    const items = await query(
      `SELECT id, payload, is_read, created_at, realization_id 
       FROM pm_notifications 
       WHERE id = $1`,
      [parseInt(id)]
    )
    
    if (!items || items.length === 0) {
      throw createError({ statusCode: 404, message: 'Notifikasi tidak ditemukan' })
    }
    
    return items[0]
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: 'Gagal memuat notifikasi'
    })
  }
})
