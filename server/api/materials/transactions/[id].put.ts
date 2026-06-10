import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID transaksi tidak valid' })
  }

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

    const targetMaterialId = parseInt(material_id)

    // 1. Ambil data transaksi lama
    const oldTxns = await query(`
      SELECT material_id, transaction_type, quantity, reference_doc 
      FROM material_transactions 
      WHERE id = $1
    `, [id])

    if (!oldTxns || oldTxns.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Transaksi tidak ditemukan' })
    }

    const oldTxn = oldTxns[0]

    // Cegah edit jika transaksi ini otomatis dibuat dari Realisasi PM
    if (oldTxn.reference_doc && oldTxn.reference_doc.startsWith('PM_REALIZATION_')) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Transaksi otomatis dari Realisasi PM tidak dapat diubah langsung' 
      })
    }

    const oldMatId = parseInt(oldTxn.material_id)
    const oldType = oldTxn.transaction_type
    const oldQty = parseFloat(oldTxn.quantity)

    // Hitung delta stok lama (jika OUT berkurang, jika IN bertambah)
    const oldDelta = oldType === 'OUT' ? -oldQty : oldQty

    // Hitung delta stok baru (jika OUT berkurang, jika IN bertambah)
    const newDelta = transaction_type === 'OUT' ? -qtyNum : qtyNum

    // 2. Adjust live inventory stock
    if (targetMaterialId === oldMatId) {
      // Jika material sama, cukup update selisihnya
      const netDelta = newDelta - oldDelta
      
      const inv = await query(`SELECT * FROM material_inventory WHERE material_id = $1`, [targetMaterialId])
      if (inv && inv.length > 0) {
        await query(`
          UPDATE material_inventory 
          SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
          WHERE material_id = $2
        `, [netDelta, targetMaterialId])
      } else {
        await query(`
          INSERT INTO material_inventory (material_id, current_stock, updated_at) 
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [targetMaterialId, Math.max(0, newDelta)])
      }
    } else {
      // Jika material berubah:
      // a. Kembalikan stok material lama (kurangi delta stok lama)
      await query(`
        UPDATE material_inventory 
        SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
        WHERE material_id = $2
      `, [oldDelta, oldMatId])

      // b. Tambahkan stok material baru (tambahkan delta stok baru)
      const invNew = await query(`SELECT * FROM material_inventory WHERE material_id = $1`, [targetMaterialId])
      if (invNew && invNew.length > 0) {
        await query(`
          UPDATE material_inventory 
          SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
          WHERE material_id = $2
        `, [newDelta, targetMaterialId])
      } else {
        await query(`
          INSERT INTO material_inventory (material_id, current_stock, updated_at) 
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [targetMaterialId, Math.max(0, newDelta)])
      }
    }

    // 3. Update transaksi
    await query(`
      UPDATE material_transactions 
      SET material_id = $1, transaction_type = $2, quantity = $3, transaction_date = $4, notes = $5
      WHERE id = $6
    `, [targetMaterialId, transaction_type, qtyNum, transaction_date, notes || '', id])

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating transaction:', error)
    throw createError({ statusCode: 500, statusMessage: error.statusMessage || 'Gagal memperbarui transaksi' })
  }
})
