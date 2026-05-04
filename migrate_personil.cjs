const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Altering sop_documents table...');
    await client.query(`
      ALTER TABLE sop_documents 
      ADD COLUMN personil_mekanik INTEGER DEFAULT 2,
      ADD COLUMN personil_listrik INTEGER DEFAULT 2,
      ADD COLUMN personil_hse INTEGER DEFAULT 1;
    `);
    
    console.log('Update jumlah_personil based on new columns');
    await client.query(`
      UPDATE sop_documents 
      SET jumlah_personil = personil_mekanik + personil_listrik + personil_hse;
    `);

    console.log('Table altered successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
