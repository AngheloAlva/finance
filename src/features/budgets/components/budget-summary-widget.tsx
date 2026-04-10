"use client"

import { PieChart } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import type { BudgetSummary } from "@/features/budgets/types/budgets.types"
import { Link } from "@/i18n/navigation"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"

interface BudgetSummaryWidgetProps {
	summary: BudgetSummary
	currency: CurrencyCode
}

export function BudgetSummaryWidget({ summary, currency }: BudgetSummaryWidgetProps) {
	const t = useTranslations("budgets.widget")
	const locale = useLocale()

	if (summary.totalCategories === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<PieChart className="size-4" />
						{t("title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						{t("noBudgets")}{" "}
						<Link href="/budgets" className="underline hover:text-foreground">
							{t("createBudget")}
						</Link>
					</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<PieChart className="size-4" />
					{t("title")}
				</CardTitle>
				<Link
					href="/budgets"
					className="text-xs text-muted-foreground underline hover:text-foreground"
				>
					{t("viewAll")}
				</Link>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-2">
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-muted-foreground">{t("spent")}</span>
						<span className="text-sm font-medium">
							<CurrencyDisplay cents={summary.totalSpent} currency={currency} locale={locale} />
							{" / "}
							<CurrencyDisplay cents={summary.totalBudgeted} currency={currency} locale={locale} />
						</span>
					</div>
					<div className="flex gap-3 text-xs">
						{summary.categoriesOnTrack > 0 && (
							<span className="text-emerald-500">
								{t("onTrack", { count: summary.categoriesOnTrack })}
							</span>
						)}
						{summary.categoriesWarning > 0 && (
							<span className="text-amber-500">
								{t("warning", { count: summary.categoriesWarning })}
							</span>
						)}
						{summary.categoriesExceeded > 0 && (
							<span className="text-red-500">
								{t("exceeded", { count: summary.categoriesExceeded })}
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
