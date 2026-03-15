import type { Investment, InvestmentSnapshot } from "@/generated/prisma/client"
import type { InvestmentType } from "@/generated/prisma/enums"

export type { Investment, InvestmentSnapshot, InvestmentType }

export type InvestmentWithSnapshots = Investment & {
	snapshots: InvestmentSnapshot[]
}

export interface PortfolioSummary {
	totalInvested: number
	totalCurrentValue: number
	absoluteReturn: number
	returnPercentage: number
	count: number
}

export interface InvestmentReturn {
	absoluteReturn: number
	percentageReturn: number
	annualizedReturn: number | null
}

export interface SnapshotPoint {
	date: string
	value: number
}

export interface AllocationItem {
	type: InvestmentType
	label: string
	totalValue: number
	percentage: number
	color: string
}
