import { query } from '~/server/utils/db'

const AURA_STORAGE_URL = process.env.AURA_STORAGE_BASE_URL || 'https://aurastorage.serveer.biz.id'
const AURA_STORAGE_KEY = process.env.AURA_STORAGE_API_KEY || ''

/**
 * Uploads a single image file buffer to AuraStorage and returns the public URL.
 */
async function uploadToAuraStorage(fileData: Buffer, filename: string, mimeType: string): Promise<string> {
  const form = new FormData()
  // TypeScript workaround: construct Uint8Array so it is accepted as a valid BlobPart
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

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart data' })
  }

  let name = ''
  let part_number = ''
  let unit = ''
  let status = ''
  let current_stock = 0
  let notes = ''
  let spesification = ''
  let isCommon = true
  let engines: string[] = []

  // Collect image uploads to process
  const imageItems: { filename: string; data: Buffer; mimeType: string }[] = []

  for (const item of formData) {
    if (item.name === 'name') name = item.data.toString()
    else if (item.name === 'part_number') part_number = item.data.toString()
    else if (item.name === 'unit') unit = item.data.toString()
    else if (item.name === 'status') status = item.data.toString()
    else if (item.name === 'current_stock') current_stock = parseFloat(item.data.toString())
    else if (item.name === 'notes') notes = item.data.toString()
    else if (item.name === 'spesification') spesification = item.data.toString()
    else if (item.name === 'isCommon') isCommon = item.data.toString() === 'true'
    else if (item.name === 'engines') {
      engines.push(item.data.toString())
    }
    else if (item.name === 'images') {
      if (item.filename && item.data.length > 0) {
        imageItems.push({
          filename: item.filename,
          data: item.data,
          mimeType: item.type || 'image/jpeg',
        })
      }
    }
  }

  // Upload semua gambar ke AuraStorage secara paralel
  let uploadedUrls: string[] = []
  if (imageItems.length > 0) {
    try {
      uploadedUrls = await Promise.all(
        imageItems.map(img => uploadToAuraStorage(img.data, img.filename, img.mimeType))
      )
    } catch (uploadError: any) {
      console.error('AuraStorage upload error:', uploadError)
      throw createError({ statusCode: 502, statusMessage: `Gagal mengupload gambar ke cloud storage: ${uploadError.message}` })
    }
  }

  // Simpan URL (bukan nama file lokal) ke database sebagai CSV
  const imagesCSV = uploadedUrls.join(',')

  try {
    const insertSQL = `
      INSERT INTO materials_essential (name, part_number, unit, status, current_stock, notes, spesification, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `
    const values = [name, part_number, unit, status, current_stock, notes, spesification, imagesCSV]
    const row = (await query(insertSQL, values))[0]

    if (!row || !row.id) {
      throw new Error('Failed to get inserted ID')
    }

    const materialId = row.id

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
          [materialId, machine.trim()]
        )
      }
    }

    return { success: true, message: 'Material essential created successfully', id: materialId }
  } catch (error: any) {
    console.error('Error inserting material_essential:', error)
    throw createError({ statusCode: 500, statusMessage: 'Database insertion failed' })
  }
})
