
import { query } from '../server/utils/db'

async function checkSlug() {
  const slug = 'Q9dmzEhev4ZcEGSbLerE'
  try {
    const res = await query('SELECT * FROM pm_public_links WHERE public_slug = $1', [slug])
    console.log('Mapping found:', JSON.stringify(res, null, 2))
    
    const all = await query('SELECT * FROM pm_public_links LIMIT 5')
    console.log('First 5 links:', JSON.stringify(all, null, 2))
  } catch (err) {
    console.error(err)
  }
}

checkSlug()
