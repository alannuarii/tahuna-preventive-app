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

async function checkTable() {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT * FROM pengusahaan_harian LIMIT 1')
    console.log("Columns:", res.fields.map(f => f.name))
    console.log("Row 1:", res.rows[0])
    
    const countRes = await client.query('SELECT COUNT(*) FROM pengusahaan_harian')
    console.log("Total rows:", countRes.rows[0].count)
  } catch (e) {
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}

checkTable()
