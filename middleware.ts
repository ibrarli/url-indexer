import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const expectedUser = process.env.BASIC_AUTH_USER;
    const expectedPass = process.env.BASIC_AUTH_PASS;

    if (user === expectedUser && pwd === expectedPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Indexing Engine"',
    },
  });
}

// Protect all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};