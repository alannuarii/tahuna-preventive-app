import { query } from '~/server/utils/db'

const AURA_STORAGE_URL = process.env.AURA_STORAGE_BASE_URL || 'https://aurastorage.serveer.biz.id'
const AURA_STORAGE_KEY = process.env.AURA_STORAGE_API_KEY || ''

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(parseInt(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid material ID' })
  }

  try {
    // 0. Ambil record material untuk mendapatkan daftar image URLs
    const materialData = await query(`SELECT images FROM materials_essential WHERE id = $1`, [parseInt(id)])
    if (materialData.length > 0) {
      const imagesCsv = materialData[0].images
      if (imagesCsv) {
        const imageUrls = imagesCsv.split(',').map((u: string) => u.trim()).filter(Boolean)
        
        // Hapus tiap gambar di AuraStorage
        for (const url of imageUrls) {
          try {
            // Asumsi format url: .../api/files/nama-file.jpg
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
              console.log(`Berhasil menghapus gambar cloud: ${filename}`)
            }
          } catch (delErr) {
            console.error('Gagal menghapus gambar di AuraStorage (mungkin bukan resouce cloud):', url, delErr)
          }
        }
      }
    }

    // 1. Hapus dependencies: engines
    await query(`DELETE FROM material_essential_engines WHERE material_id = $1`, [parseInt(id)])
    
    // 2. Hapus dependencies: transactions
    await query(`DELETE FROM material_essential_transactions WHERE material_id = $1`, [parseInt(id)])

    // 3. Hapus data utama
    const result = await query(`DELETE FROM materials_essential WHERE id = $1 RETURNING id`, [parseInt(id)])

    if (result.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Material not found' })
    }

    return {
      success: true,
      message: 'Material berhasil dihapus dari database'
    }
  } catch (error: any) {
    console.error('Error deleting material:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus material' })
  }
})
