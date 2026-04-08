import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { machine } = getQuery(event)

  try {
    let sql = `
      SELECT 
        mmc.id,
        mmc.machine_name,
        m.id AS material_id,
        m.name AS material_name,
        m.part_number,
        m.unit AS satuan,
        mmc.qty_per_pm,
        mmc.interval_pm,
        COALESCE(mi.current_stock, 0) AS current_stock
      FROM machine_material_configs mmc
      JOIN materials m ON m.id = mmc.material_id
      LEFT JOIN material_inventory mi ON mi.material_id = m.id
    `

    const params: any[] = []

    if (machine) {
      sql += ` WHERE mmc.machine_name = $1`
      params.push(machine)
    }

    sql += ` ORDER BY mmc.machine_name ASC, mmc.interval_pm ASC, m.name ASC`

    const rows = await query(sql, params)

    // Map interval_pm to PM cycle name
    const intervalToCycle: Record<number, string> = {
      250: 'P1/P2',
      500: 'P3',
      1000: 'P4',
      6000: 'P5',
    }

    // Group by machine
    const grouped: Record<string, any[]> = {}
    for (const row of rows) {
      const key = row.machine_name
      if (!grouped[key]) grouped[key] = []
      grouped[key].push({
        ...row,
        qty_per_pm: parseFloat(row.qty_per_pm),
        current_stock: parseFloat(row.current_stock),
        cycle: intervalToCycle[row.interval_pm] || `${row.interval_pm}h`,
      })
    }

    return {
      data: grouped,
      machines: Object.keys(grouped),
    }
  } catch (error) {
    console.error('Error fetching material usage:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch material usage' })
  }
})
