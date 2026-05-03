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
  try {
    const res = await pool.query(`SELECT * FROM pm_realisasi ORDER BY id DESC LIMIT 5;`);
    console.log("Realisasi:", res.rows);
  } catch (err) {
    try {
      const res2 = await pool.query(`SELECT * FROM realisasi ORDER BY id DESC LIMIT 5;`);
      console.log("Realisasi:", res2.rows);
    } catch (e) {
      console.error(e);
    }
  } finally {
    pool.end();
  }
}
test();
