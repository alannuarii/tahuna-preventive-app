import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const method = getMethod(event)
  
  // We only restrict modifying requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // Check if path starts with /api/ to only guard API routes
    // Or guard everything, but it's usually API routes we care about
    const path = getRequestURL(event).pathname
    if (path.startsWith('/api/')) {
      const token = getCookie(event, 'auth_token')
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
          if (decoded && decoded.role === 'guest') {
            throw createError({
              statusCode: 403,
              statusMessage: 'Guest users are not allowed to modify data.'
            })
          }
        } catch (e) {
          // Token verification failed or error thrown
          if (e && typeof e === 'object' && 'statusCode' in e && (e as any).statusCode === 403) {
             throw e
          }
          // If it's just invalid token, we might ignore or let other auth middleware handle it
        }
      }
    }
  }
})
