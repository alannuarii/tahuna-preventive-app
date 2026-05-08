import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { start, end, unit, jenis_pm, sort, page: pageStr, limit: limitStr } = getQuery(event)
  const page = parseInt((pageStr as string) || '1')
  const limit = parseInt((limitStr as string) || '10')

  let whereClause = `WHERE 1=1`
  const params: any[] = []
  let paramIndex = 1

  if (start) {
    whereClause += ` AND r.tanggal_pelaksanaan >= $${paramIndex}`
    params.push(start)
    paramIndex++
  }

  if (end) {
    whereClause += ` AND r.tanggal_pelaksanaan <= $${paramIndex}`
    params.push(end)
    paramIndex++
  }

  if (unit) {
    const units = (unit as string).split(',').map(u => parseInt(u.trim())).filter(u => !isNaN(u))
    if (units.length > 0) {
      const placeholders = units.map((_, i) => `$${paramIndex + i}`).join(', ')
      whereClause += ` AND r.unit IN (${placeholders})`
      params.push(...units)
      paramIndex += units.length
    }
  }

  if (jenis_pm) {
    const pms = (jenis_pm as string).split(',').map(p => p.trim()).filter(p => p)
    if (pms.length > 0) {
      const placeholders = pms.map((_, i) => `$${paramIndex + i}`).join(', ')
      whereClause += ` AND r.jenis_pm IN (${placeholders})`
      params.push(...pms)
      paramIndex += pms.length
    }
  }

  try {
    const countSql = `SELECT COUNT(*) as total FROM pm_realizations r ${whereClause}`
    const countResult = await query(countSql, params)
    const total = parseInt(countResult[0]?.total || 0)

    const offset = (page - 1) * limit
    let dataSql = `
      SELECT 
        r.id,
        r.tanggal_pelaksanaan,
        r.unit,
        r.mesin,
        r.jenis_pm,
        r.catatan,
        r.created_at,
        r.updated_at
      FROM pm_realizations r
      ${whereClause}
      ORDER BY r.tanggal_pelaksanaan ${sort === 'asc' ? 'ASC' : 'DESC'}, r.created_at ${sort === 'asc' ? 'ASC' : 'DESC'}
    `

    const dataParams = [...params]

    if (limit > 0) {
      dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      dataParams.push(limit, offset)
    }

    const realizations = await query(dataSql, dataParams)

    if (realizations.length > 0) {
      const ids = realizations.map((r: any) => r.id)
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
      const materials = await query(`SELECT * FROM pm_realization_materials WHERE realization_id IN (${placeholders})`, ids)
      
      realizations.forEach((r: any) => {
        r.materials = materials.filter((m: any) => m.realization_id === r.id)
      })
    }

    return {
      data: realizations,
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1
      }
    }
  } catch (error) {
    console.error('Error fetching realizations:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch realizations' })
  }
})
