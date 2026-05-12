
import { query } from '../server/utils/db'

async function findMatch() {
  const sopDocs = await query('SELECT DISTINCT mesin FROM sop_documents')
  const unitProfiles = await query('SELECT unit_id, mesin_merek, mesin_tipe FROM units_profile')
  
  console.log('SOP Documents Mesin:')
  console.log(sopDocs.map((d: any) => d.mesin))
  
  console.log('\nUnit Profiles Mesin:')
  unitProfiles.forEach((u: any) => {
    console.log(`Unit ${u.unit_id}: ${u.mesin_merek} ${u.mesin_tipe}`)
  })
}

findMatch()
