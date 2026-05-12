
import { query } from '../server/utils/db.ts'

async function findVarnishDocs() {
  try {
    const res = await query(`
      SELECT id, mesin, jenis_pm, pelaksanaan_listrik, material 
      FROM sop_documents 
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(pelaksanaan_listrik) AS p 
        WHERE p ILIKE '%pelapisan ulang vernis isolasi%'
      )
    `)
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error(err)
  }
}

findVarnishDocs()
