import { query } from '~/server/utils/db'

const AURA_STORAGE_URL = process.env.AURA_STORAGE_BASE_URL || 'https://aurastorage.serveer.biz.id'
const AURA_STORAGE_KEY = process.env.AURA_STORAGE_API_KEY || ''

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

async function uploadToAuraStorage(fileData: Buffer, filename: string, mimeType: string): Promise<string> {
  const form = new FormData()
  const blob = new Blob([new Uint8Array(fileData)], { type: mimeType })
  form.append('file', blob, filename)

  const res = await fetch(`${AURA_STORAGE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AURA_STORAGE_KEY}`,
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`AuraStorage upload failed (${res.status}): ${errText}`)
  }

  const json = await res.json() as { success: boolean; file: { url: string } }
  return json.file.url
}

async function deleteFromAuraStorage(url: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    
    if (filename) {
      await fetch(`${AURA_STORAGE_URL}/api/files/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AURA_STORAGE_KEY}`
        }
      })
      console.log('Successfully deleted old file from AuraStorage:', filename)
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

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart data' })
  }

  let title = ''
  let fileData: Buffer | null = null
  let filename = ''
  let mimeType = ''

  for (const item of formData) {
    if (item.name === 'title') {
      title = item.data.toString().trim()
    } else if (item.name === 'file') {
      if (item.filename && item.data.length > 0) {
        fileData = item.data
        filename = item.filename
        mimeType = item.type || 'application/pdf'
      }
    }
  }

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Document title is required' })
  }

  if (!fileData) {
    throw createError({ statusCode: 400, statusMessage: 'No PDF file uploaded' })
  }

  if (mimeType !== 'application/pdf') {
    throw createError({ statusCode: 400, statusMessage: 'Only PDF files are allowed' })
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

  // Overwrite logic: check if a document with the same title already exists
  const existingDocIndex = documents.findIndex((doc: any) => doc.title.toLowerCase() === title.toLowerCase())
  if (existingDocIndex !== -1) {
    const existingDoc = documents[existingDocIndex]
    console.log(`Document with title "${title}" already exists. Cleaning up old file: ${existingDoc.url}`)
    await deleteFromAuraStorage(existingDoc.url)
    // Remove the old entry
    documents.splice(existingDocIndex, 1)
  }

  // Upload to AuraStorage
  let uploadedUrl = ''
  try {
    const formattedFilename = `pm_${id}_${slugify(title)}.pdf`
    uploadedUrl = await uploadToAuraStorage(fileData, formattedFilename, mimeType)
  } catch (uploadError: any) {
    console.error('AuraStorage upload error:', uploadError)
    throw createError({ statusCode: 502, statusMessage: `Gagal mengupload berkas ke cloud storage: ${uploadError.message}` })
  }

  // Append new document metadata
  const newDoc = {
    title,
    url: uploadedUrl,
    uploaded_at: new Date().toISOString()
  }
  documents.push(newDoc)

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
      message: 'Dokumen berhasil diunggah',
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
