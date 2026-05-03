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
  const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
  console.log(res.rows);
  pool.end();
}
test();
