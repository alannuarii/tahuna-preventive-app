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

function generateRandomSlug(length = 20) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const units = [1, 4, 5, 6, 7, 8, 9]
const pms = ['P1', 'P2', 'P3', 'P4', 'P5']

async function run() {
  const client = await pool.connect()
  try {
    console.log("Starting transaction to create and populate 'pm_public_links' table...")
    await client.query("BEGIN")

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS pm_public_links (
        id SERIAL PRIMARY KEY,
        unit INT NOT NULL,
        jenis_pm VARCHAR(10) NOT NULL,
        public_slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_unit_pm UNIQUE (unit, jenis_pm)
      );
    `)
    console.log("Table 'pm_public_links' ensured.")

    // Check if we already have links
    const existing = await client.query("SELECT COUNT(*) FROM pm_public_links")
    const count = parseInt(existing.rows[0].count)

    if (count === 0) {
      console.log("Populating 35 combinations (7 Units x 5 PM Levels)...")
      for (const unit of units) {
        for (const pm of pms) {
          const slug = generateRandomSlug(20)
          await client.query(
            `INSERT INTO pm_public_links (unit, jenis_pm, public_slug) 
             VALUES ($1, $2, $3)`,
            [unit, pm, slug]
          )
        }
      }
      console.log("All 35 public links successfully created!")
    } else {
      console.log(`Table already has ${count} records. No new links inserted to preserve existing mappings.`)
    }

    await client.query("COMMIT")

    // Show sample mappings
    const samples = await client.query(`
      SELECT unit, jenis_pm, public_slug 
      FROM pm_public_links 
      ORDER BY unit, jenis_pm 
      LIMIT 10
    `)
    
    console.log("\nSAMPLE PUBLIC LINK MAPPINGS:")
    console.log("-------------------------------------------------------")
    console.log("Unit  | PM  | Public Slug Link")
    console.log("-------------------------------------------------------")
    for (const row of samples.rows) {
      console.log(`Unit ${row.unit} | ${row.jenis_pm.padEnd(3)} | /pub/${row.public_slug}`)
    }
    console.log("-------------------------------------------------------")

  } catch (err) {
    console.error("Migration error, rolling back:", err)
    await client.query("ROLLBACK")
  } finally {
    client.release()
    await pool.end()
  }
}

run()
