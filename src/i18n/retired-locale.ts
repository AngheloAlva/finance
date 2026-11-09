import { type NextRequest, NextResponse } from "next/server";

import { defaultLocale, retiredLocales } from "./config";

const retiredLocalePattern = new RegExp(`^/(${retiredLocales.join("|")})(?=/|$)`);

/** Sends links from the old English pages to the same Spanish page. */
export function redirectRetiredLocale(request: NextRequest): NextResponse | null {
	const { pathname } = request.nextUrl;
	if (!retiredLocalePattern.test(pathname)) return null;

	const url = request.nextUrl.clone();
	url.pathname = pathname.replace(retiredLocalePattern, `/${defaultLocale}`);
	return NextResponse.redirect(url, 308);
}
