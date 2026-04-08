import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { material_id, transaction_type, quantity, transaction_date, notes } = body

  if (!material_id || !transaction_type || !quantity) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
  }

  try {
    const qtyNum = parseFloat(quantity)
    if (isNaN(qtyNum) || qtyNum <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Jumlah tidak valid' })
    }

    // 1. Insert transaction
    await query(`
      INSERT INTO material_transactions (material_id, transaction_type, quantity, transaction_date, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [material_id, transaction_type, qtyNum, transaction_date || new Date().toISOString(), notes || ''])

    // 2. Adjust inventory stock
    const delta = transaction_type === 'OUT' ? -qtyNum : qtyNum
    const inv = await query(`SELECT * FROM material_inventory WHERE material_id = $1`, [material_id])
    
    if (inv && inv.length > 0) {
      await query(`
        UPDATE material_inventory 
        SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
        WHERE material_id = $2
      `, [delta, material_id])
    } else {
      await query(`
        INSERT INTO material_inventory (material_id, current_stock, updated_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [material_id, Math.max(0, delta)])
    }

    return { success: true }
  } catch (error) {
    console.error('Error inserting transaction:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan transaksi' })
  }
})
