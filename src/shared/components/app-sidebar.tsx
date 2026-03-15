"use client"

import {
	ArrowLeftRight,
	BarChart3,
	Bell,
	Calculator,
	CreditCard,
	LayoutDashboard,
	Repeat,
	Settings,
	Tags,
	Target,
	TrendingUp,
	Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
	{ label: "Dashboard", href: "/", icon: LayoutDashboard },
	{ label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
	{ label: "Recurring", href: "/recurring", icon: Repeat },
	{ label: "Categories", href: "/categories", icon: Tags },
	{ label: "Credit Cards", href: "/credit-cards", icon: CreditCard },
	{ label: "Investments", href: "/investments", icon: TrendingUp },
	{ label: "Analytics", href: "/analytics", icon: BarChart3 },
	{ label: "Goals", href: "/goals", icon: Target },
	{ label: "Simulations", href: "/simulations", icon: Calculator },
	{ label: "Groups", href: "/groups", icon: Users },
	{ label: "Alerts", href: "/alerts", icon: Bell },
	{ label: "Settings", href: "/settings", icon: Settings },
] as const

export function AppSidebar({ user, unreadAlertCount = 0 }: AppSidebarProps) {
	const pathname = usePathname()

	function isActive(href: string): boolean {
		if (href === "/") return pathname === "/"
		return pathname.startsWith(href)
	}

	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Finance</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										isActive={isActive(item.href)}
										tooltip={item.label}
										render={<Link href={item.href} />}
									>
										<item.icon />
										<span>{item.label}</span>
										{item.href === "/alerts" && unreadAlertCount > 0 && (
											<span className="bg-destructive text-destructive-foreground ml-auto flex size-5 items-center justify-center rounded-none text-[10px] font-medium">
												{unreadAlertCount > 99 ? "99+" : unreadAlertCount}
											</span>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
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
