import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

async function runSQL() {
  const client = await pool.connect()
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sop_documents';
    `)
    console.log("Columns in sop_documents:")
    console.table(res.rows)

    const data = await client.query(`
      SELECT id, mesin, jenis_pm, pelaksanaan, risiko 
      FROM sop_documents;
    `)
    console.log("\nSOP Data:")
    console.table(data.rows.map(row => ({
      id: row.id,
      mesin: row.mesin,
      jenis_pm: row.jenis_pm,
      pelaksanaan_count: Array.isArray(row.pelaksanaan) ? row.pelaksanaan.length : (row.pelaksanaan ? 1 : 0),
      risiko_count: Array.isArray(row.risiko) ? row.risiko.length : (row.risiko ? 1 : 0)
    })))
    
    // Output full content for analysis
    console.log("\nFULL_DATA_START")
    console.log(JSON.stringify(data.rows, null, 2))
    console.log("FULL_DATA_END")

  } catch (e) {
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}

runSQL()
