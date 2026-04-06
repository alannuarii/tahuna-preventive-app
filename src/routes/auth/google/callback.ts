import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

export async function GET({ request }: any) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();

    if (data.email !== 'daengpython@gmail.com') {
      const FRONTEND_URL = process.env.FRONTEND_URL || url.origin;
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${FRONTEND_URL}/login?error=unauthorized_email` }
      });
    }

    const user = {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };

    const token = jwt.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '100y' });

    // Since this is a monolith, FRONTEND_URL can be the origin
    const FRONTEND_URL = process.env.FRONTEND_URL || url.origin;

    const maxAgeSeconds = 100 * 365 * 24 * 60 * 60; // 100 years
    const cookieStr = `auth_token=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${FRONTEND_URL}/login/success?token=${token}`,
        'Set-Cookie': cookieStr
      }
    });

  } catch (error) {
    console.error('Error during auth:', error);
    const FRONTEND_URL = process.env.FRONTEND_URL || url.origin;
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${FRONTEND_URL}/login?error=auth_failed` }
    });
  }
}
