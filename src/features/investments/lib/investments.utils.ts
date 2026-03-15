import type { InvestmentSnapshot } from "@/generated/prisma/client"
import type { InvestmentType } from "@/generated/prisma/enums"

import type {
	Investment,
	InvestmentReturn,
	SnapshotPoint,
	AllocationItem,
} from "@/features/investments/types/investments.types"

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
	startDate: Date
): InvestmentReturn {
	const absoluteReturn = currentValue - initialAmount
	const percentageReturn =
		initialAmount > 0 ? ((currentValue - initialAmount) / initialAmount) * 100 : 0

	const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))

	const annualizedReturn =
		daysSinceStart > 0 && initialAmount > 0
			? (Math.pow(currentValue / initialAmount, 365 / daysSinceStart) - 1) * 100
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

export function calculateAllocation(investments: Investment[]): AllocationItem[] {
	const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)

	if (totalValue === 0) return []

	const byType = new Map<InvestmentType, number>()

	for (const inv of investments) {
		const current = byType.get(inv.type) ?? 0
		byType.set(inv.type, current + inv.currentValue)
	}

	return Array.from(byType.entries())
		.map(([type, value]) => ({
			type,
			label: INVESTMENT_TYPE_LABELS[type],
			totalValue: value,
			percentage: Math.round((value / totalValue) * 10000) / 100,
			color: INVESTMENT_TYPE_COLORS[type],
		}))
		.sort((a, b) => b.totalValue - a.totalValue)
}
