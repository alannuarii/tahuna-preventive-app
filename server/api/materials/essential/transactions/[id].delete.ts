import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID transaksi tidak valid' })
  }

  try {
    // 1. Ambil data transaksi lama
    const txns = await query(`
      SELECT material_id, transaction_type, quantity 
      FROM material_essential_transactions 
      WHERE id = $1
    `, [id])

    if (!txns || txns.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Transaksi tidak ditemukan' })
    }

    const txn = txns[0]
    const matId = parseInt(txn.material_id)
    const type = txn.transaction_type
    const qty = parseFloat(txn.quantity)

    // Revert stok pada materials_essential (kurangi delta dari database)
    const delta = type === 'OUT' ? -qty : qty

    await query(`
      UPDATE materials_essential 
      SET current_stock = current_stock - $1
      WHERE id = $2
    `, [delta, matId])

    // 2. Hapus transaksi
    await query(`
      DELETE FROM material_essential_transactions 
      WHERE id = $1
    `, [id])

    return { success: true, message: 'Transaksi essential berhasil dihapus' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error deleting essential transaction:', error)
    throw createError({ statusCode: 500, statusMessage: error.statusMessage || 'Gagal menghapus transaksi essential' })
  }
})
