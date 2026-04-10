"use client"

import {
	ArrowLeftRight,
	BarChart3,
	Bell,
	Calculator,
	CreditCard,
	LayoutDashboard,
	PieChart,
	Repeat,
	Settings,
	Tags,
	Target,
	TrendingUp,
	Users,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, usePathname } from "@/i18n/navigation"
import { UserMenu } from "@/shared/components/user-menu"

interface AppSidebarProps {
	user: {
		name: string
		email: string
		image?: string | null
	}
	unreadAlertCount?: number
}

const NAV_ITEMS = [
	{ key: "dashboard", href: "/", icon: LayoutDashboard },
	{ key: "transactions", href: "/transactions", icon: ArrowLeftRight },
	{ key: "recurring", href: "/recurring", icon: Repeat },
	{ key: "categories", href: "/categories", icon: Tags },
	{ key: "budgets", href: "/budgets", icon: PieChart },
	{ key: "creditCards", href: "/credit-cards", icon: CreditCard },
	{ key: "investments", href: "/investments", icon: TrendingUp },
	{ key: "analytics", href: "/analytics", icon: BarChart3 },
	{ key: "goals", href: "/goals", icon: Target },
	{ key: "simulations", href: "/simulations", icon: Calculator },
	{ key: "groups", href: "/groups", icon: Users },
	{ key: "alerts", href: "/alerts", icon: Bell },
	{ key: "settings", href: "/settings", icon: Settings },
] as const

export function AppSidebar({ user, unreadAlertCount = 0 }: AppSidebarProps) {
	const pathname = usePathname()
	const t = useTranslations("nav")

	function isActive(href: string): boolean {
		if (href === "/") return pathname === "/"
		return pathname.startsWith(href)
	}

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>{t("appName")}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => {
								const label = t(item.key)
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={isActive(item.href)}
											tooltip={label}
											render={<Link href={item.href} />}
										>
											<item.icon />
											<span>{label}</span>
											{item.href === "/alerts" && unreadAlertCount > 0 && (
												<span className="bg-destructive text-destructive-foreground ml-auto flex size-5 items-center justify-center rounded-none text-[10px] font-medium">
													{unreadAlertCount > 99 ? "99+" : unreadAlertCount}
												</span>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenu user={user} />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
