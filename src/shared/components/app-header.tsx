"use client"

import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb"

const ROUTE_LABELS: Record<string, string> = {
	"/": "Dashboard",
	"/transactions": "Transactions",
	"/recurring": "Recurring",
	"/categories": "Categories",
	"/credit-cards": "Credit Cards",
	"/investments": "Investments",
	"/analytics": "Analytics",
	"/goals": "Goals",
	"/simulations": "Simulations",
	"/groups": "Groups",
	"/alerts": "Alerts",
	"/settings": "Settings",
}

function getPageLabel(pathname: string): string {
	if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]

	const match = Object.keys(ROUTE_LABELS).find(
		(route) => route !== "/" && pathname.startsWith(route)
	)

	return match ? ROUTE_LABELS[match] : "Page"
}

export function AppHeader() {
	const pathname = usePathname()
	const pageLabel = getPageLabel(pathname)

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
