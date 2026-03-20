"use client"

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import { logoutAction } from "@/features/auth/actions/logout.action"
import { LocaleSwitcher } from "@/shared/components/locale-switcher"
import { ThemeToggle } from "@/shared/components/theme-toggle"

interface UserMenuProps {
	user: {
		name: string
		email: string
		image?: string | null
	}
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase()
}

export function UserMenu({ user }: UserMenuProps) {
	const { isMobile } = useSidebar()
	const t = useTranslations("common")

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<SidebarMenuButton
						size="lg"
						className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
					/>
				}
			>
				<Avatar size="sm">
					{user.image && <AvatarImage src={user.image} alt={user.name} />}
					<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
				</Avatar>
				<div className="grid flex-1 text-left text-xs leading-tight">
					<span className="truncate font-medium">{user.name}</span>
					<span className="text-muted-foreground truncate">{user.email}</span>
				</div>
				<ChevronsUpDownIcon className="ml-auto size-4" />
			</DropdownMenuTrigger>

			<DropdownMenuContent
				side={isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
				className="w-56"
			>
				<DropdownMenuItem>
					<div className="flex flex-col gap-0.5">
						<span className="text-foreground font-medium">{user.name}</span>
						<span className="text-muted-foreground">{user.email}</span>
					</div>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-muted-foreground text-xs">{t("theme")}</span>
					<ThemeToggle />
				</div>

				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-muted-foreground text-xs">{t("language")}</span>
					<LocaleSwitcher />
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={() => logoutAction()}>
					<LogOutIcon />
					{t("logOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
