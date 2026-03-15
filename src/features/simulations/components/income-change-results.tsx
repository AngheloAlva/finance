"use client"

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IncomeImpactResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface IncomeChangeResultsProps {
	result: IncomeImpactResult
	currency: CurrencyCode
}

export function IncomeChangeResults({ result, currency }: IncomeChangeResultsProps) {
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
						Income Comparison
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Current income</span>
						<span className="font-medium">{formatCurrency(result.currentIncome, currency)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Projected income</span>
						<span className="font-medium">{formatCurrency(result.projectedIncome, currency)}</span>
					</div>
				</CardContent>
			</Card>

			{/* Savings Impact */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Savings Impact</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Current savings rate</span>
						<span className="font-medium">{result.currentSavingsRate}%</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Projected savings rate</span>
						<span
							className={`font-medium ${result.projectedSavingsRate < 0 ? "text-destructive" : ""}`}
						>
							{result.projectedSavingsRate}%
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Current monthly savings</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlySavings, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Projected monthly savings</span>
						<span
							className={`font-medium ${result.projectedMonthlySavings < 0 ? "text-destructive" : ""}`}
						>
							{formatCurrency(result.projectedMonthlySavings, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Debt coverage ratio</span>
						<span className="font-medium">{Math.round(result.debtCoverageRatio * 100)}%</span>
					</div>
				</CardContent>
			</Card>

			{/* Goal Impacts */}
			{result.goalImpacts.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Goal Timeline Changes</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{result.goalImpacts.map((goal, index) => (
							<div key={index} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
								<p className="text-xs font-medium">{goal.goalName}</p>
								<div className="text-muted-foreground flex justify-between text-xs">
									<span>
										Current:{" "}
										{goal.currentMonthsToGoal !== null
											? `${goal.currentMonthsToGoal} months`
											: "Unreachable"}
									</span>
									<span>
										Projected:{" "}
										{goal.projectedMonthsToGoal !== null
											? `${goal.projectedMonthsToGoal} months`
											: "Unreachable"}
									</span>
								</div>
								{goal.changeMonths !== 0 && (
									<p
										className={`text-xs ${goal.changeMonths < 0 ? "text-green-600" : "text-destructive"}`}
									>
										{goal.changeMonths < 0
											? `${Math.abs(goal.changeMonths)} months faster`
											: `${goal.changeMonths} months slower`}
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
					<span>
						At this income level, your expenses exceed your income. Goals are unreachable and debt
						obligations may become unsustainable.
					</span>
				</div>
			)}
		</div>
	)
}
