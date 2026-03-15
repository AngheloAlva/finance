import {
	BarChart3,
	Building2,
	Bitcoin,
	Home,
	PiggyBank,
	Landmark,
	HelpCircle,
	type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
	INVESTMENT_TYPE_COLORS,
	INVESTMENT_TYPE_LABELS,
	calculateReturn,
} from "@/features/investments/lib/investments.utils"
import type { Investment } from "@/features/investments/types/investments.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<string, LucideIcon> = {
	STOCKS: BarChart3,
	BONDS: Landmark,
	CRYPTO: Bitcoin,
	REAL_ESTATE: Home,
	FUND: Building2,
	SAVINGS: PiggyBank,
	OTHER: HelpCircle,
}

interface InvestmentCardProps {
	investment: Investment
}

export function InvestmentCard({ investment }: InvestmentCardProps) {
	const Icon = TYPE_ICONS[investment.type] ?? HelpCircle
	const returnData = calculateReturn(
		investment.initialAmount,
		investment.currentValue,
		investment.startDate
	)
	const isPositive = returnData.percentageReturn >= 0

	return (
		<Card className="relative transition-shadow hover:shadow-md">
			<CardContent className="flex items-center gap-4">
				<div
					className="flex size-10 shrink-0 items-center justify-center rounded-none"
					style={{ backgroundColor: `${INVESTMENT_TYPE_COLORS[investment.type]}20` }}
				>
					<Icon className="size-5" style={{ color: INVESTMENT_TYPE_COLORS[investment.type] }} />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex items-center justify-between gap-2">
						<p className="truncate text-sm font-semibold">{investment.name}</p>
						<p className="shrink-0 text-sm font-semibold">
							{formatCurrency(investment.currentValue, investment.currency as CurrencyCode)}
						</p>
					</div>
					<div className="flex items-center justify-between gap-2">
						<p className="text-muted-foreground truncate text-xs">
							{INVESTMENT_TYPE_LABELS[investment.type]} &middot; {investment.institution}
						</p>
						<p
							className={cn(
								"shrink-0 text-xs font-medium",
								isPositive ? "text-emerald-600" : "text-red-600"
							)}
						>
							{isPositive ? "+" : ""}
							{returnData.percentageReturn.toFixed(2)}%
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
