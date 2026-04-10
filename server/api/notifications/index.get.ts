import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Only return unread notifications
    // Order by created_at DESC to show newest first
    const items = await query(
      `SELECT id, payload, is_read, created_at 
       FROM pm_notifications 
       WHERE is_read = false 
       ORDER BY created_at DESC 
       LIMIT 50`
    )
    
    return {
      notifications: items
    }
  } catch (error: any) {
    console.error('List Notifications Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data notifikasi'
    })
  }
})
