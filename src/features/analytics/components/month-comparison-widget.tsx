"use client"

import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthComparisonResult } from "@/features/analytics/types/analytics.types"
import { Link } from "@/i18n/navigation"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { cn } from "@/lib/utils"

interface MonthComparisonWidgetProps {
	comparison: MonthComparisonResult
	currency: CurrencyCode
}

const DIRECTION_ICONS = {
	up: ArrowUp,
	down: ArrowDown,
	flat: ArrowRight,
} as const

const DIRECTION_COLORS = {
	up: "text-red-500",
	down: "text-emerald-500",
	flat: "text-muted-foreground",
} as const

export function MonthComparisonWidget({ comparison, currency }: MonthComparisonWidgetProps) {
	const t = useTranslations("comparison")
	const locale = useLocale()

	if (comparison.totalCurrentMonth === 0 && comparison.totalPreviousMonth === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<TrendingUp className="size-4" />
						{t("title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-xs">{t("noData")}</p>
				</CardContent>
			</Card>
		)
	}

	const DirectionIcon = DIRECTION_ICONS[comparison.overallDirection]
	const directionColor = DIRECTION_COLORS[comparison.overallDirection]

	const summaryKey =
		comparison.overallDirection === "up"
			? "spentMore"
			: comparison.overallDirection === "down"
				? "spentLess"
				: "spentSame"

	const topMovers = comparison.items.slice(0, 3)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<TrendingUp className="size-4" />
					{t("title")}
				</CardTitle>
				<Link
					href="/analytics"
					className="text-muted-foreground text-xs underline hover:text-foreground"
				>
					{t("viewAll")}
				</Link>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className={cn("flex items-center gap-2 text-sm", directionColor)}>
					<DirectionIcon className="size-4" />
					<span>
						{t(summaryKey, { percent: Math.abs(comparison.overallChangePercent) })}
					</span>
				</div>

				{topMovers.length > 0 && (
					<div className="flex flex-col gap-1.5">
						{topMovers.map((item) => {
							const ItemIcon = DIRECTION_ICONS[item.direction]
							return (
								<div key={item.categoryId} className="flex items-center justify-between text-xs">
									<div className="flex items-center gap-1.5">
										<span
											className="inline-block size-2 rounded-none"
											style={{ backgroundColor: item.categoryColor }}
										/>
										<span>{item.categoryName}</span>
									</div>
									<div className={cn("flex items-center gap-1", DIRECTION_COLORS[item.direction])}>
										<ItemIcon className="size-3" />
										<span className="font-medium">
											{item.changePercent > 0 ? "+" : ""}
											{item.changePercent}%
										</span>
										<span className="text-muted-foreground">
											(<CurrencyDisplay cents={item.currentAmount} currency={currency} locale={locale} />)
										</span>
									</div>
								</div>
							)
						})}
					</div>
				)}

				{comparison.trends.length > 0 && (
					<div className="border-t pt-2">
						<p className="text-amber-500 text-xs">
							{t("risingTrendsCount", { count: comparison.trends.length })}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
