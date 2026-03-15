import { type NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/register"]

const IGNORED_PATHS = ["/api/auth", "/_next/static", "/_next/image", "/favicon.ico"]

function isIgnoredPath(pathname: string) {
	return IGNORED_PATHS.some((path) => pathname.startsWith(path))
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	if (isIgnoredPath(pathname)) {
		return NextResponse.next()
	}

	const sessionToken =
		request.cookies.get("better-auth.session_token")?.value ??
		request.cookies.get("__Secure-better-auth.session_token")?.value

	const isAuthenticated = Boolean(sessionToken)

	if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
		const loginUrl = new URL("/login", request.url)
		loginUrl.searchParams.set("callbackUrl", pathname)
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
