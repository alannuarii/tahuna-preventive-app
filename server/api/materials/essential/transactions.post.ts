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

    // 1. Insert transaction to essential table
    await query(`
      INSERT INTO material_essential_transactions (material_id, transaction_type, quantity, transaction_date, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [material_id, transaction_type, qtyNum, transaction_date || new Date().toISOString(), notes || ''])

    // 2. Adjust inventory stock on essential material
    const delta = transaction_type === 'OUT' ? -qtyNum : qtyNum
    await query(`
      UPDATE materials_essential
      SET current_stock = current_stock + $1
      WHERE id = $2
    `, [delta, material_id])

    return { success: true }
  } catch (error) {
    console.error('Error inserting essential transaction:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menyimpan transaksi essential' })
  }
})
