import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sop_documents'
    `);
    console.log(JSON.stringify(res.rows));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
