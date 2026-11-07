import { Plus } from "lucide-react"
import { cache } from "react"

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { getUnreadAlertCount } from "@/features/alerts/lib/alerts.queries"
import { AppSidebar } from "@/shared/components/app-sidebar"
import { CurrencyProvider } from "@/shared/components/currency-provider"
import { MobileNav } from "@/shared/components/mobile-nav"
import { requireSession } from "@/shared/lib/auth"
import type { CurrencyCode } from "@/shared/lib/constants"
import { prisma } from "@/shared/lib/prisma"

/**
 * Loads everything the dashboard chrome needs from the session and database.
 * Cached per request so the sidebar, phone nav and content share one lookup.
 */
const getDashboardChrome = cache(async () => {
	const session = await requireSession()

	const [alertCount, preferences] = await Promise.all([
		getUnreadAlertCount(session.user.id),
		prisma.user.findUnique({
			where: { id: session.user.id },
			select: { simpleMode: true },
		}),
	])
	const simpleMode = preferences?.simpleMode ?? false

	return {
		user: {
			name: session.user.name,
			email: session.user.email,
			image: session.user.image,
		},
		// Alerts are hidden in simple mode, so their badge would point nowhere.
		unreadAlertCount: simpleMode ? 0 : alertCount,
		simpleMode,
		currency: (session.user.currency ?? "USD") as CurrencyCode,
	}
})

export async function DashboardSidebar() {
	const { user, unreadAlertCount, simpleMode } = await getDashboardChrome()
	return <AppSidebar user={user} unreadAlertCount={unreadAlertCount} simpleMode={simpleMode} />
}

export async function DashboardMobileNav() {
	const { unreadAlertCount } = await getDashboardChrome()
	return <MobileNav unreadAlertCount={unreadAlertCount} />
}

export async function DashboardCurrency({ children }: { children: React.ReactNode }) {
	const { currency } = await getDashboardChrome()
	return <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
}

/** Sidebar placeholder shown while the session and database wake up. */
export function DashboardSidebarSkeleton() {
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{Array.from({ length: 8 }, (_, index) => (
							<SidebarMenuItem key={index}>
								<SidebarMenuSkeleton showIcon />
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}

/** Inert stand-in for the Quick Add button, at the same position. */
export function QuickAddButtonSkeleton() {
	return (
		<div
			aria-hidden
			className="bg-primary/60 text-primary-foreground fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full shadow-lg md:right-6 md:bottom-6 md:left-auto md:translate-x-0"
		>
			<Plus className="h-5 w-5" />
		</div>
	)
}
