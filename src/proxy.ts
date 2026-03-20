import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_ROUTES = ["/login", "/register"];

const IGNORED_PATHS = [
	"/api/auth",
	"/_next/static",
	"/_next/image",
	"/favicon.ico",
];

function isIgnoredPath(pathname: string) {
	return IGNORED_PATHS.some((path) => pathname.startsWith(path));
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (isIgnoredPath(pathname)) {
		return NextResponse.next();
	}

	// Run next-intl middleware first (handles locale detection, rewriting, cookie)
	const response = handleI18nRouting(request);

	// Extract the pathname without locale prefix for route matching
	const localePattern = new RegExp(
		`^/(${routing.locales.join("|")})(/|$)`,
	);
	const pathnameWithoutLocale =
		pathname.replace(localePattern, "/").replace(/\/$/, "") || "/";

	// Skip auth check for public routes
	if (PUBLIC_ROUTES.includes(pathnameWithoutLocale)) {
		return response;
	}

	// Auth check
	const sessionToken =
		request.cookies.get("better-auth.session_token")?.value ??
		request.cookies.get("__Secure-better-auth.session_token")?.value;

	const isAuthenticated = Boolean(sessionToken);

	if (!isAuthenticated) {
		// Detect locale from the URL or fall back to default
		const localeMatch = pathname.match(localePattern);
		const locale = localeMatch?.[1] ?? routing.defaultLocale;

		const loginUrl = new URL(`/${locale}/login`, request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
