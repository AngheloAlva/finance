"use client"

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IncomeImpactResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface IncomeChangeResultsProps {
	result: IncomeImpactResult
	currency: CurrencyCode
}

export function IncomeChangeResults({ result, currency }: IncomeChangeResultsProps) {
	const t = useTranslations("simulations.incomeChange")
	const locale = useLocale()
	const isIncrease = result.projectedIncome >= result.currentIncome

	return (
		<div className="space-y-4">
			{/* Income Comparison */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						{isIncrease ? (
							<TrendingUp className="size-4 text-green-500" />
						) : (
							<TrendingDown className="text-destructive size-4" />
						)}
						{t("incomeComparison")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("currentIncome")}</span>
						<span className="font-medium">{formatCurrency(result.currentIncome, currency, locale)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("projectedIncome")}</span>
						<span className="font-medium">{formatCurrency(result.projectedIncome, currency, locale)}</span>
					</div>
				</CardContent>
			</Card>

			{/* Savings Impact */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">{t("savingsImpact")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("currentSavingsRate")}</span>
						<span className="font-medium">{result.currentSavingsRate}%</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("projectedSavingsRate")}</span>
						<span
							className={`font-medium ${result.projectedSavingsRate < 0 ? "text-destructive" : ""}`}
						>
							{result.projectedSavingsRate}%
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("currentMonthlySavings")}</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlySavings, currency, locale)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("projectedMonthlySavings")}</span>
						<span
							className={`font-medium ${result.projectedMonthlySavings < 0 ? "text-destructive" : ""}`}
						>
							{formatCurrency(result.projectedMonthlySavings, currency, locale)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("debtCoverageRatio")}</span>
						<span className="font-medium">{Math.round(result.debtCoverageRatio * 100)}%</span>
					</div>
				</CardContent>
			</Card>

			{/* Goal Impacts */}
			{result.goalImpacts.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">{t("goalTimelineChanges")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{result.goalImpacts.map((goal, index) => (
							<div key={index} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
								<p className="text-xs font-medium">{goal.goalName}</p>
								<div className="text-muted-foreground flex justify-between text-xs">
									<span>
										{t("current", {
											value: goal.currentMonthsToGoal !== null
												? t("months", { count: goal.currentMonthsToGoal })
												: t("unreachable"),
										})}
									</span>
									<span>
										{t("projected", {
											value: goal.projectedMonthsToGoal !== null
												? t("months", { count: goal.projectedMonthsToGoal })
												: t("unreachable"),
										})}
									</span>
								</div>
								{goal.changeMonths !== 0 && (
									<p
										className={`text-xs ${goal.changeMonths < 0 ? "text-green-600" : "text-destructive"}`}
									>
										{goal.changeMonths < 0
											? t("monthsFaster", { count: Math.abs(goal.changeMonths) })
											: t("monthsSlower", { count: goal.changeMonths })}
									</p>
								)}
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{result.deficit && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>{t("deficitWarning")}</span>
				</div>
			)}
		</div>
	)
}
