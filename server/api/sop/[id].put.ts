import { query } from '~/server/utils/db'

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
  } = body

  const jumlah_personil = Number(personil_mekanik) + Number(personil_listrik) + Number(personil_hse)

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
        updated_at = NOW()
      WHERE id = $13
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
      id,
    ])

    if (rows.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'SOP not found' })
    }

    return rows[0]
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating SOP:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update SOP' })
  }
})
