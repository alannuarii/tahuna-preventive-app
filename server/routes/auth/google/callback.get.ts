import { google } from 'googleapis'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'No code provided' })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    })

    const { data } = await oauth2.userinfo.get()

    if (data.email !== 'daengpython@gmail.com') {
      const FRONTEND_URL = process.env.FRONTEND_URL || getRequestURL(event).origin
      return sendRedirect(event, `${FRONTEND_URL}/login?error=unauthorized_email`, 302)
    }

    const user = {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    }

    const token = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '100y' })

    const FRONTEND_URL = process.env.FRONTEND_URL || getRequestURL(event).origin

    const maxAgeSeconds = 100 * 365 * 24 * 60 * 60 // 100 years
    setCookie(event, 'auth_token', token, {
      path: '/',
      maxAge: maxAgeSeconds,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return sendRedirect(event, `${FRONTEND_URL}/login/success?token=${token}`, 302)

  } catch (error) {
    console.error('Error during auth:', error)
    const FRONTEND_URL = process.env.FRONTEND_URL || getRequestURL(event).origin
    return sendRedirect(event, `${FRONTEND_URL}/login?error=auth_failed`, 302)
  }
})
