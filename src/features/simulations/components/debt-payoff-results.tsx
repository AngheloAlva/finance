"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DebtPayoffResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency, formatDate } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface DebtPayoffResultsProps {
	result: DebtPayoffResult
	currency: CurrencyCode
}

export function DebtPayoffResults({ result, currency }: DebtPayoffResultsProps) {
	const t = useTranslations("simulations.debtPayoff")
	const locale = useLocale()

	if (result.installmentGroups.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<CheckCircle className="size-4 text-green-500" />
						{t("noDebt")}
					</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground text-xs">
					{t("noDebtDescription")}
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{/* Summary */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">{t("summary")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("totalRemainingDebt")}</span>
						<span className="font-medium">{formatCurrency(result.totalDebt, currency, locale)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("monthlyObligation")}</span>
						<span className="font-medium">
							{formatCurrency(result.monthlyObligation, currency, locale)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("debtCoverageRatio")}</span>
						<span className={`font-medium ${result.highDebtRatio ? "text-destructive" : ""}`}>
							{Math.round(result.debtCoverageRatio * 100)}%
						</span>
					</div>
					{result.debtFreeDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("debtFreeBy")}</span>
							<span className="font-medium">{formatDate(result.debtFreeDate, "short", locale)}</span>
						</div>
					)}
				</CardContent>
			</Card>

			{result.highDebtRatio && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>{t("highDebtWarning")}</span>
				</div>
			)}

			{/* Individual Groups */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">{t("installmentBreakdown")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{result.installmentGroups.map((group, index) => (
						<div key={index} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
							<p className="text-xs font-medium">{group.description}</p>
							<div className="text-muted-foreground flex justify-between text-xs">
								<span>
									{t("paymentsOf", { count: group.remainingPayments, amount: formatCurrency(group.monthlyAmount, currency, locale) })}
								</span>
								<span>{formatCurrency(group.totalRemaining, currency, locale)}</span>
							</div>
							<div className="text-muted-foreground text-xs">
								{t("payoff", { date: formatDate(group.projectedPayoffDate, "short", locale) })}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
