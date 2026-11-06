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
	type LucideIcon,
} from "lucide-react"

export interface NavItem {
	key: string
	href: string
	icon: LucideIcon
}

export interface NavGroup {
	key: string
	items: readonly NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
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
]

/** Sections shown in simple mode. Settings stays so the full menu can be turned on. */
const SIMPLE_MODE_HREFS = new Set(["/", "/transactions", "/budgets", "/goals", "/settings"])

/** Navigation groups for the sidebar, without empty groups. */
export function getVisibleNavGroups(simpleMode: boolean): NavGroup[] {
	if (!simpleMode) return [...NAV_GROUPS]
	return NAV_GROUPS.map((group) => ({
		...group,
		items: group.items.filter((item) => SIMPLE_MODE_HREFS.has(item.href)),
	})).filter((group) => group.items.length > 0)
}
