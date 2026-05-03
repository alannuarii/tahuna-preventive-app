const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tahuna_preventive',
});
async function test() {
  const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pm_realizations';`);
  console.log(res.rows);
  const res2 = await pool.query(`SELECT * FROM pm_realizations ORDER BY id DESC LIMIT 2;`);
  console.log(res2.rows);
  pool.end();
}
test();
