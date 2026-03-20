"use client"

import { useTranslations } from "next-intl"
import type { GroupRole } from "@/generated/prisma/enums"

import { cn } from "@/lib/utils"
import { Link, usePathname } from "@/i18n/navigation"
import { canManageCategories } from "@/features/groups/lib/groups.permissions.shared"

interface GroupTabsProps {
	groupId: string
	currentUserRole: GroupRole
}

export function GroupTabs({ groupId, currentUserRole }: GroupTabsProps) {
	const pathname = usePathname()
	const t = useTranslations("groups.tabs")
	const showSettings = canManageCategories(currentUserRole)

	const tabs = [
		{ label: t("members"), href: `/groups/${groupId}` },
		{ label: t("transactions"), href: `/groups/${groupId}/transactions` },
		{ label: t("dashboard"), href: `/groups/${groupId}/dashboard` },
		{ label: t("goals"), href: `/groups/${groupId}/goals` },
		{ label: t("categories"), href: `/groups/${groupId}/categories` },
		...(showSettings ? [{ label: t("settings"), href: `/groups/${groupId}/settings` }] : []),
	]

	return (
		<nav className="flex gap-1 border-b">
			{tabs.map((tab) => {
				const isActive =
					tab.href === `/groups/${groupId}` ? pathname === tab.href : pathname.startsWith(tab.href)

				return (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"text-muted-foreground hover:text-foreground relative px-3 py-2 text-xs font-medium transition-colors",
							isActive &&
								"text-foreground after:bg-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
						)}
					>
						{tab.label}
					</Link>
				)
			})}
		</nav>
	)
}
