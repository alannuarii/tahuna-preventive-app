import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

async function run() {
  const client = await pool.connect()
  try {
    console.log("Adding columns to sop_documents table...")
    await client.query(`
      ALTER TABLE sop_documents 
      ADD COLUMN IF NOT EXISTS pelaksanaan_mekanik jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS pelaksanaan_listrik jsonb DEFAULT '[]'::jsonb;
    `)
    console.log("Columns 'pelaksanaan_mekanik' and 'pelaksanaan_listrik' added successfully!")
  } catch (err) {
    console.error("Error adding columns:", err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
