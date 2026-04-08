import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { material_id, start, end, sort, page: pageStr, limit: limitStr } = getQuery(event)
  const page = parseInt((pageStr as string) || '1')
  const limit = parseInt((limitStr as string) || '15')

  let whereClause = 'WHERE 1=1'
  const params: any[] = []
  let paramIndex = 1

  if (material_id) {
    whereClause += ` AND mt.material_id = $${paramIndex}`
    params.push(parseInt(material_id as string))
    paramIndex++
  }

  if (start) {
    whereClause += ` AND mt.transaction_date >= $${paramIndex}`
    params.push(start)
    paramIndex++
  }

  if (end) {
    whereClause += ` AND mt.transaction_date <= $${paramIndex}`
    params.push(end)
    paramIndex++
  }
  
  const type = getQuery(event).type
  if (type) {
    whereClause += ` AND mt.transaction_type = $${paramIndex}`
    params.push(type)
    paramIndex++
  }

  try {
    const countSql = `
      SELECT COUNT(*) as total 
      FROM material_transactions mt 
      ${whereClause}
    `
    const countResult = await query(countSql, params)
    const total = parseInt(countResult[0]?.total || '0')

    const offset = (page - 1) * limit
    const sortDir = sort === 'asc' ? 'ASC' : 'DESC'
    const dataSql = `
      SELECT 
        mt.id,
        mt.material_id,
        m.name AS material_name,
        m.part_number,
        mt.transaction_type,
        mt.quantity,
        mt.related_unit_id,
        mt.notes,
        mt.reference_doc,
        mt.transaction_date,
        mt.created_by,
        m.unit AS satuan
      FROM material_transactions mt
      JOIN materials m ON m.id = mt.material_id
      ${whereClause}
      ORDER BY mt.transaction_date ${sortDir}, mt.id ${sortDir}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const dataParams = [...params, limit, offset]
    const rows = await query(dataSql, dataParams)

    return {
      data: rows.map((row: any) => ({
        ...row,
        quantity: parseFloat(row.quantity),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error fetching material transactions:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch material transactions' })
  }
})
