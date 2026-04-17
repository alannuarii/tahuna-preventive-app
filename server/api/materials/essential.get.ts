import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Ambil data inventory essential
    const inventorySQL = `
      SELECT
        m.id,
        m.name,
        m.part_number,
        m.unit AS satuan,
        m.current_stock,
        0 AS min_stock,
        'Essential' AS category,
        COALESCE(STRING_AGG(e.machine_type, ', '), 'Common') as mesin
      FROM materials_essential m
      LEFT JOIN material_essential_engines e ON m.id = e.material_id
      GROUP BY m.id
      ORDER BY m.name ASC
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
