import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(parseInt(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid material ID' })
  }

  // Fetch material
  const materialRows = await query(
    `SELECT
       me.id,
       me.name,
       me.part_number,
       me.unit       AS satuan,
       me.status,
       me.current_stock,
       me.notes,
       me.spesification,
       me.images,
       me.created_at,
       COALESCE(
         string_agg(mee.machine_type, ', ' ORDER BY mee.machine_type),
         'Common'
       ) AS engines_text
     FROM materials_essential me
     LEFT JOIN material_essential_engines mee ON mee.material_id = me.id
     WHERE me.id = $1
     GROUP BY me.id`,
    [parseInt(id)]
  )

  if (!materialRows || materialRows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Material not found' })
  }

  const row = materialRows[0]

  // Parse comma-separated image URLs (full URLs from AuraStorage)
  const images: string[] = row.images
    ? row.images.split(',').map((u: string) => u.trim()).filter(Boolean)
    : []

  // Fetch transactions for this material
  const txnRows = await query(
    `SELECT
       t.id,
       t.transaction_type,
       t.quantity,
       t.notes,
       t.transaction_date,
       $2 AS satuan
     FROM material_essential_transactions t
     WHERE t.material_id = $1
     ORDER BY t.transaction_date DESC, t.id DESC
     LIMIT 100`,
    [parseInt(id), row.satuan]
  ).catch(() => [] as any[])

  return {
    success: true,
    data: {
      id: row.id,
      name: row.name,
      part_number: row.part_number,
      satuan: row.satuan,
      status: row.status,
      current_stock: parseFloat(row.current_stock),
      notes: row.notes,
      spesification: row.spesification,
      images,
      enginesText: row.engines_text,
      created_at: row.created_at,
    },
    transactions: txnRows,
  }
})
