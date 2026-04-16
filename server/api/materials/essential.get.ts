import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Ambil data inventory essential
    const inventorySQL = `
      SELECT
        id,
        name,
        part_number,
        unit AS satuan,
        current_stock,
        0 AS min_stock,
        'Essential' AS category
      FROM materials_essential
      ORDER BY name ASC
    `
    const inventoryRows = await query(inventorySQL, [])

    // Ambil data transaksi essential
    const txnsSQL = `
      SELECT
        t.id,
        t.material_id,
        m.name AS material_name,
        t.transaction_type,
        t.quantity,
        m.unit AS satuan,
        t.transaction_date,
        t.notes
      FROM material_essential_transactions t
      JOIN materials_essential m ON m.id = t.material_id
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT 200
    `
    const txnRows = await query(txnsSQL, [])

    return {
      success: true,
      inventory: inventoryRows,
      transactions: txnRows
    }
  } catch (error: any) {
    console.error('Error fetching essential data:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengambil data essential' })
  }
})
