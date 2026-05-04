import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const rows = await query('SELECT * FROM sop_documents WHERE id = $1', [id])
    if (rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'SOP not found' })
    }
    return rows[0]
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch SOP' })
  }
})
