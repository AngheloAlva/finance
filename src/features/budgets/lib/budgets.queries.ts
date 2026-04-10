import { TransactionType } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"

import {
	BUDGET_STATUS,
	type BudgetSummary,
	type BudgetStatus,
	type BudgetWithSpending,
} from "../types/budgets.types"

function computeStatus(percentage: number): BudgetStatus {
	if (percentage >= 100) return BUDGET_STATUS.EXCEEDED
	if (percentage >= 80) return BUDGET_STATUS.WARNING
	return BUDGET_STATUS.OK
}

export async function getBudgetsWithSpending(
	userId: string,
	month: number,
	year: number,
): Promise<BudgetWithSpending[]> {
	const budgets = await prisma.budget.findMany({
		where: { userId, month, year },
		include: {
			category: {
				select: { id: true, name: true, icon: true, color: true },
			},
		},
		orderBy: { category: { name: "asc" } },
	})

	if (budgets.length === 0) return []

	const start = new Date(year, month - 1, 1)
	const end = new Date(year, month, 1)

	const categoryIds = budgets.map((b) => b.categoryId)

	const spending = await prisma.transaction.groupBy({
		by: ["categoryId"],
		where: {
			userId,
			categoryId: { in: categoryIds },
			type: TransactionType.EXPENSE,
			isTemplate: false,
			impactDate: { gte: start, lt: end },
		},
		_sum: { amount: true },
	})

	const spendingMap = new Map(
		spending.map((s) => [s.categoryId, Math.abs(s._sum.amount ?? 0)]),
	)

	return budgets.map((budget) => {
		const actual = spendingMap.get(budget.categoryId) ?? 0
		const percentage = budget.amount > 0 ? Math.round((actual / budget.amount) * 100) : 0

		return {
			budget,
			actual,
			percentage,
			status: computeStatus(percentage),
		}
	})
}

export async function getBudgetSummary(
	userId: string,
	month: number,
	year: number,
): Promise<BudgetSummary> {
	const items = await getBudgetsWithSpending(userId, month, year)

	if (items.length === 0) {
		return {
			totalBudgeted: 0,
			totalSpent: 0,
			categoriesOnTrack: 0,
			categoriesWarning: 0,
			categoriesExceeded: 0,
			totalCategories: 0,
		}
	}

	let totalBudgeted = 0
	let totalSpent = 0
	let categoriesOnTrack = 0
	let categoriesWarning = 0
	let categoriesExceeded = 0

	for (const item of items) {
		totalBudgeted += item.budget.amount
		totalSpent += item.actual
		if (item.status === BUDGET_STATUS.OK) categoriesOnTrack++
		else if (item.status === BUDGET_STATUS.WARNING) categoriesWarning++
		else categoriesExceeded++
	}

	return {
		totalBudgeted,
		totalSpent,
		categoriesOnTrack,
		categoriesWarning,
		categoriesExceeded,
		totalCategories: items.length,
	}
}
