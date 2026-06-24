import { query } from '~/server/utils/db'
import { generatePMSchedule } from '~/server/utils/pmSchedule'

export default defineEventHandler(async (event) => {
  const { search, sort } = getQuery(event)

  try {
    const sql = `
      SELECT 
        m.id,
        m.name,
        m.part_number,
        m.unit AS satuan,
        COALESCE(mi.current_stock, 0) AS current_stock,
        COALESCE(mi.lead_time_days, 30) AS lead_time_days,
        mi.updated_at AS stock_updated_at
      FROM materials m
      LEFT JOIN material_inventory mi ON mi.material_id = m.id
    `

    const params: any[] = []
    let paramIndex = 1
    let querySql = sql

    if (search) {
      querySql += ` WHERE (m.name ILIKE $${paramIndex} OR m.part_number ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    const rows = await query(querySql, params)

    // Dynamic ROP/ROQ Calculations using the calendar PM schedule generator
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const end = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000)
    const endStr = end.toISOString().slice(0, 10)

    const unitsQuery = `
      SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
        SELECT unit, overhaul, ganti_oli
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `
    const units = await query(unitsQuery)
    const cycles = await query(`SELECT min_hours as min, max_hours as max, pm_type as pm FROM pm_cycle_definitions ORDER BY min_hours ASC`)
    const downtimes = await query(`SELECT unit, status, start_date, end_date FROM engine_downtime`)
    
    let averages = []
    try {
      averages = await query(`
        SELECT unit, AVG(CAST(jam_kerja AS NUMERIC)) as avg_jam_kerja
        FROM pengusahaan_harian
        WHERE waktu >= CURRENT_DATE - INTERVAL '90 days'
          AND unit IN ('1', '4', '5')
        GROUP BY unit
      `)
    } catch (e) {
      console.error("Failed to fetch historical averages:", e)
    }

    const schedules = generatePMSchedule(units, cycles, todayStr, endStr, downtimes, averages)

    // Load configs
    const configs = await query(`
      SELECT mmc.material_id, mmc.unit, mmc.qty_per_pm, mmc.interval_pm
      FROM machine_material_configs mmc
    `)

    const intervalToCycle: Record<number, string> = {
      125: 'P1',
      250: 'P2',
      500: 'P3',
      1500: 'P4',
      3000: 'P5',
    }

    const cycleToLevel: Record<string, number> = {
      'P1': 1,
      'P2': 2,
      'P3': 3,
      'P4': 4,
      'P5': 5,
    }

    const configMap = new Map<number, Array<{ unit: number, qty: number, level: number }>>()
    configs.forEach((c: any) => {
      const matId = parseInt(c.material_id)
      if (!configMap.has(matId)) {
        configMap.set(matId, [])
      }
      configMap.get(matId)!.push({
        unit: parseInt(c.unit),
        qty: parseFloat(c.qty_per_pm),
        level: cycleToLevel[intervalToCycle[c.interval_pm]] || 1,
      })
    })

    let enriched = rows.map((row: any) => {
      const matId = parseInt(row.id)
      const currentStock = parseFloat(row.current_stock)
      const matConfigs = configMap.get(matId) || []

      let demand30 = 0
      let demand45 = 0
      let demand90 = 0

      schedules.forEach((sched: any) => {
        const schedUnit = sched.extendedProps.unit
        const titleMatch = sched.title.match(/P(\d)/i)
        if (!titleMatch) return
        const schedLevel = parseInt(titleMatch[1])
        
        // Find matching configs for this unit and scheduled PM level
        const matching = matConfigs.filter(c => c.unit === schedUnit && schedLevel >= c.level)
        const daysFromToday = sched.extendedProps.daysFromToday
        
        matching.forEach(c => {
          if (daysFromToday <= 30) demand30 += c.qty
          if (daysFromToday <= 45) demand45 += c.qty
          if (daysFromToday <= 90) demand90 += c.qty
        })
      })

      const ss = demand45 - demand30
      const rop = demand45
      const roq = demand90 * 1.05

      let status = 'SAFE'
      if (rop > 0) {
        if (currentStock <= ss) {
          status = 'CRITICAL'
        } else if (currentStock <= rop) {
          status = 'REORDER'
        }
      }

      return {
        ...row,
        current_stock: currentStock,
        ss,
        rop,
        roq: parseFloat(roq.toFixed(2)),
        rop_status: status,
      }
    })

    // In-memory Sorting
    const sortMap: Record<string, (a: any, b: any) => number> = {
      name_asc: (a, b) => a.name.localeCompare(b.name),
      name_desc: (a, b) => b.name.localeCompare(a.name),
      stock_asc: (a, b) => a.current_stock - b.current_stock,
      stock_desc: (a, b) => b.current_stock - a.current_stock,
      rop_status_desc: (a, b) => {
        const weight: Record<string, number> = { 'CRITICAL': 3, 'REORDER': 2, 'SAFE': 1 }
        const weightA = weight[a.rop_status] || 1
        const weightB = weight[b.rop_status] || 1
        if (weightB !== weightA) return weightB - weightA
        // fallback to stock ratio or name
        return a.name.localeCompare(b.name)
      }
    }

    const sortFn = sortMap[sort as string] || sortMap.rop_status_desc
    enriched.sort(sortFn)

    return {
      data: enriched,
    }
  } catch (error) {
    console.error('Error fetching material inventory:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch material inventory' })
  }
})
