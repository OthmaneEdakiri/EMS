import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const hasSession = request.cookies.has('laravel_session')

  if (hasSession) {
    const userLocale = request.cookies.get('user_locale')?.value
    if (userLocale && routing.locales.includes(userLocale as any)) {
      request.cookies.set('NEXT_LOCALE', userLocale)
    }
  }

  const intlResponse = intlMiddleware(request)

  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  const locale = pathname.split('/')[1] || routing.defaultLocale
  const isPublicPath =
    pathname === `/${locale}/login` || pathname === `/${locale}/signup`

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    if (pathname !== `/${locale}/login` && pathname !== `/${locale}/signup`) {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL(`/${locale}/invoices`, request.url))
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
