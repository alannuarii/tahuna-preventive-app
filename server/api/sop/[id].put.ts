import { query } from '~/server/utils/db'
import { getCascadedSop, parseJsonField } from '~/server/utils/sopCascade'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const {
    personil_mekanik = 2,
    personil_listrik = 2,
    personil_hse = 1,
    tools,
    apd,
    material,
    risiko,
    persiapan,
    pelaksanaan_mekanik,
    pelaksanaan_listrik,
    penormalan,
    lampiran_formulir = [],
  } = body

  const jumlah_personil = Number(personil_mekanik) + Number(personil_listrik) + Number(personil_hse)

  // Clean form attachments to filter out blank items
  const cleanedFormulir = Array.isArray(lampiran_formulir)
    ? lampiran_formulir
        .map((f: any) => ({
          title: typeof f?.title === 'string' ? f.title.trim() : '',
          path: typeof f?.path === 'string' ? f.path.trim() : ''
        }))
        .filter(f => f.title && f.path)
    : []

  try {
    const sql = `
      UPDATE sop_documents SET
        jumlah_personil = $1,
        personil_mekanik = $2,
        personil_listrik = $3,
        personil_hse = $4,
        tools = $5,
        apd = $6,
        material = $7,
        risiko = $8,
        persiapan = $9,
        pelaksanaan_mekanik = $10,
        pelaksanaan_listrik = $11,
        penormalan = $12,
        lampiran_formulir = $13,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `
    const rows = await query(sql, [
      jumlah_personil,
      personil_mekanik,
      personil_listrik,
      personil_hse,
      JSON.stringify(tools),
      JSON.stringify(apd),
      JSON.stringify(material),
      JSON.stringify(risiko),
      JSON.stringify(persiapan),
      JSON.stringify(pelaksanaan_mekanik),
      JSON.stringify(pelaksanaan_listrik),
      JSON.stringify(penormalan),
      JSON.stringify(cleanedFormulir),
      id,
    ])

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

    const cascaded = await getCascadedSop(doc.mesin, doc.jenis_pm)
    return cascaded || parsedDoc
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update SOP' })
  }
})
