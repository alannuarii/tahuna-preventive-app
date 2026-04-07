import { query } from '~/server/utils/db'
import { engines } from '~/server/utils/engineData'

export default defineEventHandler(async (event) => {
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

    const realizationResult = await query(
      `INSERT INTO pm_realizations (tanggal_pelaksanaan, unit, mesin, jenis_pm, catatan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [tanggal_pelaksanaan, unit, engine.mesin, jenis_pm, catatan || null]
    )

    const realizationId = realizationResult[0].id

    if (materials && Array.isArray(materials) && materials.length > 0) {
      for (const material of materials) {
        await query(
          `INSERT INTO pm_realization_materials 
           (realization_id, nama_material, jumlah_standar, jumlah_realisasi, satuan, cycle)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            realizationId,
            material.nama || material.nama_material,
            material.jumlah_standar,
            material.jumlah_realisasi,
            material.satuan,
            material.cycle
          ]
        )
      }
    }

    return { success: true, id: realizationId, message: 'Realization created' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error creating realization:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create realization' })
  }
})
