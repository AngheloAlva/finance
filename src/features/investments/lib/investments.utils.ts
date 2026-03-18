import type { InvestmentSnapshot } from "@/generated/prisma/client"
import type { InvestmentType } from "@/generated/prisma/enums"

import type {
	Investment,
	InvestmentReturn,
	SnapshotPoint,
	AllocationItem,
} from "@/features/investments/types/investments.types"

/**
 * Convert an amount from investment currency to base currency using the stored exchange rate.
 * If rate is null, returns the amount unchanged (same-currency or unknown rate).
 * Rate is stored as rate * 10000 (e.g., 1 USD = 950.25 CLP → 9502500).
 */
export function convertToBaseCurrency(amountCents: number, exchangeRate: number | null): number {
	if (exchangeRate === null) return amountCents
	return Math.round((amountCents * exchangeRate) / 10000)
}

/** Convert stored Int rate to display float (e.g., 9502500 → 950.25) */
export function rateToDisplay(rateInt: number): number {
	return rateInt / 10000
}

/** Convert display float to stored Int rate (e.g., 950.25 → 9502500) */
export function displayToRate(rateFloat: number): number {
	return Math.round(rateFloat * 10000)
}

export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
	STOCKS: "#3b82f6",
	BONDS: "#8b5cf6",
	CRYPTO: "#f59e0b",
	REAL_ESTATE: "#10b981",
	FUND: "#6366f1",
	SAVINGS: "#06b6d4",
	OTHER: "#6b7280",
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
	STOCKS: "Stocks",
	BONDS: "Bonds",
	CRYPTO: "Crypto",
	REAL_ESTATE: "Real Estate",
	FUND: "Funds",
	SAVINGS: "Savings",
	OTHER: "Other",
}

export function calculateReturn(
	initialAmount: number,
	currentValue: number,
	startDate: Date,
	totalFees?: number | null,
): InvestmentReturn {
	const fees = totalFees ?? 0
	const absoluteReturn = currentValue - initialAmount - fees
	const netValue = currentValue - fees
	const percentageReturn =
		initialAmount > 0 ? ((netValue - initialAmount) / initialAmount) * 100 : 0

	const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))

	const annualizedReturn =
		daysSinceStart > 0 && initialAmount > 0
			? (Math.pow(netValue / initialAmount, 365 / daysSinceStart) - 1) * 100
			: null

	return {
		absoluteReturn,
		percentageReturn: Math.round(percentageReturn * 100) / 100,
		annualizedReturn: annualizedReturn !== null ? Math.round(annualizedReturn * 100) / 100 : null,
	}
}

export function buildChartData(
	snapshots: InvestmentSnapshot[],
	currentValue: number
): SnapshotPoint[] {
	const points: SnapshotPoint[] = snapshots.map((s) => ({
		date: s.date.toISOString().split("T")[0],
		value: s.value,
	}))

	points.push({
		date: new Date().toISOString().split("T")[0],
		value: currentValue,
	})

	return points
}

export function calculateAllocation(
	investments: Investment[],
	userCurrency: string,
): AllocationItem[] {
	const baseCurrencyValues = investments.map((inv) => {
		if (inv.currency === userCurrency) return inv.currentValue
		return convertToBaseCurrency(inv.currentValue, inv.currentExchangeRate)
	})

	const totalValue = baseCurrencyValues.reduce((sum, val) => sum + val, 0)

	if (totalValue === 0) return []

	const byType = new Map<InvestmentType, { totalValue: number; baseCurrencyValue: number }>()

	for (let i = 0; i < investments.length; i++) {
		const inv = investments[i]
		const baseValue = baseCurrencyValues[i]
		const current = byType.get(inv.type) ?? { totalValue: 0, baseCurrencyValue: 0 }
		current.totalValue += inv.currentValue
		current.baseCurrencyValue += baseValue
		byType.set(inv.type, current)
	}

	return Array.from(byType.entries())
		.map(([type, { totalValue: rawValue, baseCurrencyValue }]) => ({
			type,
			label: INVESTMENT_TYPE_LABELS[type],
			totalValue: rawValue,
			baseCurrencyValue,
			percentage: Math.round((baseCurrencyValue / totalValue) * 10000) / 100,
			color: INVESTMENT_TYPE_COLORS[type],
		}))
		.sort((a, b) => (b.baseCurrencyValue ?? 0) - (a.baseCurrencyValue ?? 0))
}
