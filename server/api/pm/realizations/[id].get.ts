import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id format' })
  }

  try {
    const realizations = await query(`SELECT * FROM pm_realizations WHERE id = $1`, [id])
    if (realizations.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    const realization = realizations[0]
    const materials = await query(`SELECT * FROM pm_realization_materials WHERE realization_id = $1 ORDER BY id`, [id])

    return { ...realization, materials }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch realization detail' })
  }
})
