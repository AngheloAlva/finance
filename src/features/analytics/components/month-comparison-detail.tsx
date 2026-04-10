"use client"

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { TrendAlertBadge } from "@/features/analytics/components/trend-alert-badge"
import type { MonthComparisonResult } from "@/features/analytics/types/analytics.types"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { cn } from "@/lib/utils"

interface MonthComparisonDetailProps {
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

export function MonthComparisonDetail({ comparison, currency }: MonthComparisonDetailProps) {
	const t = useTranslations("comparison")
	const locale = useLocale()

	if (comparison.items.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">{t("noData")}</p>
				</CardContent>
			</Card>
		)
	}

	// Set of categoryIds with rising trends for quick lookup
	const trendingIds = new Set(comparison.trends.map((t) => t.categoryId))
	const trendMap = new Map(
		comparison.trends.map((t) => [t.categoryId, t.totalIncreasePercent]),
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("category")}</TableHead>
							<TableHead>{t("previousMonth")}</TableHead>
							<TableHead>{t("thisMonth")}</TableHead>
							<TableHead>{t("change")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{comparison.items.map((item) => {
							const Icon = DIRECTION_ICONS[item.direction]
							const color = DIRECTION_COLORS[item.direction]
							const isTrending = trendingIds.has(item.categoryId)

							return (
								<TableRow key={item.categoryId}>
									<TableCell>
										<div className="flex items-center gap-2">
											<span
												className="inline-block size-2 rounded-none"
												style={{ backgroundColor: item.categoryColor }}
											/>
											<span className="text-sm">{item.categoryName}</span>
											{isTrending && (
												<TrendAlertBadge increasePercent={trendMap.get(item.categoryId) ?? 0} />
											)}
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										<CurrencyDisplay
											cents={item.previousAmount}
											currency={currency}
											locale={locale}
										/>
									</TableCell>
									<TableCell className="text-sm">
										<CurrencyDisplay
											cents={item.currentAmount}
											currency={currency}
											locale={locale}
										/>
									</TableCell>
									<TableCell>
										<div className={cn("flex items-center gap-1 text-sm font-medium", color)}>
											<Icon className="size-3" />
											<span>
												{item.changePercent > 0 ? "+" : ""}
												{item.changePercent}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}
