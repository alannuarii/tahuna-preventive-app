import { query } from '~/server/utils/db'

const AURA_STORAGE_URL = process.env.AURA_STORAGE_BASE_URL || 'https://aurastorage.serveer.biz.id'
const AURA_STORAGE_KEY = process.env.AURA_STORAGE_API_KEY || ''

async function deleteFromAuraStorage(url: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    
    if (filename) {
      const res = await fetch(`${AURA_STORAGE_URL}/api/files/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AURA_STORAGE_KEY}`
        }
      })
      if (res.ok) {
        console.log('Successfully deleted file from AuraStorage:', filename)
      } else {
        console.warn(`AuraStorage delete request returned status ${res.status}`)
      }
    }
  } catch (e) {
    console.error('Failed to delete cloud image:', url, e)
  }
}

export default defineEventHandler(async (event) => {
  const idStr = getRouterParam(event, 'id')
  if (!idStr || isNaN(parseInt(idStr))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid realization ID' })
  }
  const id = parseInt(idStr)

  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'Document URL is required' })
  }

  // Fetch the realization record
  const realizations = await query(`SELECT * FROM pm_realizations WHERE id = $1`, [id])
  if (realizations.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Realization not found' })
  }
  const realization = realizations[0]

  // Parse existing documents list
  let documents: any[] = []
  if (realization.dokumen_pdf) {
    if (typeof realization.dokumen_pdf === 'string') {
      try {
        documents = JSON.parse(realization.dokumen_pdf)
      } catch {
        documents = []
      }
    } else if (Array.isArray(realization.dokumen_pdf)) {
      documents = realization.dokumen_pdf
    }
  }

  // Find the document to delete
  const docIndex = documents.findIndex((doc: any) => doc.url === url)
  if (docIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found in this realization' })
  }

  // Delete from AuraStorage
  await deleteFromAuraStorage(url)

  // Remove from array
  documents.splice(docIndex, 1)

  // Update in database
  try {
    await query(
      `UPDATE pm_realizations SET dokumen_pdf = $1 WHERE id = $2`,
      [JSON.stringify(documents), id]
    )

    // Fetch updated materials list to return complete realization details
    const materials = await query(`SELECT * FROM pm_realization_materials WHERE realization_id = $1 ORDER BY id`, [id])
    return {
      success: true,
      message: 'Dokumen berhasil dihapus',
      data: {
        ...realization,
        dokumen_pdf: documents,
        materials
      }
    }
  } catch (dbError: any) {
    console.error('Database update error:', dbError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update database record' })
  }
})
