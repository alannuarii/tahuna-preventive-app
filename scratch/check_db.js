import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  try {
    const units = await pool.query('SELECT * FROM units_profile ORDER BY unit_id ASC');
    console.log('--- UNITS PROFILE ---');
    console.log(units.rows);

    const cycles = await pool.query('SELECT * FROM pm_cycle_definitions ORDER BY min_hours ASC');
    console.log('--- PM CYCLE DEFINITIONS ---');
    console.log(cycles.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
