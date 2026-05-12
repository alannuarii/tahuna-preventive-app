
import { query } from '../server/utils/db'

async function inspectSop() {
  try {
    const res = await query(`
      SELECT id, mesin, jenis_pm, pelaksanaan_mekanik, pelaksanaan_listrik 
      FROM sop_documents 
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(material) AS m 
        WHERE m ILIKE '%grease%'
      )
      LIMIT 5
    `)
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error(err)
  }
}

inspectSop()
