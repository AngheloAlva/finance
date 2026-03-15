import type { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/shared/lib/prisma"
import type { PaginatedResult } from "@/shared/types/common.types"

import type {
	GroupCategoryBreakdownItem,
	GroupMonthlyFlowItem,
	GroupOverview,
	GroupTransactionFilters,
	MemberBalance,
	TransactionWithSplits,
} from "@/features/group-finances/types/group-finances.types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonthRange(month: number, year: number) {
	const start = new Date(year, month - 1, 1)
	const end = new Date(year, month, 1)
	return { start, end }
}

// ---------------------------------------------------------------------------
// 4.1 — getGroupTransactions
// ---------------------------------------------------------------------------

export async function getGroupTransactions(
	groupId: string,
	filters: GroupTransactionFilters
): Promise<PaginatedResult<TransactionWithSplits>> {
	const conditions: Prisma.TransactionWhereInput[] = [{ groupId }, { isTemplate: false }]

	if (filters.dateFrom) {
		conditions.push({ date: { gte: new Date(filters.dateFrom) } })
	}

	if (filters.dateTo) {
		conditions.push({ date: { lte: new Date(filters.dateTo) } })
	}

	if (filters.categoryId) {
		conditions.push({ categoryId: filters.categoryId })
	}

	const where: Prisma.TransactionWhereInput = { AND: conditions }

	const skip = (filters.page - 1) * filters.pageSize
	const take = filters.pageSize

	const [rawTransactions, total] = await Promise.all([
		prisma.transaction.findMany({
			where,
			orderBy: { date: "desc" },
			skip,
			take,
			include: {
				category: {
					select: { name: true, icon: true, color: true },
				},
				splits: {
					include: {
						user: {
							select: { name: true, email: true },
						},
					},
				},
				user: {
					select: { name: true, email: true },
				},
			},
		}),
		prisma.transaction.count({ where }),
	])

	const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

	// Map to TransactionWithSplits shape
	const data: TransactionWithSplits[] = rawTransactions.map((tx) => ({
		...tx,
		category: tx.category,
		payer: { name: tx.user.name, email: tx.user.email },
		splits: tx.splits.map((s) => ({
			splitId: s.id,
			userId: s.userId,
			userName: s.user.name,
			userEmail: s.user.email,
			amount: s.amount,
			isPaid: s.isPaid,
			paidAt: s.paidAt,
		})),
	}))

	return {
		data,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
		totalPages,
	}
}

// ---------------------------------------------------------------------------
// 4.2 — getMemberBalances
// ---------------------------------------------------------------------------

export async function getMemberBalances(groupId: string): Promise<MemberBalance[]> {
	const groupTxFilter = { groupId, isTemplate: false } as const

	const [members, paidByUser, splitAggregates] = await Promise.all([
		// Fetch all group members
		prisma.groupMember.findMany({
			where: { groupId },
			include: {
				user: { select: { id: true, name: true, email: true } },
			},
		}),

		// totalPaid: aggregate transaction amounts grouped by payer
		prisma.transaction.groupBy({
			by: ["userId"],
			where: groupTxFilter,
			_sum: { amount: true },
		}),

		// Aggregate splits with the payer (transaction.userId) for directionality.
		// Groups by: split userId, transaction userId (payer), and isPaid status.
		// This single query gives us everything needed for totalOwed, totalOwes, and totalSettled.
		prisma.$queryRaw<
			Array<{
				split_user_id: string
				payer_user_id: string
				is_paid: boolean
				total: bigint
			}>
		>`
			SELECT
				s."userId"        AS split_user_id,
				t."userId"        AS payer_user_id,
				s."isPaid"        AS is_paid,
				SUM(s."amount")   AS total
			FROM transaction_splits s
			JOIN transactions t ON t.id = s."transactionId"
			WHERE t."groupId" = ${groupId}
				AND t."isTemplate" = false
				AND s."userId" != t."userId"
			GROUP BY s."userId", t."userId", s."isPaid"
		`,
	])

	// Index totalPaid by userId
	const paidMap = new Map(paidByUser.map((r) => [r.userId, r._sum.amount ?? 0]))

	// Index split aggregates for fast lookup
	// owedMap: payer -> total unpaid amount others owe them
	// owesMap: splitUser -> total unpaid amount they owe others
	// settledMap: splitUser -> total paid amount they settled to others
	const owedMap = new Map<string, number>()
	const owesMap = new Map<string, number>()
	const settledMap = new Map<string, number>()

	for (const row of splitAggregates) {
		const amount = Number(row.total)

		if (!row.is_paid) {
			// Unpaid split: splitUser owes the payer
			owesMap.set(row.split_user_id, (owesMap.get(row.split_user_id) ?? 0) + amount)
			owedMap.set(row.payer_user_id, (owedMap.get(row.payer_user_id) ?? 0) + amount)
		} else {
			// Paid split: splitUser has settled with the payer
			settledMap.set(row.split_user_id, (settledMap.get(row.split_user_id) ?? 0) + amount)
		}
	}

	return members.map((member) => {
		const userId = member.userId
		const totalPaid = paidMap.get(userId) ?? 0
		const totalOwed = owedMap.get(userId) ?? 0
		const totalOwes = owesMap.get(userId) ?? 0
		const totalSettled = settledMap.get(userId) ?? 0
		const netBalance = totalOwed - totalOwes

		return {
			userId,
			userName: member.user.name,
			userEmail: member.user.email,
			totalPaid,
			totalOwed,
			totalOwes,
			totalSettled,
			netBalance,
		}
	})
}

