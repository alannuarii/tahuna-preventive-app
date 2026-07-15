import { query } from '~/server/utils/db'
import { getCascadedSop, parseJsonField, getLampiranFormulir } from '~/server/utils/sopCascade'

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
      lampiran_formulir: parseJsonField(doc.lampiran_formulir),
    }

    if (raw === 'true') {
      let forms = parsedDoc.lampiran_formulir
      if (!forms || forms.length === 0) {
        const cascaded = await getCascadedSop(doc.mesin, doc.jenis_pm)
        forms = cascaded ? cascaded.lampiran_formulir : getLampiranFormulir([doc])
      }
      return {
        ...parsedDoc,
        lampiran_formulir: forms
      }
    }

    const cascaded = await getCascadedSop(doc.mesin, doc.jenis_pm)
    return cascaded || parsedDoc
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch SOP' })
  }
})
