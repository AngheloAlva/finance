"use client"

import { useTranslations } from "next-intl"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { usePathname } from "@/i18n/navigation"

const ROUTE_KEYS: Record<string, string> = {
	"/": "dashboard",
	"/transactions": "transactions",
	"/recurring": "recurring",
	"/categories": "categories",
	"/credit-cards": "creditCards",
	"/investments": "investments",
	"/analytics": "analytics",
	"/goals": "goals",
	"/simulations": "simulations",
	"/groups": "groups",
	"/alerts": "alerts",
	"/settings": "settings",
}

function getPageKey(pathname: string): string {
	if (ROUTE_KEYS[pathname]) return ROUTE_KEYS[pathname]

	const match = Object.keys(ROUTE_KEYS).find(
		(route) => route !== "/" && pathname.startsWith(route)
	)

	return match ? ROUTE_KEYS[match] : "page"
}

export function AppHeader() {
	const pathname = usePathname()
	const t = useTranslations("nav")
	const pageLabel = t(getPageKey(pathname))

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger />
			<Separator orientation="vertical" className="mr-2 h-5" />

			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>{pageLabel}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	)
}
