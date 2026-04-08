import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { search, sort } = getQuery(event)

  try {
    let sql = `
      SELECT 
        m.id,
        m.name,
        m.part_number,
        m.unit AS satuan,
        COALESCE(mi.current_stock, 0) AS current_stock,
        mi.updated_at AS stock_updated_at
      FROM materials m
      LEFT JOIN material_inventory mi ON mi.material_id = m.id
    `

    const params: any[] = []
    let paramIndex = 1

    if (search) {
      sql += ` WHERE (m.name ILIKE $${paramIndex} OR m.part_number ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Sorting
    const sortMap: Record<string, string> = {
      name_asc: 'm.name ASC',
      name_desc: 'm.name DESC',
      stock_asc: 'current_stock ASC',
      stock_desc: 'current_stock DESC',
    }
    const orderBy = sortMap[sort as string] || 'm.name ASC'
    sql += ` ORDER BY ${orderBy}`

    const rows = await query(sql, params)

    return {
      data: rows.map((row: any) => ({
        ...row,
        current_stock: parseFloat(row.current_stock),
      })),
    }
  } catch (error) {
    console.error('Error fetching material inventory:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch material inventory' })
  }
})
