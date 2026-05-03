import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tahuna_preventive',
})

async function runSQL() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const createDowntime = `
      CREATE TABLE IF NOT EXISTS engine_downtime (
        id SERIAL PRIMARY KEY,
        unit INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    await client.query(createDowntime)
    console.log("Created engine_downtime table")
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}
runSQL()
