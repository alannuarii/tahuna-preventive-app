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
    // 1. Get all unique machine names in pm_realizations
    const uniqueMesin = await pool.query(`SELECT DISTINCT mesin FROM pm_realizations`);
    console.log("Unique machines in pm_realizations:", uniqueMesin.rows);

    // 2. Query any 'Air Filter' or 'Filter Udara' entries in pm_realization_materials
    const airFilterRealizations = await pool.query(`
      SELECT prm.nama_material, COUNT(*), SUM(prm.jumlah_realisasi) as total_qty
      FROM pm_realization_materials prm
      GROUP BY prm.nama_material
    `);
    console.log("\nMaterial names in pm_realization_materials:", airFilterRealizations.rows);

    // 3. Search for Air Filter usage on Mitsubishi / Cummins in 2026
    const searchRes = await pool.query(`
      SELECT pr.mesin, pr.unit, pr.tanggal_pelaksanaan, prm.nama_material, prm.jumlah_realisasi
      FROM pm_realization_materials prm
      JOIN pm_realizations pr ON prm.realization_id = pr.id
      WHERE prm.nama_material ILIKE '%filter%'
      LIMIT 10
    `);
    console.log("\nSample PM realization materials with 'filter':", searchRes.rows);

    // 4. Look up materials where name has 'air' or 'udara'
    const matUdara = await pool.query(`
      SELECT * FROM materials WHERE name ILIKE '%air%' OR name ILIKE '%udara%'
    `);
    console.log("\nMaterials matching air/udara:", matUdara.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
main();
