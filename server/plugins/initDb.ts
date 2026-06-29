import { query } from '~/server/utils/db'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS pm_notifications (
        id SERIAL PRIMARY KEY,
        payload TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        realization_id INT
      );
    `)
    // Run migration query to add realization_id to existing table if it doesn't exist
    await query(`
      ALTER TABLE pm_notifications ADD COLUMN IF NOT EXISTS realization_id INT;
    `)
    console.log('Verified table pm_notifications')
  } catch (err) {
    console.error('Failed to create pm_notifications table:', err)
  }
})
