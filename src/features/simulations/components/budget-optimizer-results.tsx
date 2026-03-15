"use client"

import { AlertTriangle, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BudgetOptimizerResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface BudgetOptimizerResultsProps {
	result: BudgetOptimizerResult
	currency: CurrencyCode
}

export function BudgetOptimizerResults({ result, currency }: BudgetOptimizerResultsProps) {
	if (result.categories.length === 0) {
		return (
			<Card>
				<CardContent className="text-muted-foreground py-6 text-center text-xs">
					No spending data available. Start recording expenses to get optimization suggestions.
				</CardContent>
			</Card>
		)
	}

	const hasAvoidable = result.avoidableExpenses > 0

	return (
		<div className="space-y-4">
			{/* Overview */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Budget Overview</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Monthly income</span>
						<span className="font-medium">{formatCurrency(result.monthlyIncome, currency)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Total expenses</span>
						<span className="font-medium">
							{formatCurrency(result.totalMonthlyExpenses, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Current savings rate</span>
						<span className="font-medium">{result.savingsRate}%</span>
					</div>
					{hasAvoidable && (
						<>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Avoidable expenses</span>
								<span className="font-medium text-orange-600">
									{formatCurrency(result.avoidableExpenses, currency)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Potential savings rate</span>
								<span className="font-medium text-green-600">{result.potentialSavingsRate}%</span>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Reduction Scenarios */}
			{hasAvoidable && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<TrendingUp className="size-4" />
							Savings Scenarios
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{result.reductionScenarios.map((scenario) => (
							<div key={scenario.percent} className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">{scenario.label}</span>
								<span className="font-medium">
									Save {formatCurrency(scenario.monthlySavings, currency)}/mo (
									{scenario.newSavingsRate}% rate)
								</span>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Category Breakdown */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Spending by Category</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{result.categories.map((cat) => (
						<div key={cat.categoryId} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs">
									<span
										className="inline-block size-2.5 rounded-none"
										style={{ backgroundColor: cat.categoryColor }}
									/>
									<span className="font-medium">{cat.categoryName}</span>
									{cat.isAvoidable && (
										<span className="rounded bg-orange-100 px-1 py-0.5 text-[10px] text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
											Avoidable
										</span>
									)}
								</div>
								<span className="text-xs font-medium">
									{formatCurrency(cat.monthlyAverage, currency)}
								</span>
							</div>
							<div className="text-muted-foreground flex items-center justify-between text-xs">
								<span>{cat.percentOfTotal}% of total</span>
								{cat.exceedsThreshold && cat.alertThreshold !== null && (
									<span className="text-destructive">
										Exceeds threshold ({formatCurrency(cat.alertThreshold, currency)})
									</span>
								)}
							</div>
							{cat.suggestion && (
								<p className="text-muted-foreground text-xs italic">{cat.suggestion}</p>
							)}
						</div>
					))}
				</CardContent>
			</Card>

			{!hasAvoidable && (
				<div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>
						No avoidable categories found. Review your category settings to mark categories as
						avoidable for optimization suggestions.
					</span>
				</div>
			)}
		</div>
	)
}
