import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const intlResponse = intlMiddleware(request);

  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  const locale = pathname.split('/')[1] || routing.defaultLocale;

  const isPublicPath =
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/signup` ||
    pathname === `/${locale}/login/` ||
    pathname === `/${locale}/signup/`;

  const cookieHeader = request.headers.get('cookie') ?? '';
  let isAuthenticated = false;

  if (cookieHeader) {
    try {
      const res = await fetch('http://localhost:8000/api/v1/user', {
        headers: { cookie: cookieHeader },
      });
      isAuthenticated = res.ok;
      const user = await res.json()
      console.log(user)
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    const nextPath = pathname;
    if (nextPath !== `/${locale}/login` && nextPath !== `/${locale}/signup`) {
      loginUrl.searchParams.set('next', nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL(`/${locale}/invoices`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};