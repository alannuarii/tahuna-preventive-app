import { query } from '~/server/utils/db'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS pm_notifications (
        id SERIAL PRIMARY KEY,
        payload TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('Verified table pm_notifications')
  } catch (err) {
    console.error('Failed to create pm_notifications table:', err)
  }
})
