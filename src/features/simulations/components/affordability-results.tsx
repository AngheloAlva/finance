"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AffordabilityResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface AffordabilityResultsProps {
	result: AffordabilityResult
	currency: CurrencyCode
}

export function AffordabilityResults({ result, currency }: AffordabilityResultsProps) {
	return (
		<div className="space-y-4">
			{/* Summary */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						{result.canAfford ? (
							<>
								<CheckCircle className="size-4 text-green-500" />
								You can afford this purchase
							</>
						) : (
							<>
								<AlertTriangle className="text-destructive size-4" />
								This purchase may strain your budget
							</>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Monthly impact</span>
						<span className="font-medium">{formatCurrency(result.monthlyImpact, currency)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Current monthly balance</span>
						<span className="font-medium">
							{formatCurrency(result.currentMonthlyBalance, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Projected monthly balance</span>
						<span
							className={`font-medium ${result.projectedMonthlyBalance < 0 ? "text-destructive" : ""}`}
						>
							{formatCurrency(result.projectedMonthlyBalance, currency)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Credit Card Impact */}
			{result.creditCardImpact && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">
							Credit Card: {result.creditCardImpact.cardName}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Current utilization</span>
							<span className="font-medium">{result.creditCardImpact.currentUtilization}%</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Projected utilization</span>
							<span
								className={`font-medium ${result.creditCardImpact.exceedsLimit ? "text-destructive" : ""}`}
							>
								{result.creditCardImpact.projectedUtilization}%
								{result.creditCardImpact.exceedsLimit && " (exceeds limit)"}
							</span>
						</div>
					</CardContent>
				</Card>
			)}

			{/* 3-Month Cash Flow Projection */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">3-Month Cash Flow Projection</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{result.cashFlowProjection.map((month) => (
							<div key={month.month} className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="font-medium">{month.label}</span>
									<span className="text-muted-foreground">{month.month}</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">Without purchase</span>
									<span className="font-medium">
										{formatCurrency(month.balanceWithout, currency)}
									</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">With purchase</span>
									<span
										className={`font-medium ${month.balanceWithPurchase < 0 ? "text-destructive" : ""}`}
									>
										{formatCurrency(month.balanceWithPurchase, currency)}
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
					<span>
						Warning: Your projected balance is negative. Consider reducing expenses or increasing
						income before this purchase.
					</span>
				</div>
			)}
		</div>
	)
}
