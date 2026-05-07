import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { unit, pm } = getQuery(event)

  if (!unit || !pm) {
    throw createError({ statusCode: 400, statusMessage: 'Unit and PM are required' })
  }

  try {
    const res = await query(
      'SELECT public_slug FROM pm_public_links WHERE unit = $1 AND jenis_pm = $2 LIMIT 1',
      [parseInt(unit as string), pm as string]
    )

    if (res.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Slug not found' })
    }

    return { slug: res[0].public_slug }
  } catch (err) {
    console.error('Failed to get public slug:', err)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
