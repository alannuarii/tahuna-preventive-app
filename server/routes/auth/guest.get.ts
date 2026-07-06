import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const user = {
    id: 'guest',
    email: 'guest@plntahuna',
    name: 'Guest User',
    role: 'guest'
  }

  const token = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '100y' })

  const maxAgeSeconds = 100 * 365 * 24 * 60 * 60 // 100 years
  setCookie(event, 'auth_token', token, {
    path: '/',
    maxAge: maxAgeSeconds,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const FRONTEND_URL = process.env.FRONTEND_URL || getRequestURL(event).origin
  return sendRedirect(event, `${FRONTEND_URL}/login/success?token=${token}`, 302)
})
