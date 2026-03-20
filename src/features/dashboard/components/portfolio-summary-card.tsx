"use client"

import { TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { PortfolioSummary } from "@/features/dashboard/types/dashboard.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { cn } from "@/lib/utils"

interface PortfolioSummaryCardProps {
	portfolio: PortfolioSummary
	currency: CurrencyCode
}

export function PortfolioSummaryCard({ portfolio, currency }: PortfolioSummaryCardProps) {
	const t = useTranslations("dashboard")
	const locale = useLocale()

	if (portfolio.count === 0) {
		return null
	}

	const isPositive = portfolio.returnPercentage >= 0

	return (
		<Link href="/investments">
			<Card className="relative transition-shadow hover:shadow-md">
				<CardContent className="flex items-center gap-4">
					<div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-none">
						<TrendingUp className="text-muted-foreground size-5" />
					</div>
					<div className="flex flex-col gap-0.5">
						<p className="text-muted-foreground text-xs">{t("portfolioValue")}</p>
						<p className="text-lg font-semibold tracking-tight">
							{formatCurrency(portfolio.totalCurrentValue, currency, locale)}
						</p>
					</div>
					<div className="ml-auto text-right">
						<p
							className={cn(
								"text-sm font-medium",
								isPositive ? "text-emerald-600" : "text-red-600"
							)}
						>
							{isPositive ? "+" : ""}
							{portfolio.returnPercentage.toFixed(2)}%
						</p>
						<p className="text-muted-foreground text-xs">
							{t("investment", { count: portfolio.count })}
						</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
