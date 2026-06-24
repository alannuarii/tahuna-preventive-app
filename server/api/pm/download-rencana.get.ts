import { query } from '~/server/utils/db'
import ExcelJS from 'exceljs'
import { generatePMSchedule } from '~/server/utils/pmSchedule'

const monthNames = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
]

const unitToRow: Record<number, number> = {
  1: 9,
  4: 11,
  5: 13,
  6: 15,
  7: 17,
  8: 19,
  9: 21
}

export default defineEventHandler(async (event) => {
  const { month, year } = getQuery(event)
  
  if (!month || !year) {
    throw createError({ statusCode: 400, statusMessage: 'Month and year are required' })
  }

  const m = parseInt(month as string)
  const y = parseInt(year as string)
  const monthName = monthNames[m - 1]
  
  const lastDay = new Date(y, m, 0).getDate()
  
  const startStr = `${y}-${String(m).padStart(2, '0')}-01`
  const endStr = `${y}-${String(m).padStart(2, '0')}-${lastDay}`

  // Fetch base data for schedule generation
  const sqlQuery = `
    SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
      SELECT unit, overhaul, ganti_oli
      FROM service_hour
      ORDER BY id DESC
      LIMIT 7
    ) AS subquery
    ORDER BY unit ASC;
  `
  const units = await query(sqlQuery)
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

  // Generate schedule
  const schedule = generatePMSchedule(units, cycles, startStr, endStr, downtimes, averages)

  // Load template
  const templateUrl = 'https://aurastorage.serveer.biz.id/api/files/602d3863-5085-42e1-9b38-cad9ec3ee13c.xlsx'
  const response = await fetch(templateUrl)
  if (!response.ok) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch template from Aurastorage' })
  }
  const arrayBuffer = await response.arrayBuffer()
  const templateBuffer = Buffer.from(arrayBuffer) as any

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer)
  
  // We'll try to get 'Rencana' if it exists, otherwise use 'Realisasi' or first sheet
  const worksheet = workbook.getWorksheet('Rencana') || workbook.getWorksheet('Realisasi') || workbook.worksheets[0]

  const monthYearStr = `${monthName} ${y}`

  // Replace text in the sheet
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string') {
        if (cell.value.includes('MOUNT YEAR')) {
          cell.value = cell.value.replace(/MOUNT YEAR/g, monthYearStr)
        }
        if (cell.value.includes('MONTH')) {
          cell.value = cell.value.replace(/MONTH/g, monthYearStr)
        }
        if (cell.value.includes('Realisasi PM')) {
          cell.value = cell.value.replace(/Realisasi PM/g, 'Rencana PM')
        }
        if (cell.value.includes('REALISASI PREVENTIVE MAINTENANCE')) {
          cell.value = cell.value.replace(/REALISASI PREVENTIVE MAINTENANCE/g, 'RENCANA PREVENTIVE MAINTENANCE')
        }
      }
    })
  })

  // Fill in the data
  for (const item of schedule) {
    const unit = parseInt(item.extendedProps.unit)
    const date = new Date(item.start)
    const day = date.getDate()
    const pm = item.title.split(' ')[0]

    const rowNum = unitToRow[unit]
    if (rowNum) {
      // Column E is day 1 (index 5)
      const colNum = day + 4
      const cell = worksheet.getCell(rowNum, colNum)
      
      if (cell.value) {
        cell.value = `${cell.value}, ${pm}`
      } else {
        cell.value = pm
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()

  setResponseHeaders(event, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="Rencana PM ${monthYearStr}.xlsx"`
  })

  return buffer
})
