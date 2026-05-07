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

const splits = [
  // ==================== SWD 6FHD 240 ====================
  {
    id: 1, // SWD P1
    mekanik: [
      "Memeriksa kebersihan mesin.",
      "Membuang air kondensat dalam tangki bahan bakar.",
      "Memeriksa kebocoran air, pelumas, dan bahan bakar.",
      "Memeriksa dan mengencangkan sambungan pada cylinder head and cylinder block.",
      "Memeriksa dan mengencangkan baut saluran udara masuk dan saluran gas buang.",
      "Memeriksa kebersihan lingkungan mesin sekitar.",
      "Memeriksa kekencangan baut penutup dan pondasi generator.",
      "Mengecek level pelumas dan air pendingin. Tambah jika diperlukan.",
      "Mengecek kondisi filter pelumas dan bahan bakar.",
      "Membersihkan filter udara.",
      "Memeriksa kondisi gas buang pada cerobong.",
      "Memeriksa fungsi sistem udara start.",
      "Mengecek kondisi rubber coupling engine generator."
    ],
    listrik: [
      "Memeriksa kekencangan baut terminal baterai.",
      "Memeriksa kondisi kabel busbar agar tidak ada gesekan dengan kabel tray.",
      "Mengecek level oli trafo dan elektrolit baterai. Tambah jika diperlukan.",
      "Memeriksa fungsi motor fan radiator."
    ]
  },
  {
    id: 2, // SWD P2
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P1.",
      "Mengganti filter bahan bakar (2 buah).",
      "Mengecek baut pengikat cover cylinder head.",
      "Mengecek kondisi dan mengencangkan baut pengikat pada pipa pelumasan, bahan bakar dan saluran pendingin.",
      "Membersihkan kisi-kisi radiator."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P1.",
      "Membersihkan komponen panel generator dan panel kontrol mesin.",
      "Mengecek bearing motor fan radiator dan bearing generator.",
      "Membersihkan bushing trafo.",
      "Membersihkan filter/strainer generator.",
      "Mengukur tegangan baterai."
    ]
  },
  {
    id: 3, // SWD P3
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P2.",
      "Mengganti filter oli (4 buah).",
      "Melakukan penyetelan (adjust) clearance valve.",
      "Mengkuras dan mengganti pelumas (209 liter).",
      "Memeriksa atau mengganti minyak pelumas governor dan melumasi batang penggerak governor.",
      "Memeriksa atau mengganti minyak pelumas turbocharger."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P2.",
      "Mengukur tahanan dari varistor, dioda putar dan exciter generator."
    ]
  },
  {
    id: 4, // SWD P4
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P3.",
      "Membersihkan dan melakukan kalibrasi pada injector.",
      "Memberikan grease pada bearing motor fan radiator dan bearing generator."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P3.",
      "Membersihkan komponen dan pelapisan ulang vernis isolasi pada belitan generator.",
      "Mengukur tahanan isolasi generator.",
      "Mengukur tahanan isolasi motor fan radiator."
    ]
  },
  {
    id: 5, // SWD P5
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P4.",
      "Membersihkan core CAC dan oil cooler.",
      "Membersihkan bagian dalam turbocharger."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P4."
    ]
  },

  // ==================== DEUTZ MWM TBD 616 V12 ====================
  {
    id: 6, // Deutz P1
    mekanik: [
      "Memeriksa kebersihan mesin.",
      "Membuang air kondensat dalam tangki bahan bakar.",
      "Memeriksa kebocoran air, pelumas, dan bahan bakar.",
      "Memeriksa dan mengencangkan sambungan pada cylinder head and cylinder block.",
      "Memeriksa dan mengencangkan baut saluran udara masuk dan saluran gas buang.",
      "Memeriksa kebersihan lingkungan mesin sekitar.",
      "Memeriksa kekencangan baut penutup dan pondasi generator.",
      "Mengecek level pelumas dan air pendingin. Tambah jika diperlukan.",
      "Mengecek kondisi filter pelumas dan bahan bakar.",
      "Membersihkan filter udara.",
      "Memeriksa kondisi gas buang pada cerobong."
    ],
    listrik: [
      "Memeriksa kekencangan baut terminal baterai.",
      "Memeriksa kondisi kabel busbar agar tidak ada gesekan dengan kabel tray.",
      "Mengecek level oli trafo dan elektrolit baterai. Tambah jika diperlukan.",
      "Memeriksa fungsi motor starter."
    ]
  },
  {
    id: 7, // Deutz P2
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P1.",
      "Mengkuras dan mengganti minyak lumas (70 liter).",
      "Mengganti filter bahan bakar (1 buah).",
      "Mengganti filter oli (1 buah).",
      "Mengecek baut pengikat cover cylinder head.",
      "Mengecek kondisi dan mengencangkan baut pengikat pada pipa pelumasan, bahan bakar and saluran pendingin.",
      "Membersihkan kisi-kisi radiator."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P1.",
      "Membersihkan komponen panel generator dan panel kontrol mesin.",
      "Memeriksa bearing generator.",
      "Membersihkan bushing trafo.",
      "Mengukur tegangan baterai."
    ]
  },
  {
    id: 8, // Deutz P3
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P2.",
      "Mengganti filter udara (2 buah).",
      "Melakukan penyetelan (adjust) clearance valve."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P2.",
      "Mengukur tahanan dari varistor, dioda putar dan exciter generator."
    ]
  },
  {
    id: 9, // Deutz P4
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P3.",
      "Membersihkan dan melakukan kalibrasi pada injector.",
      "Memberikan grease pada bearing motor fan radiator dan bearing generator."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P3.",
      "Membersihkan komponen dan pelapisan ulang vernis isolasi pada belitan generator.",
      "Mengukur tahanan isolasi generator.",
      "Mengukur tahanan isolasi motor fan radiator."
    ]
  },
  {
    id: 10, // Deutz P5
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P4.",
      "Membersihkan core intercooler dan oil cooler."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P4."
    ]
  },

  // ==================== MITSUBISHI S16R-PTA-S ====================
  {
    id: 11, // Mitsubishi P1
    mekanik: [
      "Memeriksa kebersihan mesin secara keseluruhan.",
      "Membuang air kondensat di dalam tangki bahan bakar.",
      "Memeriksa kebocoran air, pelumas, dan bahan bakar.",
      "Memeriksa dan mengencangkan sambungan pada cylinder head and cylinder block.",
      "Memeriksa dan mengencangkan baut saluran udara masuk dan saluran gas buang.",
      "Memeriksa kebersihan lingkungan di sekitar area mesin.",
      "Memeriksa kekencangan baut penutup and pondasi generator.",
      "Mengecek level pelumas dan air pendingin. Tambah jika diperlukan.",
      "Mengecek kondisi filter oli dan bahan bakar.",
      "Mengganti filter racor (2 buah).",
      "Membersihkan filter udara.",
      "Memeriksa kondisi gas buang pada cerobong."
    ],
    listrik: [
      "Memeriksa kekencangan baut terminal baterai.",
      "Memeriksa kondisi kabel busbar untuk memastikan tidak ada gesekan dengan kabel tray.",
      "Mengecek level oli trafo dan elektrolit baterai. Tambah jika diperlukan.",
      "Memeriksa fungsi motor fan radiator dan motor fan exhaust.",
      "Memeriksa fungsi kontaktor pada panel kontrol."
    ]
  },
  {
    id: 12, // Mitsubishi P2
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P1.",
      "Mengecek kekencangan baut pengikat cover cylinder head.",
      "Mengecek kondisi pipa pelumasan, bahan bakar dan saluran pendinginan.",
      "Mengganti filter oli (4 buah) dan filter oli bypass (1 buah).",
      "Mengganti filter bahan bakar (4 buah).",
      "Memeriksa kebersihan kisi-kisi radiator.",
      "Mengecek kekencangan baut pengikat turbo, clamp pipa exhaust, pipa air intake dan pipa exhaust."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P1.",
      "Membersihkan komponen panel sinkron.",
      "Memeriksa bearing generator.",
      "Membersihkan bushing trafo."
    ]
  },
  {
    id: 13, // Mitsubishi P3
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P2.",
      "Mengkuras dan mengganti pelumas (320 liter).",
      "Membersihkan kisi-kisi radiator.",
      "Mengecek fungsi cooling jet menggunakan priming pump dan memastikan aliran oli lancar."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P2.",
      "Membersihkan seluruh sensor menggunakan cairan pembersih non-konduktif.",
      "Mengecek bearing motor fan radiator.",
      "Mengukur tahanan dari varistor, dioda putar dan exciter generator.",
      "Mengukur tegangan baterai.",
      "Membersihkan filter/strainer generator."
    ]
  },
  {
    id: 14, // Mitsubishi P4
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P3.",
      "Melakukan penyetelan (adjust) clearance valve.",
      "Memberikan grease pada bearing generator."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P3.",
      "Membersihkan komponen dan pelapisan ulang vernis isolasi pada belitan generator.",
      "Mengukur tahanan isolasi generator.",
      "Mengukur tahanan isolasi motor fan radiator."
    ]
  },
  {
    id: 15, // Mitsubishi P5
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P4.",
      "Membersihkan dan melakukan kalibrasi pada injector.",
      "Mengganti filter udara (4 buah)."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P4."
    ]
  },

  // ==================== CUMMINS KTA50-G8 ====================
  {
    id: 16, // Cummins P1
    mekanik: [
      "Memeriksa kebersihan mesin.",
      "Membuang air kondensat dalam tangki bahan bakar.",
      "Memeriksa kebocoran air, pelumas, dan bahan bakar.",
      "Memeriksa dan mengencangkan sambungan pada cylinder head and cylinder block.",
      "Memeriksa dan mengencangkan baut saluran udara masuk dan saluran gas buang.",
      "Memeriksa kebersihan lingkungan mesin sekitar.",
      "Memeriksa kekencangan baut penutup dan pondasi generator.",
      "Mengecek level pelumas dan air pendingin. Tambah jika diperlukan.",
      "Mengecek kondisi filter pelumas dan bahan bakar.",
      "Mengganti filter racor (1 buah).",
      "Membersihkan filter udara.",
      "Memeriksa kondisi gas buang pada cerobong."
    ],
    listrik: [
      "Memeriksa kekencangan baut terminal baterai.",
      "Memeriksa kondisi kabel busbar agar tidak ada gesekan dengan kabel tray.",
      "Mengecek level oli trafo dan elektrolit baterai. Tambah jika diperlukan.",
      "Mengecek fuse motor starter dan panel kontrol.",
      "Mengecek kondisi kabel pada PT Pump."
    ]
  },
  {
    id: 17, // Cummins P2
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P1.",
      "Mengecek baut pengikat cover cylinder head.",
      "Mengecek kondisi pipa pelumasan, bahan bakar dan saluran pendingin.",
      "Mengkuras dan mengganti pelumas mesin (180 liter) serta memeriksa saluran pelumas.",
      "Mengganti filter oli (5 buah) dan filter oli bypass (2 buah).",
      "Mengganti filter bahan bakar (2 buah).",
      "Mengganti filter racor (1 buah).",
      "Membersihkan kisi-kisi radiator.",
      "Mengecek baut pengikat turbo, clamp pipa exhaust, baut pipa air intake, dan baut pengikat exhaust."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P1.",
      "Memeriksa bearing generator.",
      "Membersihkan komponen panel sinkron.",
      "Mengecek fan drive idler, fan belt tensioner dan bearing fan radiator.",
      "Membersihkan bushing trafo.",
      "Membersihkan filter/strainer generator."
    ]
  },
  {
    id: 18, // Cummins P3
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P2.",
      "Mengganti filter coolant (2 buah)."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P2.",
      "Membersihkan seluruh sensor menggunakan cairan pembersih non-konduktif.",
      "Mengukur tahanan dari varistor, dioda putar dan exciter generator.",
      "Mengukur tegangan baterai.",
      "Membersihkan filter/strainer generator."
    ]
  },
  {
    id: 19, // Cummins P4
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P3.",
      "Mengganti filter udara (2 buah).",
      "Memberikan grease pada bearing radiator, bearing damper dan bearing generator.",
      "Melakukan penyetelan (adjust) clearance valve."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P3.",
      "Membersihkan komponen dan pelapisan ulang vernis isolasi pada belitan generator.",
      "Mengukur tahanan isolasi generator."
    ]
  },
  {
    id: 20, // Cummins P5
    mekanik: [
      "Melakukan seluruh pekerjaan mekanik P4.",
      "Membersihkan dan melakukan pengecekan pada injector.",
      "Membersihkan bagian PT pump.",
      "Membersihkan dan mengecek STC tappets (injector).",
      "Membersihkan dan mengecek STC oil control valve."
    ],
    listrik: [
      "Melakukan seluruh pekerjaan listrik P4."
    ]
  }
]

async function migrate() {
  const client = await pool.connect()
  try {
    console.log("Starting database transaction for split migration...")
    await client.query("BEGIN")

    for (const split of splits) {
      console.log(`Migrating split for document ID ${split.id}...`)
      await client.query(
        `UPDATE sop_documents
         SET pelaksanaan_mekanik = $1::jsonb,
             pelaksanaan_listrik = $2::jsonb,
             updated_at = NOW()
         WHERE id = $3`,
        [
          JSON.stringify(split.mekanik),
          JSON.stringify(split.listrik),
          split.id
        ]
      )
    }

    console.log("Committing transaction...")
    await client.query("COMMIT")
    console.log("Database split migration completed successfully!")

    // Read back a sample row to verify
    const verifyRes = await client.query("SELECT id, mesin, jenis_pm, pelaksanaan_mekanik, pelaksanaan_listrik FROM sop_documents WHERE id = 1")
    console.log("\nVerification Sample (ID: 1):")
    console.log(JSON.stringify(verifyRes.rows[0], null, 2))

  } catch (err) {
    console.error("Error occurred during split migration, rolling back:", err)
    await client.query("ROLLBACK")
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
