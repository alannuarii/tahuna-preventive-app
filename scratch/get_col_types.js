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
    const res = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'sop_documents'
        AND column_name IN ('tools', 'apd', 'material', 'risiko', 'pelaksanaan');
    `)
    console.table(res.rows)
  } catch (err) {
    console.error(err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
