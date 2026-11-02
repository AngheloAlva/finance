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
	useSidebar,
} from "@/components/ui/sidebar"
import { Link, usePathname } from "@/i18n/navigation"
import { AlertCountBadge } from "@/shared/components/alert-count-badge"
import { UserMenu } from "@/shared/components/user-menu"

interface AppSidebarProps {
	user: {
		name: string
		email: string
		image?: string | null
	}
	unreadAlertCount?: number
}

const NAV_GROUPS = [
	{
		key: "groupDaily",
		items: [
			{ key: "dashboard", href: "/", icon: LayoutDashboard },
			{ key: "transactions", href: "/transactions", icon: ArrowLeftRight },
			{ key: "budgets", href: "/budgets", icon: PieChart },
			{ key: "recurring", href: "/recurring", icon: Repeat },
		],
	},
	{
		key: "groupPlan",
		items: [
			{ key: "analytics", href: "/analytics", icon: BarChart3 },
			{ key: "goals", href: "/goals", icon: Target },
			{ key: "simulations", href: "/simulations", icon: Calculator },
		],
	},
	{
		key: "groupWealth",
		items: [
			{ key: "creditCards", href: "/credit-cards", icon: CreditCard },
			{ key: "investments", href: "/investments", icon: TrendingUp },
		],
	},
	{
		key: "groupAccount",
		items: [
			{ key: "alerts", href: "/alerts", icon: Bell },
			{ key: "categories", href: "/categories", icon: Tags },
			{ key: "groups", href: "/groups", icon: Users },
			{ key: "settings", href: "/settings", icon: Settings },
		],
	},
] as const

export function AppSidebar({ user, unreadAlertCount = 0 }: AppSidebarProps) {
	const pathname = usePathname()
	const t = useTranslations("nav")
	const { setOpenMobile } = useSidebar()

	function isActive(href: string): boolean {
		if (href === "/") return pathname === "/"
		return pathname.startsWith(href)
	}

	return (
		<Sidebar>
			<SidebarContent>
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.key}>
						<SidebarGroupLabel>{t(group.key)}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => {
									const label = t(item.key)
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={isActive(item.href)}
												tooltip={label}
												render={
													<Link href={item.href} onClick={() => setOpenMobile(false)} />
												}
											>
												<item.icon />
												<span>{label}</span>
												{item.href === "/alerts" && unreadAlertCount > 0 && (
													<AlertCountBadge count={unreadAlertCount} className="ml-auto" />
												)}
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
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
