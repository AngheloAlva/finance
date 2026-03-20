"use client"

import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SavingsProjectionResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface SavingsGoalResultsProps {
	result: SavingsProjectionResult
	currency: CurrencyCode
}

export function SavingsGoalResults({ result, currency }: SavingsGoalResultsProps) {
	const t = useTranslations("simulations.savingsGoal")
	const locale = useLocale()

	function formatMonthsLabel(months: number | null): string {
		if (months === null) return t("unreachable")
		if (months === 0) return t("alreadyMet")
		if (months === 1) return t("oneMonth")
		return t("nMonths", { count: months })
	}

	if (result.goalAlreadyMet) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<CheckCircle className="size-4 text-green-500" />
						{t("goalAlreadyMet", { name: result.goalName })}
					</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground text-xs">
					{t("reachedTarget", { amount: formatCurrency(result.targetAmount, currency, locale) })}
				</CardContent>
			</Card>
		)
	}

	const delta =
		result.currentMonthsToGoal !== null && result.adjustedMonthsToGoal !== null
			? result.currentMonthsToGoal - result.adjustedMonthsToGoal
			: null

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">{result.goalName}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("progress")}</span>
						<span className="font-medium">
							{formatCurrency(result.currentAmount, currency, locale)} /{" "}
							{formatCurrency(result.targetAmount, currency, locale)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("remaining")}</span>
						<span className="font-medium">{formatCurrency(result.remaining, currency, locale)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("monthlySavings")}</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlySavings, currency, locale)}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Clock className="size-4" />
						{t("timelineComparison")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("atCurrentRate")}</span>
						<span className="font-medium">{formatMonthsLabel(result.currentMonthsToGoal)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("withAdjustedContribution")}</span>
						<span className="font-medium">{formatMonthsLabel(result.adjustedMonthsToGoal)}</span>
					</div>
					{delta !== null && delta !== 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("difference")}</span>
							<span className={`font-medium ${delta > 0 ? "text-green-600" : "text-destructive"}`}>
								{delta > 0 ? t("monthsSooner", { count: delta }) : t("monthsLater", { count: Math.abs(delta) })}
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			{result.onTrack !== null && (
				<div
					className={`flex items-center gap-2 rounded-none p-3 text-xs ${
						result.onTrack
							? "bg-green-500/10 text-green-700 dark:text-green-400"
							: "bg-destructive/10 text-destructive"
					}`}
				>
					{result.onTrack ? (
						<>
							<CheckCircle className="size-4 shrink-0" />
							<span>{t("onTrack")}</span>
						</>
					) : (
						<>
							<AlertTriangle className="size-4 shrink-0" />
							<span>{t("behindSchedule")}</span>
						</>
					)}
				</div>
			)}

			{result.currentMonthlySavings <= 0 && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>{t("zeroSavingsWarning")}</span>
				</div>
			)}
		</div>
	)
}
