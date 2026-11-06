"use client"

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
import { getVisibleNavGroups } from "@/shared/lib/navigation"
import { UserMenu } from "@/shared/components/user-menu"

interface AppSidebarProps {
	user: {
		name: string
		email: string
		image?: string | null
	}
	unreadAlertCount?: number
	/** Shows only the everyday sections. */
	simpleMode?: boolean
}

export function AppSidebar({ user, unreadAlertCount = 0, simpleMode = false }: AppSidebarProps) {
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
				{getVisibleNavGroups(simpleMode).map((group) => (
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
