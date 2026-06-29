import { query } from '~/server/utils/db'
import { parseWhatsAppReport } from '~/utils/waReportParser'
import { engines } from '~/server/utils/engineData'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Asumsikan payload dari n8n dsb memiliki porsi yang memuat pesan text, misal di `body.message` atau `body.text`.
    // Kita juga support jika dikirimkan body raw text.
    let textToParse = ''
    if (typeof body === 'object' && body !== null) {
      // Coba cari field yang memungkinkan
      textToParse = body.message || body.text || body.body || JSON.stringify(body)
    } else if (typeof body === 'string') {
      textToParse = body
    }
    
    if (!textToParse) {
      throw createError({
        statusCode: 400,
        message: 'Payload tidak ditemukan atau kosong. Harap kirimkan pesan pada field "message", "text", atau sebagai raw string.'
      })
    }
    
    // Parse the WA report
    const parseResult = parseWhatsAppReport(textToParse)
    
    // Cek kriteria: parser harus menemukan unit, tanggal, dan jenis_pm (P1-P5)
    if (!parseResult.unit || !parseResult.tanggal || !parseResult.jenisPm) {
      throw createError({
        statusCode: 400,
        message: 'Pesan ditolak: Format tidak sesuai kriteria aplikasi. Pastikan Tanggal, Unit, dan Jenis PM tertera.'
      })
    }

    // Temukan unit mesin
    const engine = engines.find(e => e.unit == parseResult.unit)
    if (!engine) {
      throw createError({
        statusCode: 400,
        message: `Pesan ditolak: Unit ${parseResult.unit} tidak valid dalam sistem.`
      })
    }

    // Ambil daftar material terdaftar untuk unit tersebut dari database
    const sqlMaterials = `
      SELECT 
          m.id,
          m.name as nama,
          m.unit as satuan,
          mmc.qty_per_pm as jumlah,
          mmc.interval_pm as cycle,
          mmc.unit as machine_unit
      FROM materials m
      JOIN machine_material_configs mmc ON m.id = mmc.material_id
      WHERE mmc.machine_name = $1 AND (mmc.unit IS NULL OR mmc.unit = $2)
      ORDER BY m.name ASC
    `
    const dbMaterials = await query(sqlMaterials, [engine.mesin, engine.unit])

    // Pemetaan material terdeteksi dari WA ke material database
    const materialsToInsert = []
    if (parseResult.materials && parseResult.materials.length > 0 && dbMaterials.length > 0) {
      for (const parsed of parseResult.materials) {
        const matchedDbMat = dbMaterials.find((m: any) => 
          m.nama.toLowerCase() === parsed.dbName.toLowerCase()
        )
        if (matchedDbMat && parsed.quantity > 0) {
          materialsToInsert.push({
            material_id: matchedDbMat.id,
            nama_material: matchedDbMat.nama,
            jumlah_standar: matchedDbMat.jumlah,
            jumlah_realisasi: parsed.quantity,
            satuan: matchedDbMat.satuan,
            cycle: matchedDbMat.cycle
          })
        }
      }
    }

    // Gabungkan teks WA asli dengan sistem warning jika ada
    let catatan = textToParse
    if (parseResult.warnings && parseResult.warnings.length > 0) {
      catatan += '\n\n[⚠️ SYSTEM PARSING WARNINGS]:\n' + parseResult.warnings.map(w => `- ${w}`).join('\n')
    }

    // Buat transaksi realisasi PM
    const realizationResult = await query(
      `INSERT INTO pm_realizations (tanggal_pelaksanaan, unit, mesin, jenis_pm, catatan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [parseResult.tanggal, engine.unit, engine.mesin, parseResult.jenisPm, catatan]
    )

    const realizationId = realizationResult[0].id

    // Masukkan data rincian material terpakai, catat log transaksi, dan potong stok
    for (const material of materialsToInsert) {
      await query(
        `INSERT INTO pm_realization_materials 
         (realization_id, nama_material, jumlah_standar, jumlah_realisasi, satuan, cycle)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          realizationId,
          material.nama_material,
          material.jumlah_standar,
          material.jumlah_realisasi,
          material.satuan,
          material.cycle
        ]
      )

      if (material.material_id && material.jumlah_realisasi > 0) {
        const notesText = `Penggunaan Realisasi PM ${parseResult.jenisPm} - Unit ${engine.unit}`
        const refDoc = `PM_REALIZATION_${realizationId}`
        
        // Log transaksi keluar
        await query(`
           INSERT INTO material_transactions (material_id, transaction_type, quantity, transaction_date, notes, reference_doc)
           VALUES ($1, 'OUT', $2, $3, $4, $5)
        `, [material.material_id, material.jumlah_realisasi, parseResult.tanggal, notesText, refDoc])
        
        // Potong stok live
        const inv = await query(`SELECT * FROM material_inventory WHERE material_id = $1`, [material.material_id])
        if (inv && inv.length > 0) {
          await query(`
            UPDATE material_inventory 
            SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
            WHERE material_id = $2
          `, [material.jumlah_realisasi, material.material_id])
        } else {
          await query(`
            INSERT INTO material_inventory (material_id, current_stock, updated_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
          `, [material.material_id, Math.max(0, -material.jumlah_realisasi)])
        }
      }
    }
    
    // Simpan ke notification table dengan mengaitkan realization_id
    const payloadToSave = typeof body === 'object' ? JSON.stringify(body) : String(textToParse)
    
    const result = await query(
      `INSERT INTO pm_notifications (payload, is_read, realization_id) VALUES ($1, false, $2) RETURNING id`,
      [payloadToSave, realizationId]
    )
    
    return {
      success: true,
      message: 'Pesan diterima, data realisasi berhasil diproses otomatis dan disimpan',
      id: result[0]?.id,
      realizationId: realizationId
    }
  } catch (error: any) {
    console.error('Webhook Error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message
    })
  }
})
