import { query } from '~/server/utils/db'
import { engines } from '~/server/utils/engineData'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id format' })
  }

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

    // Update realization
    const result = await query(
      `UPDATE pm_realizations 
       SET tanggal_pelaksanaan = $1, unit = $2, mesin = $3, jenis_pm = $4, catatan = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id`,
      [tanggal_pelaksanaan, unit, engine.mesin, jenis_pm, catatan || null, id]
    )

    if (result.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    // Delete old materials and insert new ones
    await query(`DELETE FROM pm_realization_materials WHERE realization_id = $1`, [id])

    // Revert existing material transactions (restore previously deducted stock)
    const oldTxns = await query(`SELECT material_id, quantity FROM material_transactions WHERE reference_doc = $1 AND transaction_type = 'OUT'`, [`PM_REALIZATION_${id}`])
    for (const txn of oldTxns) {
      await query(`UPDATE material_inventory SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2`, [txn.quantity, txn.material_id])
    }
    // Delete old tracking log
    await query(`DELETE FROM material_transactions WHERE reference_doc = $1`, [`PM_REALIZATION_${id}`])

    if (materials && Array.isArray(materials) && materials.length > 0) {
      for (const material of materials) {
        await query(
          `INSERT INTO pm_realization_materials 
           (realization_id, nama_material, jumlah_standar, jumlah_realisasi, satuan, cycle)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            material.nama || material.nama_material,
            material.jumlah_standar,
            material.jumlah_realisasi,
            material.satuan,
            material.cycle
          ]
        )

        // Re-apply material transaction
        if (material.material_id && material.jumlah_realisasi > 0) {
          const notesText = `Penggunaan Realisasi PM ${jenis_pm} - Unit ${unit}`
          const refDoc = `PM_REALIZATION_${id}`
          
          await query(`
             INSERT INTO material_transactions (material_id, transaction_type, quantity, transaction_date, notes, reference_doc)
             VALUES ($1, 'OUT', $2, $3, $4, $5)
          `, [material.material_id, material.jumlah_realisasi, tanggal_pelaksanaan || new Date().toISOString(), notesText, refDoc])
          
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

    return { success: true, id, message: 'Realization updated' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating realization:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update realization' })
  }
})
