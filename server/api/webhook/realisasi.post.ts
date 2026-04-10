import { query } from '~/server/utils/db'
import { parseWhatsAppReport } from '~/utils/waReportParser'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Asumsikan payload dari n8n dsb memiliki porsi yang memuat pesan text, misal di `body.message` atau `body.text`.
    // Kita juga support jika dikirimkan body raw text.
    let textToParse = ''
    if (typeof body === 'object' && body !== null) {
      // Coba cari field yang memungkinkan
      textToParse = body.message || body.text || body.body || JSON.stringify(body)
    } else if (typeof body === 'string') {
      textToParse = body
    }
    
    if (!textToParse) {
      throw createError({
        statusCode: 400,
        message: 'Payload tidak ditemukan atau kosong. Harap kirimkan pesan pada field "message", "text", atau sebagai raw string.'
      })
    }
    
    // Parse the WA report
    const parseResult = parseWhatsAppReport(textToParse)
    
    // Cek kriteria: parser harus menemukan unit, tanggal, dan jenis_pm (P1-P5)
    if (!parseResult.unit || !parseResult.tanggal || !parseResult.jenisPm) {
      throw createError({
        statusCode: 400,
        message: 'Pesan ditolak: Format tidak sesuai kriteria aplikasi. Pastikan Tanggal, Unit, dan Jenis PM tertera.'
      })
    }
    
    // Simpan ke notification table
    // Jika body adalah object, kita simpan the original object text/json. Jika string kita simpan stringnya.
    const payloadToSave = typeof body === 'object' ? JSON.stringify(body) : String(textToParse)
    
    const result = await query(
      `INSERT INTO pm_notifications (payload, is_read) VALUES ($1, false) RETURNING id`,
      [payloadToSave]
    )
    
    return {
      success: true,
      message: 'Pesan diterima dan tersimpan di notifikasi',
      id: result[0]?.id
    }
  } catch (error: any) {
    console.error('Webhook Error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message
    })
  }
})
