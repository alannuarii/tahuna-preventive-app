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

const updates = [
  // ==================== SWD 6FHD 240 ====================
  {
    id: 1, // SWD - P1
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya"],
    risiko: ["Terjepit komponen mekanik mesin", "Terpeleset akibat permukaan lantai licin", "Tersengat arus listrik akibat kesalahan penanganan"]
  },
  {
    id: 2, // SWD - P2
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Grease gun"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Grease secukupnya"],
    risiko: ["Terjepit komponen mekanik berputar", "Terpeleset akibat ceceran bahan bakar atau pelumas", "Tersengat arus listrik dari panel", "Paparan debu kotoran generator"]
  },
  {
    id: 3, // SWD - P3
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Grease gun", "Bak penampung oli (Oil pan)", "Feeler gauge"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter minyak lumas (4 buah)", "Minyak lumas (209 liter)", "Grease secukupnya"],
    risiko: ["Terjepit bagian mekanik mesin", "Terpeleset genangan 209L minyak lumas", "Tersengat listrik panel tegangan tinggi", "Paparan oli panas atau bahan bakar ke kulit/mata"]
  },
  {
    id: 4, // SWD - P4
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Grease gun", "Bak penampung oli", "Feeler gauge", "Insulating tester (Megger)", "Alat kalibrasi injektor / pompa (Injector calibration kit)", "Vibration meter"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter minyak lumas (4 buah)", "Minyak lumas (209 liter)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit bantalan engkol atau komponen berat", "Terpeleset akibat pelumas/basa", "Tersengat listrik dari Megger", "Luka gores saat pengencangan baut pondasi/carter", "Terkena semprotan cairan injektor saat kalibrasi", "Terhirup uap vernis"]
  },
  {
    id: 5, // SWD - P5
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Grease gun", "Bak penampung oli", "Feeler gauge", "Insulating tester (Megger)", "Alat kalibrasi injektor / pompa (Injector calibration kit)", "Vibration meter", "Kunci momen (Torque wrench)", "Thermal imager"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter minyak lumas (4 buah)", "Minyak lumas (209 liter)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit mekanisme timing/camshaft", "Terpeleset ceceran pendingin/pelumas", "Tersengat tegangan listrik saat uji tahanan (Megger)", "Paparan suhu tinggi (thermal spot) dan bahaya komponen internal mesin"]
  },

  // ==================== DEUTZ MWM TBD 616 V12 ====================
  {
    id: 6, // Deutz - P1
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya"],
    risiko: ["Terjepit komponen mekanik mesin", "Terpeleset akibat lantai basah / oli", "Tersengat arus listrik akibat kesalahan pemeliharaan"]
  },
  {
    id: 7, // Deutz - P2
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (Oil pan)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (1 buah)", "Filter oli (1 buah)", "Minyak lumas (70 liter)"],
    risiko: ["Terjepit komponen bergerak", "Terpeleset ceceran minyak lumas 70L", "Tersengat listrik dari panel"]
  },
  {
    id: 8, // Deutz - P3
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (Oil pan)", "Feeler gauge"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (1 buah)", "Filter oli (1 buah)", "Filter udara (2 buah)", "Minyak lumas (70 liter)"],
    risiko: ["Terjepit saat melakukan adjust valve", "Terpeleset genangan pelumas", "Tersengat arus dari lidah kontaktor / terminal panel"]
  },
  {
    id: 9, // Deutz - P4
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (Oil pan)", "Feeler gauge", "Insulating tester (Megger)", "Grease gun", "Alat kalibrasi injektor / pompa (Injector calibration kit)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (1 buah)", "Filter oli (1 buah)", "Filter udara (2 buah)", "Minyak lumas (70 liter)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit atau tertimpa saat inspeksi bearing", "Terpeleset lantai licin", "Tersengat listrik saat Megger", "Terkena semprotan cairan injektor saat kalibrasi", "Terhirup uap vernis"]
  },
  {
    id: 10, // Deutz - P5
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Tang Ampere", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (Oil pan)", "Feeler gauge", "Insulating tester (Megger)", "Grease gun", "Alat kalibrasi injektor / pompa (Injector calibration kit)", "Thermal Imager", "Kunci momen (Torque wrench)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (1 buah)", "Filter oli (1 buah)", "Filter udara (2 buah)", "Minyak lumas (70 liter)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit mekanisme timing camshaft/pump", "Terpeleset ceceran pendingin", "Tersengat listrik tegangan tinggi saat Megger", "Paparan panas dari pengujian thermal"]
  },

  // ==================== MITSUBISHI S16R-PTA-S ====================
  {
    id: 11, // Mitsubishi - P1
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (2 buah)"],
    risiko: ["Terjepit komponen", "Terpeleset akibat lantai basah", "Tergores sisa material mesin"]
  },
  {
    id: 12, // Mitsubishi - P2
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (2 buah)", "Fuel filter (4 buah)", "Lube oil filter (4 buah)", "Lube oil filter bypass (1 buah)"],
    risiko: ["Terjepit komponen mekanik", "Paparan pelumas/BBM saat ganti filter"]
  },
  {
    id: 13, // Mitsubishi - P3
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (320L)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (2 buah)", "Fuel filter (4 buah)", "Lube oil filter (4 buah)", "Lube oil filter bypass (1 buah)", "Lube oil (320 liter)", "Cairan pembersih kontak (Contact cleaner)"],
    risiko: ["Terjepit atau tergores mesin", "Terpeleset genangan 320L pelumas", "Tersengat arus dari panel sinkron"]
  },
  {
    id: 14, // Mitsubishi - P4
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (320L)", "Feeler gauge (kunci katup)", "Insulating tester (Megger)", "Grease gun"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (2 buah)", "Fuel filter (4 buah)", "Lube oil filter (4 buah)", "Lube oil filter bypass (1 buah)", "Lube oil (320 liter)", "Cairan pembersih kontak (Contact cleaner)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit pada saat penyetelan katup", "Terpeleset ceceran pelumas/bbm", "Tersengat arus panel / Megger", "Terhirup uap vernis"]
  },
  {
    id: 15, // Mitsubishi - P5
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli (320L)", "Feeler gauge (kunci katup)", "Insulating tester (Megger)", "Grease gun", "Alat kalibrasi injektor / pompa (Injector calibration kit)", "Kunci momen (Torque wrench)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan karet/nitrile", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (2 buah)", "Fuel filter (4 buah)", "Lube oil filter (4 buah)", "Lube oil filter bypass (1 buah)", "Air filter (4 buah)", "Lube oil (320 liter)", "Cairan pembersih kontak (Contact cleaner)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Tertimpa komponen berat (turbo, water pump)", "Terjepit ruang mekanik yang sempit", "Terpeleset akibat tumpahan besar pelumas", "Tersengat listrik dari panel", "Terkena semprotan injector saat kalibrasi"]
  },

  // ==================== CUMMINS KTA50-G8 ====================
  {
    id: 16, // Cummins - P1
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter racor (1 buah)"],
    risiko: ["Terjepit", "Terpeleset lantai basah/berminyak", "Tergores"]
  },
  {
    id: 17, // Cummins - P2
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli besar"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan nitrile / karet", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter Racor (1 buah)", "Filter oli (5 buah)", "Filter oli bypass (2 buah)", "Minyak lumas (180 liter)"],
    risiko: ["Terjepit komponen mekanik berputar", "Terpeleset genangan 180L oli", "Tersengat listrik dari baterai/alternator"]
  },
  {
    id: 18, // Cummins - P3
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli besar"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan nitrile / karet", "Kacamata safety"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter Racor (1 buah)", "Filter oli (5 buah)", "Filter oli bypass (2 buah)", "Filter coolant (2 buah)", "Minyak lumas (180 liter)", "Cairan pembersih kontak (Contact cleaner)"],
    risiko: ["Terjepit komponen mekanik berputar", "Terpeleset tumpahan 180L oli / coolant", "Tersengat listrik dari panel proteksi"]
  },
  {
    id: 19, // Cummins - P4
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli besar", "Feeler gauge / Dial indicator", "Insulating tester (Megger)", "Grease gun"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan nitrile / karet", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter Racor (1 buah)", "Filter oli (5 buah)", "Filter oli bypass (2 buah)", "Filter coolant (2 buah)", "Filter udara (2 buah)", "Minyak lumas (180 liter)", "Cairan pembersih kontak (Contact cleaner)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit pada area celah katup", "Tersengat listrik dari proses pengukuran Megger / area alternator", "Terpeleset genangan pelumas", "Terhirup uap vernis"]
  },
  {
    id: 20, // Cummins - P5
    tools: ["Kunci pas ring (1 Set)", "Obeng minus dan plus", "Multimeter", "Senter / alat penerangan", "Filter wrench", "Bak penampung oli besar", "Feeler gauge / Dial indicator", "Insulating tester (Megger)", "Grease gun", "Alat kalibrasi injektor (Injector calibration kit)", "Kunci momen (Torque wrench)"],
    apd: ["Safety helmet", "Safety shoes", "Baju kerja", "Ear plug", "Sarung tangan mekanik", "Sarung tangan nitrile / karet", "Kacamata safety", "Sarung tangan safety dielektrik", "Masker"],
    material: ["Kain lap majun secukupnya", "Detergen secukupnya", "Filter bahan bakar (2 buah)", "Filter Racor (1 buah)", "Filter oli (5 buah)", "Filter oli bypass (2 buah)", "Filter coolant (2 buah)", "Filter udara (2 buah)", "Minyak lumas (180 liter)", "Cairan pembersih kontak (Contact cleaner)", "Grease secukupnya", "Vernis isolasi"],
    risiko: ["Terjepit saat membongkar part injeksi", "Tersengat listrik saat uji Megger", "Terpeleset pelumas/coolant volume besar", "Terkena semprotan bahan bakar bertekanan tinggi"]
  }
]

async function migrate() {
  const client = await pool.connect()
  try {
    console.log("Starting database transaction...")
    await client.query("BEGIN")

    for (const update of updates) {
      console.log(`Updating document ID ${update.id}...`)
      await client.query(
        `UPDATE sop_documents
         SET tools = $1::jsonb,
             apd = $2::jsonb,
             material = $3::jsonb,
             risiko = $4::jsonb,
             updated_at = NOW()
         WHERE id = $5`,
        [
          JSON.stringify(update.tools),
          JSON.stringify(update.apd),
          JSON.stringify(update.material),
          JSON.stringify(update.risiko),
          update.id
        ]
      )
    }

    console.log("Committing transaction...")
    await client.query("COMMIT")
    console.log("Database update completed successfully!")

    // Read back a sample row to verify
    const verifyRes = await client.query("SELECT id, mesin, jenis_pm, tools, apd, material, risiko FROM sop_documents WHERE id = 17")
    console.log("\nVerification Sample (ID: 17):")
    console.log(JSON.stringify(verifyRes.rows[0], null, 2))

  } catch (err) {
    console.error("Error occurred during migration, rolling back:", err)
    await client.query("ROLLBACK")
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
