import { query } from '~/server/utils/db'

const AURA_STORAGE_URL = process.env.AURA_STORAGE_BASE_URL || 'https://aurastorage.serveer.biz.id'
const AURA_STORAGE_KEY = process.env.AURA_STORAGE_API_KEY || ''

/**
 * Uploads a single image file buffer to AuraStorage and returns the public URL.
 */
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

/**
 * Deletes an image from AuraStorage by url
 */
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
    }
  } catch (e) {
    console.error('Failed to delete cloud image:', url, e)
  }
}

export default defineEventHandler(async (event) => {
  const idStr = getRouterParam(event, 'id')
  if (!idStr || isNaN(parseInt(idStr))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid material ID' })
  }
  const id = parseInt(idStr)

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart data' })
  }

  let name = ''
  let part_number = ''
  let unit = ''
  let status = ''
  let notes = ''
  let spesification = ''
  let isCommon = true
  let engines: string[] = []
  let existingImagesStr = ''

  // Collect image uploads to process
  const newImageItems: { filename: string; data: Buffer; mimeType: string }[] = []

  for (const item of formData) {
    if (item.name === 'name') name = item.data.toString()
    else if (item.name === 'part_number') part_number = item.data.toString()
    else if (item.name === 'unit') unit = item.data.toString()
    else if (item.name === 'status') status = item.data.toString()
    else if (item.name === 'notes') notes = item.data.toString()
    else if (item.name === 'spesification') spesification = item.data.toString()
    else if (item.name === 'isCommon') isCommon = item.data.toString() === 'true'
    else if (item.name === 'existing_images') existingImagesStr = item.data.toString()
    else if (item.name === 'engines') {
      engines.push(item.data.toString())
    }
    else if (item.name === 'images') {
      if (item.filename && item.data.length > 0) {
        newImageItems.push({
          filename: item.filename,
          data: item.data,
          mimeType: item.type || 'image/jpeg',
        })
      }
    }
  }

  // Handle images: what to keep, what to delete
  const oldRec = await query(`SELECT images FROM materials_essential WHERE id = $1`, [id])
  if (oldRec.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Material tidak ditemukan' })
  }
  
  const oldImagesCsv = oldRec[0].images || ''
  const oldImages = oldImagesCsv.split(',').map((u:string) => u.trim()).filter(Boolean)
  const keptImages = existingImagesStr.split(',').map(u => u.trim()).filter(Boolean)
  
  // Find images that were removed
  const imagesToDelete = oldImages.filter((o: string) => !keptImages.includes(o))
  for (const url of imagesToDelete) {
    await deleteFromAuraStorage(url)
  }

  // Upload new images
  let uploadedUrls: string[] = []
  if (newImageItems.length > 0) {
    try {
      uploadedUrls = await Promise.all(
        newImageItems.map(img => uploadToAuraStorage(img.data, img.filename, img.mimeType))
      )
    } catch (uploadError: any) {
      console.error('AuraStorage upload error:', uploadError)
      throw createError({ statusCode: 502, statusMessage: `Gagal mengupload gambar ke cloud storage: ${uploadError.message}` })
    }
  }

  const finalImagesCSV = [...keptImages, ...uploadedUrls].join(',')

  try {
    const updateSQL = `
      UPDATE materials_essential
      SET name = $1, part_number = $2, unit = $3, status = $4, notes = $5, spesification = $6, images = $7
      WHERE id = $8
    `
    const values = [name, part_number, unit, status, notes, spesification, finalImagesCSV, id]
    await query(updateSQL, values)

    // Update engines: remove all old, insert new
    await query(`DELETE FROM material_essential_engines WHERE material_id = $1`, [id])

    if (!isCommon && engines.length > 0) {
      const engineList: string[] = []
      for (const eStr of engines) {
        const splitStr = eStr.split(',')
        engineList.push(...splitStr)
      }

      for (const machine of engineList) {
        if (!machine.trim()) continue
        await query(
          `INSERT INTO material_essential_engines (material_id, machine_type) VALUES ($1, $2)`,
          [id, machine.trim()]
        )
      }
    }

    return { success: true, message: 'Material essential berhasil diperbarui' }
  } catch (error: any) {
    console.error('Error updating material_essential:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database update failed' })
  }
})
