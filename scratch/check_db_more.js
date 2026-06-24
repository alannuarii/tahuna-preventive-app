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
    const res = await pool.query('SELECT * FROM machine_material_configs LIMIT 5');
    console.log('--- machine_material_configs ---');
    console.log(res.rows);

    const inventory = await pool.query('SELECT * FROM material_inventory LIMIT 5');
    console.log('--- material_inventory ---');
    console.log(inventory.rows);

    const sh = await pool.query('SELECT * FROM service_hour ORDER BY id DESC LIMIT 10');
    console.log('--- service_hour (latest 10) ---');
    console.log(sh.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
