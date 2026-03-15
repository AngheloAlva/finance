import type { Transaction } from "@/generated/prisma/client"

// ---------------------------------------------------------------------------
// Split detail (enriched split for display)
// ---------------------------------------------------------------------------

export interface SplitDetail {
	splitId: string
	userId: string
	userName: string | null
	userEmail: string
	amount: number
	isPaid: boolean
	paidAt: Date | null
}

// ---------------------------------------------------------------------------
// Transaction with splits (group transaction list item)
// ---------------------------------------------------------------------------

export type TransactionWithSplits = Transaction & {
	category: { name: string; icon: string; color: string }
	splits: SplitDetail[]
	payer: { name: string | null; email: string }
}

// ---------------------------------------------------------------------------
// Member balance summary
// ---------------------------------------------------------------------------

export interface MemberBalance {
	userId: string
	userName: string | null
	userEmail: string
	totalPaid: number
	totalOwed: number
	totalOwes: number
	totalSettled: number
	netBalance: number
}

// ---------------------------------------------------------------------------
// Group overview stats
// ---------------------------------------------------------------------------

export interface GroupOverview {
	totalExpenses: number
	totalTransactions: number
	totalUnsettled: number
	memberCount: number
}

// ---------------------------------------------------------------------------
// Category breakdown item (group-level)
// ---------------------------------------------------------------------------

export interface GroupCategoryBreakdownItem {
	categoryId: string
	name: string
	icon: string
	color: string
	total: number
	percentage: number
}

// ---------------------------------------------------------------------------
// Monthly flow item (group-level)
// ---------------------------------------------------------------------------

export interface GroupMonthlyFlowItem {
	month: string
	total: number
}

// ---------------------------------------------------------------------------
// Filters for group transaction listing
// ---------------------------------------------------------------------------

export interface GroupTransactionFilters {
	dateFrom?: string
	dateTo?: string
	categoryId?: string
	page: number
	pageSize: number
}
