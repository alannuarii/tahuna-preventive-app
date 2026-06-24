import { query } from '~/server/utils/db'
import ExcelJS from 'exceljs'

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

  // Fetch data
  const sql = `
    SELECT 
      r.tanggal_pelaksanaan,
      r.unit,
      r.jenis_pm
    FROM pm_realizations r
    WHERE r.tanggal_pelaksanaan >= $1 AND r.tanggal_pelaksanaan <= $2
  `
  const realizations = await query(sql, [startStr, endStr])
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
  
  const worksheet = workbook.getWorksheet('Realisasi') || workbook.worksheets[0]

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
      }
    })
  })

  // Fill in the data
  for (const item of realizations) {
    const unit = parseInt(item.unit)
    const date = new Date(item.tanggal_pelaksanaan)
    const day = date.getDate()
    const pm = item.jenis_pm

    const rowNum = unitToRow[unit]
    if (rowNum) {
      // Column E is day 1 (index 5)
      const colNum = day + 4
      const cell = worksheet.getCell(rowNum, colNum)
      
      // If there are multiple PMs on the same day, we can join them
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
    'Content-Disposition': `attachment; filename="Realisasi PM ${monthYearStr}.xlsx"`
  })

  return buffer
})
