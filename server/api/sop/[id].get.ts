import { query } from '~/server/utils/db'
import { getCascadedSop, parseJsonField } from '~/server/utils/sopCascade'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { raw } = getQuery(event)

  try {
    const rows = await query('SELECT * FROM sop_documents WHERE id = $1', [id])
    if (rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'SOP not found' })
    }
    const doc = rows[0]

    const parsedDoc = {
      ...doc,
      tools: parseJsonField(doc.tools),
      apd: parseJsonField(doc.apd),
      material: parseJsonField(doc.material),
      risiko: parseJsonField(doc.risiko),
      persiapan: parseJsonField(doc.persiapan),
      pelaksanaan_mekanik: parseJsonField(doc.pelaksanaan_mekanik),
      pelaksanaan_listrik: parseJsonField(doc.pelaksanaan_listrik),
      penormalan: parseJsonField(doc.penormalan),
    }

    if (raw === 'true') {
      return parsedDoc
    }

    const cascaded = await getCascadedSop(doc.mesin, doc.jenis_pm)
    return cascaded || parsedDoc
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch SOP' })
  }
})
