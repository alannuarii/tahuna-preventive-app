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

    const createEssentialMaterial = `
      CREATE TABLE IF NOT EXISTS materials_essential (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        part_number VARCHAR(100),
        unit VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_stock NUMERIC DEFAULT 0,
        notes TEXT,
        spesification TEXT,
        images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    await client.query(createEssentialMaterial)
    console.log("Created materials_essential table")

    const createEssentialEngines = `
      CREATE TABLE IF NOT EXISTS material_essential_engines (
        id SERIAL PRIMARY KEY,
        material_id INTEGER REFERENCES materials_essential(id) ON DELETE CASCADE,
        machine_type VARCHAR(100) NOT NULL
      );
    `
    await client.query(createEssentialEngines)
    console.log("Created material_essential_engines table")

    const createEssentialTransactions = `
      CREATE TABLE IF NOT EXISTS material_essential_transactions (
        id SERIAL PRIMARY KEY,
        material_id INTEGER REFERENCES materials_essential(id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL,
        quantity NUMERIC NOT NULL,
        transaction_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    await client.query(createEssentialTransactions)
    console.log("Created material_essential_transactions table")

    await client.query('COMMIT')
    console.log("Successfully migrated database")
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
  } finally {
    client.release()
    await pool.end()
  }
}

runSQL()
