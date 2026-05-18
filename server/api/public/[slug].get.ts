import { query } from '~/server/utils/db'
import { generatePMSchedule } from '~/server/utils/pmSchedule'
import { getCascadedSop } from '~/server/utils/sopCascade'


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

    // 2. Fetch data needed for schedule generation
    const sqlUnits = `
      SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
        SELECT unit, overhaul, ganti_oli
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `
    const [unitsData, cycles, downtimes, engineProfiles] = await Promise.all([
      query(sqlUnits),
      query(`SELECT min_hours as min, max_hours as max, pm_type as pm FROM pm_cycle_definitions ORDER BY min_hours ASC`),
      query('SELECT unit, status, start_date, end_date FROM engine_downtime'),
      query('SELECT unit_id as unit, mesin_merek, mesin_tipe FROM units_profile')
    ])
    
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
    const schedule = generatePMSchedule(unitsData, cycles, null, null, downtimes, averages)

    // Find the first upcoming schedule event matching unit and jenis_pm
    const matchedEvent = schedule.find((evt: any) => {
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
    const engineEntry = engineProfiles.find((e: any) => e.unit === unit)
    const mesinName = engineEntry ? `${engineEntry.mesin_merek} ${engineEntry.mesin_tipe}` : ''

    let selectedSop = null
    if (mesinName) {
      selectedSop = await getCascadedSop(mesinName, jenis_pm)
    }

    // 4. Fetch related public slugs for same unit for public SOP navigation links
    const publicLinks = await query(
      'SELECT public_slug, jenis_pm FROM pm_public_links WHERE unit = $1',
      [unit]
    )
    const related_slugs: Record<string, string> = {}
    for (const pl of publicLinks) {
      related_slugs[pl.jenis_pm] = pl.public_slug
    }

    return {
      eventData,
      selectedSop: selectedSop ? { ...selectedSop, related_slugs } : null,
      mesin: mesinName
    }

  } catch (err) {
    console.error('Public API Error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve public PM data' })
  }
})
