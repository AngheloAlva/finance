"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { GroupRole } from "@/generated/prisma/enums"

import { cn } from "@/lib/utils"
import { canManageCategories } from "@/features/groups/lib/groups.permissions.shared"

interface GroupTabsProps {
	groupId: string
	currentUserRole: GroupRole
}

export function GroupTabs({ groupId, currentUserRole }: GroupTabsProps) {
	const pathname = usePathname()
	const showSettings = canManageCategories(currentUserRole)

	const tabs = [
		{ label: "Members", href: `/groups/${groupId}` },
		{ label: "Transactions", href: `/groups/${groupId}/transactions` },
		{ label: "Dashboard", href: `/groups/${groupId}/dashboard` },
		{ label: "Goals", href: `/groups/${groupId}/goals` },
		{ label: "Categories", href: `/groups/${groupId}/categories` },
		...(showSettings ? [{ label: "Settings", href: `/groups/${groupId}/settings` }] : []),
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
