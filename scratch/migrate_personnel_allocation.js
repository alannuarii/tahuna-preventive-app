import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const allocations = [
  // ==================== SWD 6FHD 240 (Giant Engine, Heavy Parts) ====================
  { id: 1, mekanik: 1, listrik: 1, hse: 1 }, // P1: Checking & cleaning
  { id: 2, mekanik: 2, listrik: 1, hse: 1 }, // P2: Medium maintenance, filter change, panel cleaning
  { id: 3, mekanik: 3, listrik: 2, hse: 1 }, // P3: Heavy, 209L oil change, valve adjustment, governor
  { id: 4, mekanik: 4, listrik: 2, hse: 1 }, // P4: Very heavy, injector calibration, generator varnishing, Megger
  { id: 5, mekanik: 4, listrik: 3, hse: 1 }, // P5: Peak, core CAC & oil cooler dismantling, turbocharger inspection

  // ==================== DEUTZ MWM TBD 616 V12 (Medium Engine, Lighter Parts) ====================
  { id: 6, mekanik: 1, listrik: 1, hse: 1 }, // P1: Light checking & cleaning
  { id: 7, mekanik: 2, listrik: 1, hse: 1 }, // P2: Medium, 70L oil change, filter change
  { id: 8, mekanik: 2, listrik: 2, hse: 1 }, // P3: Medium-Heavy, 70L oil, valve adjustment, varistor test
  { id: 9, mekanik: 3, listrik: 2, hse: 1 }, // P4: Heavy, injector calibration, generator varnishing
  { id: 10, mekanik: 4, listrik: 3, hse: 1 }, // P5: Peak, core intercooler & oil cooler, full inspection

  // ==================== MITSUBISHI S16R-PTA-S (Very Giant 16-Cyl Engine, Very Heavy Parts) ====================
  { id: 11, mekanik: 1, listrik: 1, hse: 1 }, // P1: Checking, cleaning, racor filter
  { id: 12, mekanik: 2, listrik: 1, hse: 1 }, // P2: 16-cylinder filter change (4 fuel, 4 lube, 1 bypass), turbo pengikat
  { id: 13, mekanik: 3, listrik: 2, hse: 1 }, // P3: Huge 320L oil change, cooling jet check, sensor cleaning
  { id: 14, mekanik: 4, listrik: 2, hse: 1 }, // P4: Full valve adjustment (16 cyl), generator varnishing, bearing grease
  { id: 15, mekanik: 4, listrik: 3, hse: 1 }, // P5: Peak, 16 injector calibration, air filters, full team

  // ==================== CUMMINS KTA50-G8 (Giant 16-Cyl Engine, Very Heavy Parts) ====================
  { id: 16, mekanik: 1, listrik: 1, hse: 1 }, // P1: Checking, cleaning, racor filter, cable check
  { id: 17, mekanik: 2, listrik: 1, hse: 1 }, // P2: 180L oil change, 5 lube filters, 2 bypass, fan idler check
  { id: 18, mekanik: 3, listrik: 2, hse: 1 }, // P3: 180L oil, coolant filters, sensor cleaning
  { id: 19, mekanik: 4, listrik: 2, hse: 1 }, // P4: Valve adjustment, radiator damper greasing, Megger
  { id: 20, mekanik: 4, listrik: 3, hse: 1 }  // P5: Peak, injector calibration, PT pump parts, STC tappet/valve checks
]

async function run() {
  const client = await pool.connect()
  try {
    console.log("Starting transaction for personnel allocation optimization...")
    await client.query("BEGIN")

    for (const alloc of allocations) {
      const total = alloc.mekanik + alloc.listrik + alloc.hse
      console.log(`Updating ID ${alloc.id}: Mekanik = ${alloc.mekanik}, Listrik = ${alloc.listrik}, HSE = ${alloc.hse} (Total: ${total})...`)
      
      await client.query(
        `UPDATE sop_documents 
         SET personil_mekanik = $1,
             personil_listrik = $2,
             personil_hse = $3,
             jumlah_personil = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [alloc.mekanik, alloc.listrik, alloc.hse, total, alloc.id]
      )
    }

    console.log("Committing personnel allocation transaction...")
    await client.query("COMMIT")
    console.log("Personnel allocation updated successfully!")

    // Read back all rows in a nice formatted table summary
    const res = await client.query(`
      SELECT id, mesin, jenis_pm, personil_mekanik, personil_listrik, personil_hse, jumlah_personil
      FROM sop_documents
      ORDER BY mesin, jenis_pm
    `)
    
    console.log("\nALLOCATION SUMMARY TABLE:")
    console.log("-----------------------------------------------------------------------------------------")
    console.log(String("Mesin").padEnd(25) + " | " + String("PM").padEnd(4) + " | " + "Mekanik" + " | " + "Listrik" + " | " + "HSE" + " | " + "Total")
    console.log("-----------------------------------------------------------------------------------------")
    for (const row of res.rows) {
      console.log(
        row.mesin.padEnd(25) + " | " + 
        row.jenis_pm.padEnd(4) + " | " + 
        String(row.personil_mekanik).padStart(7) + " | " + 
        String(row.personil_listrik).padStart(7) + " | " + 
        String(row.personil_hse).padStart(3) + " | " + 
        String(row.jumlah_personil).padStart(5)
      )
    }
    console.log("-----------------------------------------------------------------------------------------")

  } catch (err) {
    console.error("Error updating personnel allocation, rolling back:", err)
    await client.query("ROLLBACK")
  } finally {
    client.release()
    await pool.end()
  }
}

run()
