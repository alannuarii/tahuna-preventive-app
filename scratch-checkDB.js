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
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `)
    console.log("Existing Tables:")
    res.rows.forEach(r => console.log(r.table_name))
  } catch (e) {
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}

runSQL()
