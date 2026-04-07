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
      }
    }

    return { success: true, id, message: 'Realization updated' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating realization:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update realization' })
  }
})
