"use client"

import { ArrowLeftRight, LayoutDashboard, Menu, PieChart, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { useSidebar } from "@/components/ui/sidebar"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { AlertCountBadge } from "@/shared/components/alert-count-badge"

interface MobileNavProps {
	unreadAlertCount?: number
}

const ITEM_CLASS =
	"text-muted-foreground flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"

function NavLink({
	href,
	label,
	icon: Icon,
	active,
}: {
	href: string
	label: string
	icon: LucideIcon
	active: boolean
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(ITEM_CLASS, active && "text-primary")}
		>
			<Icon className="size-5" />
			{label}
		</Link>
	)
}

/** Floating phone navigation. The center gap holds the Quick Add button. */
export function MobileNav({ unreadAlertCount = 0 }: MobileNavProps) {
	const pathname = usePathname()
	const t = useTranslations("nav")
	const { toggleSidebar } = useSidebar()

	return (
		<nav className="bg-background/90 fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex rounded-full border shadow-lg backdrop-blur-md md:hidden">
			<NavLink href="/" label={t("dashboard")} icon={LayoutDashboard} active={pathname === "/"} />
			<NavLink
				href="/transactions"
				label={t("transactions")}
				icon={ArrowLeftRight}
				active={pathname.startsWith("/transactions")}
			/>
			<div className="w-16 shrink-0" aria-hidden />
			<NavLink
				href="/budgets"
				label={t("budgets")}
				icon={PieChart}
				active={pathname.startsWith("/budgets")}
			/>
			<button type="button" onClick={toggleSidebar} className={cn(ITEM_CLASS, "relative")}>
				<Menu className="size-5" />
				{t("more")}
				{unreadAlertCount > 0 && (
					<AlertCountBadge count={unreadAlertCount} className="absolute top-1.5 left-1/2 ml-1" />
				)}
			</button>
		</nav>
	)
}
