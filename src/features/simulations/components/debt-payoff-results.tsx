"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DebtPayoffResult } from "@/features/simulations/types/simulations.types"
import { formatCurrency, formatDate } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

interface DebtPayoffResultsProps {
	result: DebtPayoffResult
	currency: CurrencyCode
}

export function DebtPayoffResults({ result, currency }: DebtPayoffResultsProps) {
	if (result.installmentGroups.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm">
						<CheckCircle className="size-4 text-green-500" />
						No Outstanding Debt
					</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground text-xs">
					You have no active installment obligations. Great job staying debt-free!
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{/* Summary */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Debt Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Total remaining debt</span>
						<span className="font-medium">{formatCurrency(result.totalDebt, currency)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Monthly obligation</span>
						<span className="font-medium">
							{formatCurrency(result.monthlyObligation, currency)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Debt coverage ratio</span>
						<span className={`font-medium ${result.highDebtRatio ? "text-destructive" : ""}`}>
							{Math.round(result.debtCoverageRatio * 100)}%
						</span>
					</div>
					{result.debtFreeDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Debt-free by</span>
							<span className="font-medium">{formatDate(result.debtFreeDate, "short")}</span>
						</div>
					)}
				</CardContent>
			</Card>

			{result.highDebtRatio && (
				<div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-none p-3 text-xs">
					<AlertTriangle className="size-4 shrink-0" />
					<span>
						Your debt obligations exceed 30% of your income. Consider reducing new debt or
						increasing income.
					</span>
				</div>
			)}

			{/* Individual Groups */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Installment Breakdown</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{result.installmentGroups.map((group, index) => (
						<div key={index} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
							<p className="text-xs font-medium">{group.description}</p>
							<div className="text-muted-foreground flex justify-between text-xs">
								<span>
									{group.remainingPayments} payments of{" "}
									{formatCurrency(group.monthlyAmount, currency)}
								</span>
								<span>{formatCurrency(group.totalRemaining, currency)}</span>
							</div>
							<div className="text-muted-foreground text-xs">
								Payoff: {formatDate(group.projectedPayoffDate, "short")}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
