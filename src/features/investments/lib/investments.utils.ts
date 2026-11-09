import type { InvestmentSnapshot } from "@/generated/prisma/client"
import type { InvestmentType } from "@/generated/prisma/enums"

import type {
	Investment,
	InvestmentReturn,
	SnapshotPoint,
	AllocationItem,
} from "@/features/investments/types/investments.types"
import { CURRENCIES, type CurrencyCode } from "@/shared/lib/constants"
import { minorUnitsPerUnit } from "@/shared/lib/formatters"

/**
 * Convert a stored amount from the investment currency to the base currency.
 * Amounts are in each currency's stored units (USD cents, whole CLP pesos), so
 * the result is rescaled between them. If rate is null, returns the amount unchanged.
 * Rate is stored as rate * 10000 (e.g., 1 USD = 950.25 CLP → 9502500).
 */
export function convertToBaseCurrency(
	amount: number,
	exchangeRate: number | null,
	fromCurrency: string,
	toCurrency: string,
): number {
	if (exchangeRate === null) return amount
	const scale = minorUnitsPerUnit(toCurrency) / minorUnitsPerUnit(fromCurrency)
	return Math.round((amount * exchangeRate * scale) / 10000)
}

/**
 * Value of an investment amount in the base currency. Amounts already in the
 * base currency are returned as is; others go through convertToBaseCurrency.
 */
export function valueInBaseCurrency(
	amount: number,
	currency: string,
	exchangeRate: number | null,
	baseCurrency: string,
): number {
	if (currency === baseCurrency) return amount
	return convertToBaseCurrency(amount, exchangeRate, currency, baseCurrency)
}

/** Narrows a stored or submitted currency to one an investment supports. */
export function toInvestmentCurrency(
	value: string | null | undefined,
	fallback: CurrencyCode,
): CurrencyCode {
	return CURRENCIES.find((currency) => currency.code === value)?.code ?? fallback
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

export const INVESTMENT_TYPE_KEYS: Record<InvestmentType, string> = {
	STOCKS: "stocks",
	BONDS: "bonds",
	CRYPTO: "crypto",
	REAL_ESTATE: "realEstate",
	FUND: "funds",
	SAVINGS: "savings",
	OTHER: "other",
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
		daysSinceStart > 0 && initialAmount > 0 && netValue > 0
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
		return convertToBaseCurrency(inv.currentValue, inv.currentExchangeRate, inv.currency, userCurrency)
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
			label: INVESTMENT_TYPE_KEYS[type],
			totalValue: rawValue,
			baseCurrencyValue,
			percentage: Math.round((baseCurrencyValue / totalValue) * 10000) / 100,
			color: INVESTMENT_TYPE_COLORS[type],
		}))
		.sort((a, b) => (b.baseCurrencyValue ?? 0) - (a.baseCurrencyValue ?? 0))
}
