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

async function checkAvg() {
  const client = await pool.connect()
  try {
    const res = await client.query(`
      SELECT unit, AVG(CAST(jam_kerja AS NUMERIC)) as avg_jam_kerja, COUNT(*) as count_days
      FROM pengusahaan_harian
      WHERE unit IN ('1', '4', '5')
      GROUP BY unit
    `)
    console.log("Averages:", res.rows)
  } catch (e) {
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}

checkAvg()
