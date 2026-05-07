import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'
import url from 'url'
import fs from 'fs'

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
    const res = await client.query('SELECT id, mesin, jenis_pm, pelaksanaan, tools, apd, material, risiko FROM sop_documents ORDER BY mesin, jenis_pm;')
    console.log(`Found ${res.rows.length} rows.`)
    fs.writeFileSync('scratch/sop_data_raw.json', JSON.stringify(res.rows, null, 2))
    console.log("Data written to scratch/sop_data_raw.json")
    
    // Summary of each row
    res.rows.forEach(row => {
      console.log(`\n===========================================`);
      console.log(`ID: ${row.id} | Mesin: ${row.mesin} | PM: ${row.jenis_pm}`);
      console.log(`PELAKSANAAN (${Array.isArray(row.pelaksanaan) ? 'Array' : typeof row.pelaksanaan}):`);
      console.log(JSON.stringify(row.pelaksanaan, null, 2));
      console.log(`TOOLS:`, JSON.stringify(row.tools, null, 2));
      console.log(`APD:`, JSON.stringify(row.apd, null, 2));
      console.log(`MATERIAL:`, JSON.stringify(row.material, null, 2));
      console.log(`RISIKO:`, JSON.stringify(row.risiko, null, 2));
    })
  } catch (err) {
    console.error(err)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
