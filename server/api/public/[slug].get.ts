import { query } from '~/server/utils/db'
import { generatePMSchedule } from '~/server/utils/pmSchedule'

const engines = [
  { unit: 1, mesin: "SWD 6FHD 240" },
  { unit: 4, mesin: "Deutz MWM TBD 616 V12" },
  { unit: 5, mesin: "Deutz MWM TBD 616 V12" },
  { unit: 6, mesin: "Mitsubishi S16R-PTA-S" },
  { unit: 7, mesin: "Mitsubishi S16R-PTA-S" },
  { unit: 8, mesin: "Cummins KTA50-G8" },
  { unit: 9, mesin: "Cummins KTA50-G8" },
]

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  try {
    // 1. Look up mapping by slug
    const mappingRes = await query(
      'SELECT unit, jenis_pm FROM pm_public_links WHERE public_slug = $1 LIMIT 1',
      [slug]
    )

    if (mappingRes.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Public link not found' })
    }

    const { unit, jenis_pm } = mappingRes[0]

    // 2. Fetch schedule data to generate dynamic event hours and dates
    const sqlUnits = `
      SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
        SELECT unit, overhaul, ganti_oli
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `
    const unitsData = await query(sqlUnits)
    const downtimes = await query('SELECT unit, status, start_date, end_date FROM engine_downtime')
    
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

    // Generate schedule
    const schedule = generatePMSchedule(unitsData, null, null, downtimes, averages)

    // Find the first upcoming schedule event matching unit and jenis_pm
    const matchedEvent = schedule.find(evt => {
      const pmClean = evt.extendedProps?.unit === unit && evt.title.startsWith(jenis_pm)
      return pmClean
    })

    // Prepare default event details if no active schedule exists
    const eventData = matchedEvent ? {
      unit: matchedEvent.extendedProps.unit,
      pm: jenis_pm,
      currentHours: matchedEvent.extendedProps.currentHours,
      targetHours: matchedEvent.extendedProps.targetHours,
      timeToGo: matchedEvent.extendedProps.daysFromToday,
      tanggalPM: matchedEvent.start
    } : {
      unit: unit,
      pm: jenis_pm,
      currentHours: 0,
      targetHours: 125,
      timeToGo: 0,
      tanggalPM: new Date().toISOString().slice(0, 10)
    }

    // 3. Fetch corresponding SOP Document
    const engineEntry = engines.find(e => e.unit === unit)
    const mesinName = engineEntry?.mesin || ''

    let selectedSop = null
    if (mesinName) {
      const sopRes = await query(
        'SELECT * FROM sop_documents WHERE mesin = $1 AND jenis_pm = $2 LIMIT 1',
        [mesinName, jenis_pm]
      )
      if (sopRes.length > 0) {
        selectedSop = sopRes[0]
      }
    }

    return {
      eventData,
      selectedSop,
      mesin: mesinName
    }

  } catch (err) {
    console.error('Public API Error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve public PM data' })
  }
})
