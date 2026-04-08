import { query } from '~/server/utils/db'
import { engines } from '~/server/utils/engineData'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tanggal_pelaksanaan, unit, jenis_pm, catatan, materials } = body

    if (!tanggal_pelaksanaan || !unit || !jenis_pm) {
      throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
    }

    const engine = engines.find(e => e.unit == unit)
    if (!engine) {
      throw createError({ statusCode: 400, statusMessage: `Invalid unit: ${unit}` })
    }

    const realizationResult = await query(
      `INSERT INTO pm_realizations (tanggal_pelaksanaan, unit, mesin, jenis_pm, catatan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [tanggal_pelaksanaan, unit, engine.mesin, jenis_pm, catatan || null]
    )

    const realizationId = realizationResult[0].id

    if (materials && Array.isArray(materials) && materials.length > 0) {
      for (const material of materials) {
        await query(
          `INSERT INTO pm_realization_materials 
           (realization_id, nama_material, jumlah_standar, jumlah_realisasi, satuan, cycle)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            realizationId,
            material.nama || material.nama_material,
            material.jumlah_standar,
            material.jumlah_realisasi,
            material.satuan,
            material.cycle
          ]
        )

        // Integrasi transaksi material
        if (material.material_id && material.jumlah_realisasi > 0) {
          const notesText = `Penggunaan Realisasi PM ${jenis_pm} - Unit ${unit}`
          const refDoc = `PM_REALIZATION_${realizationId}`
          
          // Insert into generic transactions log
          await query(`
             INSERT INTO material_transactions (material_id, transaction_type, quantity, transaction_date, notes, reference_doc)
             VALUES ($1, 'OUT', $2, $3, $4, $5)
          `, [material.material_id, material.jumlah_realisasi, tanggal_pelaksanaan || new Date().toISOString(), notesText, refDoc])
          
          // Adjust stock live
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
    }

    return { success: true, id: realizationId, message: 'Realization created' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error creating realization:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create realization' })
  }
})
