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

    // Run migration query to add lampiran_formulir to sop_documents table if it doesn't exist
    await query(`
      ALTER TABLE sop_documents ADD COLUMN IF NOT EXISTS lampiran_formulir JSONB;
    `)
    console.log('Verified table sop_documents')

    // Run migration query to add dokumen_pdf to pm_realizations table if it doesn't exist
    await query(`
      ALTER TABLE pm_realizations ADD COLUMN IF NOT EXISTS dokumen_pdf JSONB DEFAULT '[]'::jsonb;
    `)
    console.log('Verified table pm_realizations')
  } catch (err) {
    console.error('Failed to run startup migrations:', err)
  }
})