// ---------------------------------------------------------------------------
// 4.3 — getGroupOverview
// ---------------------------------------------------------------------------

export async function getGroupOverview(
	groupId: string,
	month: number,
	year: number
): Promise<GroupOverview> {
	const { start, end } = getMonthRange(month, year)

	const dateFilter: Prisma.TransactionWhereInput = {
		groupId,
		isTemplate: false,
		date: { gte: start, lt: end },
	}

	const [expenseResult, transactionCount, unsettledResult, memberCount] = await Promise.all([
		prisma.transaction.aggregate({
			where: dateFilter,
			_sum: { amount: true },
		}),
		prisma.transaction.count({ where: dateFilter }),
		prisma.transactionSplit.aggregate({
			where: {
				isPaid: false,
				transaction: { groupId, isTemplate: false },
			},
			_sum: { amount: true },
		}),
		prisma.groupMember.count({ where: { groupId } }),
	])

	return {
		totalExpenses: expenseResult._sum.amount ?? 0,
		totalTransactions: transactionCount,
		totalUnsettled: unsettledResult._sum.amount ?? 0,
		memberCount,
	}
}

// ---------------------------------------------------------------------------
// 4.4 — getGroupCategoryBreakdown
// ---------------------------------------------------------------------------

export async function getGroupCategoryBreakdown(
	groupId: string,
	month: number,
	year: number
): Promise<GroupCategoryBreakdownItem[]> {
	const { start, end } = getMonthRange(month, year)

	const groups = await prisma.transaction.groupBy({
		by: ["categoryId"],
		where: {
			groupId,
			isTemplate: false,
			date: { gte: start, lt: end },
		},
		_sum: { amount: true },
		orderBy: { _sum: { amount: "desc" } },
	})

	if (groups.length === 0) return []

	const categoryIds = groups.map((g) => g.categoryId)

	const categories = await prisma.category.findMany({
		where: { id: { in: categoryIds } },
		select: { id: true, name: true, icon: true, color: true },
	})

	const categoryMap = new Map(categories.map((c) => [c.id, c]))

	const totalExpenses = groups.reduce((sum, g) => sum + (g._sum.amount ?? 0), 0)

	return groups
		.map((g) => {
			const category = categoryMap.get(g.categoryId)
			const total = g._sum.amount ?? 0

			return {
				categoryId: g.categoryId,
				name: category?.name ?? "Unknown",
				icon: category?.icon ?? "circle",
				color: category?.color ?? "#6b7280",
				total,
				percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
			}
		})
		.sort((a, b) => b.total - a.total)
}

// ---------------------------------------------------------------------------
// 4.5 — getGroupMonthlyFlow
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const

export async function getGroupMonthlyFlow(
	groupId: string,
	endMonth: number,
	endYear: number,
	months = 6
): Promise<GroupMonthlyFlowItem[]> {
	let currentMonth = endMonth
	let currentYear = endYear

	const monthsToFetch: Array<{ month: number; year: number }> = []

	for (let i = 0; i < months; i++) {
		monthsToFetch.unshift({ month: currentMonth, year: currentYear })
		currentMonth--
		if (currentMonth === 0) {
			currentMonth = 12
			currentYear--
		}
	}

	const results = await Promise.all(
		monthsToFetch.map(async ({ month, year }) => {
			const { start, end } = getMonthRange(month, year)

			const result = await prisma.transaction.aggregate({
				where: {
					groupId,
					isTemplate: false,
					date: { gte: start, lt: end },
				},
				_sum: { amount: true },
			})

			return {
				month: `${MONTH_LABELS[month - 1]} ${year}`,
				total: result._sum.amount ?? 0,
			}
		})
	)

	return results
}
