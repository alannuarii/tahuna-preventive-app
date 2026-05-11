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
    console.log('Connected for migration...');

    const updateQuery = `
      -- SWD 209 -> 190
      UPDATE sop_documents
      SET
        material = REPLACE(REPLACE(material::text, '209 liter', '190 liter'), '209L', '190 liter')::jsonb,
        pelaksanaan_mekanik = REPLACE(REPLACE(pelaksanaan_mekanik::text, '209 liter', '190 liter'), '209L', '190 liter')::jsonb,
        risiko = REPLACE(REPLACE(risiko::text, '209 liter', '190 liter'), '209L', '190 liter')::jsonb,
        penormalan = REPLACE(REPLACE(penormalan::text, '209 liter', '190 liter'), '209L', '190 liter')::jsonb
      WHERE mesin ILIKE '%swd%';

      -- Cummins 180 -> 178
      UPDATE sop_documents
      SET
        material = REPLACE(REPLACE(material::text, '180 liter', '178 liter'), '180L', '178 liter')::jsonb,
        pelaksanaan_mekanik = REPLACE(REPLACE(pelaksanaan_mekanik::text, '180 liter', '178 liter'), '180L', '178 liter')::jsonb,
        risiko = REPLACE(REPLACE(risiko::text, '180 liter', '178 liter'), '180L', '178 liter')::jsonb,
        penormalan = REPLACE(REPLACE(penormalan::text, '180 liter', '178 liter'), '180L', '178 liter')::jsonb
      WHERE mesin ILIKE '%cummins%';

      -- Mitsubishi 320 -> 362
      UPDATE sop_documents
      SET
        material = REPLACE(REPLACE(material::text, '320 liter', '362 liter'), '320L', '362 liter')::jsonb,
        pelaksanaan_mekanik = REPLACE(REPLACE(pelaksanaan_mekanik::text, '320 liter', '362 liter'), '320L', '362 liter')::jsonb,
        risiko = REPLACE(REPLACE(risiko::text, '320 liter', '362 liter'), '320L', '362 liter')::jsonb,
        penormalan = REPLACE(REPLACE(penormalan::text, '320 liter', '362 liter'), '320L', '362 liter')::jsonb
      WHERE mesin ILIKE '%mitsubishi%';
    `;

    await client.query(updateQuery);
    console.log('SQL Updates executed successfully!');
  } catch (e) {
    console.error('Error running migration:', e);
  } finally {
    await client.end();
  }
}
run();
