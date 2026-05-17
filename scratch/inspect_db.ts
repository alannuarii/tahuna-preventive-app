
import { query } from '../server/utils/db'

async function listTables() {
  try {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('Tables:', tables.map(t => t.table_name))

    for (const table of tables) {
      const columns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table.table_name])
      console.log(`\nTable: ${table.table_name}`)
      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`))
    }
  } catch (err) {
    console.error(err)
  }
}

listTables()
