import { query } from '~/server/utils/db'
import fs from 'fs'
import path from 'path'

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
  let uploadedFileNames: string[] = []

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'materials')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

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
        const ext = path.extname(item.filename) || '.jpg'
        const baseName = item.filename.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
        const finalName = `${baseName}_${Date.now()}${ext}`
        const filePath = path.join(uploadDir, finalName)

        fs.writeFileSync(filePath, item.data)
        uploadedFileNames.push(finalName)
      }
    }
  }

  const imagesCSV = uploadedFileNames.join(',')

  try {
    const insertSQL = `
      INSERT INTO materials_essential (name, part_number, unit, status, current_stock, notes, spesification, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `
    const values = [name, part_number, unit, status, current_stock, notes, spesification, imagesCSV]
    const row = (await query(insertSQL, values))[0]
    
    if (!row || !row.id) {
       throw new Error("Failed to get inserted ID")
    }
    
    const materialId = row.id

    if (!isCommon && engines.length > 0) {
      const engineList: string[] = []
      for (const eStr of engines) {
        // eStr might be "A,B,C" because of form checkboxes representing multiple units
        const splitStr = eStr.split(',')
        engineList.push(...splitStr)
      }
      
      for (const machine of engineList) {
        if (!machine.trim()) continue;
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
