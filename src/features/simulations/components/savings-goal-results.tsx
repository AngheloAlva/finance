"use client"

import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SavingsProjectionResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface SavingsGoalResultsProps {
	result: SavingsProjectionResult
	currency: CurrencyCode
}

function formatMonthsLabel(months: number | null): string {
	if (months === null) return "Unreachable"
	if (months === 0) return "Already met"
	if (months === 1) return "1 month"
	return `${months} months`
}

export function SavingsGoalResults({ result, currency }: SavingsGoalResultsProps) {
	if (result.goalAlreadyMet) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<CheckCircle className="size-4 text-green-500" />
						Goal &quot;{result.goalName}&quot; is already met!
					</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground text-xs">
					You have reached your target of {formatCurrency(result.targetAmount, currency)}.
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
						<span className="text-muted-foreground">Progress</span>
						<span className="font-medium">
							{formatCurrency(result.currentAmount, currency)} /{" "}
							{formatCurrency(result.targetAmount, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Remaining</span>
						<span className="font-medium">{formatCurrency(result.remaining, currency)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Monthly savings</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlySavings, currency)}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Clock className="size-4" />
						Timeline Comparison
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">At current rate</span>
						<span className="font-medium">{formatMonthsLabel(result.currentMonthsToGoal)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">With adjusted contribution</span>
						<span className="font-medium">{formatMonthsLabel(result.adjustedMonthsToGoal)}</span>
					</div>
					{delta !== null && delta !== 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Difference</span>
							<span className={`font-medium ${delta > 0 ? "text-green-600" : "text-destructive"}`}>
								{delta > 0 ? `${delta} months sooner` : `${Math.abs(delta)} months later`}
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
							<span>You are on track to meet your target date.</span>
						</>
					) : (
						<>
							<AlertTriangle className="size-4 shrink-0" />
							<span>You are behind schedule. Consider increasing your monthly contribution.</span>
						</>
					)}
				</div>
			)}

			{result.currentMonthlySavings <= 0 && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>
						Your current savings rate is zero or negative. The goal is unreachable without adjusting
						your income or expenses.
					</span>
				</div>
			)}
		</div>
	)
}
