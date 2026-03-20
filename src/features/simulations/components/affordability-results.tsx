"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AffordabilityResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

function formatMonthLabel(monthKey: string, locale: string): string {
	const [year, month] = monthKey.split("-").map(Number)
	return new Date(year, month - 1).toLocaleDateString(locale, { month: "short" })
}

interface AffordabilityResultsProps {
	result: AffordabilityResult
	currency: CurrencyCode
}

export function AffordabilityResults({ result, currency }: AffordabilityResultsProps) {
	const t = useTranslations("simulations.affordability")
	const locale = useLocale()

	return (
		<div className="space-y-4">
			{/* Summary */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						{result.canAfford ? (
							<>
								<CheckCircle className="size-4 text-green-500" />
								{t("canAfford")}
							</>
						) : (
							<>
								<AlertTriangle className="text-destructive size-4" />
								{t("cannotAfford")}
							</>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("monthlyImpact")}</span>
						<span className="font-medium">{formatCurrency(result.monthlyImpact, currency, locale)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("currentMonthlyBalance")}</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlyBalance, currency, locale)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("projectedMonthlyBalance")}</span>
						<span
							className={`font-medium ${result.projectedMonthlyBalance < 0 ? "text-destructive" : ""}`}
						>
							{formatCurrency(result.projectedMonthlyBalance, currency, locale)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Credit Card Impact */}
			{result.creditCardImpact && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">
							{t("creditCardImpact", { name: result.creditCardImpact.cardName })}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("currentUtilization")}</span>
							<span className="font-medium">{result.creditCardImpact.currentUtilization}%</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("projectedUtilization")}</span>
							<span
								className={`font-medium ${result.creditCardImpact.exceedsLimit ? "text-destructive" : ""}`}
							>
								{result.creditCardImpact.projectedUtilization}%
								{result.creditCardImpact.exceedsLimit && ` ${t("exceedsLimit")}`}
							</span>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 3-Month Cash Flow Projection */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">{t("cashFlowProjection")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{result.cashFlowProjection.map((month) => (
							<div key={month.month} className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="font-medium">{formatMonthLabel(month.month, locale)}</span>
									<span className="text-muted-foreground">{month.month}</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">{t("withoutPurchase")}</span>
									<span className="font-medium">
										{formatCurrency(month.balanceWithout, currency, locale)}
									</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">{t("withPurchase")}</span>
									<span
										className={`font-medium ${month.balanceWithPurchase < 0 ? "text-destructive" : ""}`}
									>
										{formatCurrency(month.balanceWithPurchase, currency, locale)}
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{result.budgetWarning && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>{t("budgetWarning")}</span>
				</div>
			)}
		</div>
	)
}
