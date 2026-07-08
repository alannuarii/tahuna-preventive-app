import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('units_profile', 'engine_downtime', 'materials', 'material_inventory', 'service_hour', 'pm_notifications', 'pm_realizations')
    `);
    const schema = {};
    for (let row of res.rows) {
      if (!schema[row.table_name]) schema[row.table_name] = [];
      schema[row.table_name].push(row.column_name);
    }
    console.log(JSON.stringify(schema, null, 2));
  } finally {
    pool.end();
  }
}
main();
