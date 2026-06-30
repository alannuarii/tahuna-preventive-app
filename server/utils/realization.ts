import { query } from '~/server/utils/db'

/**
 * Deletes a PM realization, reverts its associated material transactions,
 * restores the inventory stock, cleans up realization materials, and
 * unlinks it from notifications.
 * 
 * @param id The ID of the pm_realization to delete
 * @returns boolean indicating if the deletion was successful
 */
export async function deleteRealization(id: number): Promise<boolean> {
  // 1. Revert existing material transactions (restore previously deducted stock)
  const oldTxns = await query(
    `SELECT material_id, quantity 
     FROM material_transactions 
     WHERE reference_doc = $1 AND transaction_type = 'OUT'`,
    [`PM_REALIZATION_${id}`]
  )
  
  for (const txn of oldTxns) {
    await query(
      `UPDATE material_inventory 
       SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE material_id = $2`,
      [txn.quantity, txn.material_id]
    )
  }

  // 2. Delete old tracking log from material_transactions
  await query(`DELETE FROM material_transactions WHERE reference_doc = $1`, [`PM_REALIZATION_${id}`])

  // 3. Delete from pm_realization_materials
  await query(`DELETE FROM pm_realization_materials WHERE realization_id = $1`, [id])

  // 4. Update pm_notifications to unlink deleted realization
  await query(`UPDATE pm_notifications SET realization_id = NULL WHERE realization_id = $1`, [id])

  // 5. Delete the realization itself
  const result = await query(`DELETE FROM pm_realizations WHERE id = $1 RETURNING id`, [id])
  
  return result.length > 0
}
