import jwt from 'jsonwebtoken';

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  if (match) return match[2];
  return null;
}

export async function GET({ request }: any) {
  const token = getCookie(request, 'auth_token') || request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return new Response(JSON.stringify({ authenticated: true, user: decoded }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }: any) {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  });
}
