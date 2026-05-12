import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkDuplicates() {
  try {
    const res = await pool.query(`
      SELECT machine_name, unit, material_id, interval_pm, COUNT(*) as count
      FROM machine_material_configs
      GROUP BY machine_name, unit, material_id, interval_pm
      HAVING COUNT(*) > 1
    `);
    
    if (res.rows.length === 0) {
      console.log("No exact duplicates found (same machine, unit, material, and interval).");
    } else {
      console.log("Exact duplicates found:");
      console.log(JSON.stringify(res.rows, null, 2));
    }

    const allData = await pool.query(`
      SELECT mmc.id, mmc.machine_name, mmc.unit, m.name, mmc.qty_per_pm, mmc.interval_pm
      FROM machine_material_configs mmc
      JOIN materials m ON mmc.material_id = m.id
      ORDER BY mmc.machine_name, mmc.unit, m.name
    `);
    console.log("\nFull data preview (first 50 rows):");
    console.log(JSON.stringify(allData.rows.slice(0, 50), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDuplicates();
