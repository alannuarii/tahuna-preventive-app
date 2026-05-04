import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { mesin, jenis_pm } = getQuery(event)

  let sql = 'SELECT * FROM sop_documents'
  const params: any[] = []
  const conditions: string[] = []

  if (mesin) {
    conditions.push(`mesin = $${params.length + 1}`)
    params.push(mesin)
  }
  if (jenis_pm) {
    conditions.push(`jenis_pm = $${params.length + 1}`)
    params.push(jenis_pm)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY mesin, jenis_pm'

  try {
    const rows = await query(sql, params)
    return rows
  } catch (error) {
    console.error('Error fetching SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch SOP data' })
  }
})
