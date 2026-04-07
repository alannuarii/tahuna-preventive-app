import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token') || getHeader(event, 'authorization')?.split(' ')[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    return { authenticated: true, user: decoded }
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }
})
