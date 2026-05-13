import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";

const COOKIE = "i18n-locale";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const langQ = url.searchParams.get("lang");
  if (langQ && isLocale(langQ)) {
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, langQ, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
    });
    return res;
  }

  if (!request.cookies.get(COOKIE)?.value) {
    const al = request.headers.get("accept-language") ?? "";
    const preferSv = /\bsv\b/i.test(al);
    const locale = preferSv ? "sv" : defaultLocale;
    const res = NextResponse.next();
    res.cookies.set(COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
