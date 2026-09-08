import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { createAxiosServer } from "./lib/axios";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const intlResponse = intlMiddleware(request);

  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  const rawLocale = pathname.split("/")[1];
  const locale =
    rawLocale && routing.locales.includes(rawLocale as any)
      ? rawLocale
      : routing.defaultLocale;

  const isPublicPath =
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/signup` ||
    pathname === `/${locale}/login/` ||
    pathname === `/${locale}/signup/` ||
    pathname === `/${locale}/force-change-password` ||
    pathname === `/${locale}/force-change-password/`;

  const isForceChangePath =
    pathname === `/${locale}/force-change-password` ||
    pathname === `/${locale}/force-change-password/`;

  let isAuthenticated = false;
  let mustChangePassword = false;

  const token = request.cookies.get("access_token")?.value;

  if (token) {
    try {
      const axiosServer = await createAxiosServer(token);
      const res = await axiosServer.get("/user/me");
      isAuthenticated = res.status === 200;

      if (isAuthenticated) {
        mustChangePassword = res.data.must_change_password;
        const tenantLocale = res.data.tenant_locale;
        if (locale !== tenantLocale) {
          const newPathname = pathname.replace(`/${locale}`, `/${tenantLocale}`);
          return NextResponse.redirect(new URL(newPathname, request.url));
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && mustChangePassword && !isForceChangePath) {
    return NextResponse.redirect(
      new URL(`/${locale}/force-change-password`, request.url),
    );
  }

  if (isAuthenticated && isPublicPath && !isForceChangePath) {
    return NextResponse.redirect(new URL(`/${locale}/invoices`, request.url));
  }

  if (isAuthenticated && !mustChangePassword && isForceChangePath) {
    return NextResponse.redirect(new URL(`/${locale}/invoices`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
