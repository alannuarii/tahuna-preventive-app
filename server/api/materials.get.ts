import { query } from '~/server/utils/db'
import { engines } from '~/server/utils/engineData'

export default defineEventHandler(async (event) => {
  const { unit } = getQuery(event)

  if (!unit) {
    throw createError({ statusCode: 400, statusMessage: 'Unit parameter is required' })
  }

  const engine = engines.find(e => e.unit == parseInt(unit as string))
  if (!engine) {
    throw createError({ statusCode: 400, statusMessage: `Invalid unit: ${unit}` })
  }

  try {
    const sql = `
      SELECT 
          m.id,
          m.name as nama,
          m.unit as satuan,
          mmc.qty_per_pm as jumlah,
          mmc.interval_pm as cycle
      FROM materials m
      JOIN machine_material_configs mmc ON m.id = mmc.material_id
      WHERE mmc.machine_name = $1
      ORDER BY m.name ASC
    `

    const rows = await query(sql, [engine.mesin])

    return {
      materials: rows.map((row: any) => ({
        ...row,
        jumlah: parseFloat(row.jumlah)
      }))
    }
  } catch (error) {
    console.error('Error fetching materials:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch materials' })
  }
})
