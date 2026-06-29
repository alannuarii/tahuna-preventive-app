export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' })
  }
  
  // Validate that the URL is from aurastorage.serveer.biz.id to prevent open proxy vulnerability
  if (!url.startsWith('https://aurastorage.serveer.biz.id/')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL origin' })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: `Failed to fetch template from Aurastorage: ${response.statusText}` })
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Access-Control-Allow-Origin': '*' // Optional, but since we are calling from same-origin, it is safe
    })
    
    return buffer
  } catch (error: any) {
    console.error('Template proxy error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Error fetching template' })
  }
})
