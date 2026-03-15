import { GoalStatus, TransactionType } from "@/generated/prisma/enums"
import type { RecurrenceFrequency } from "@/generated/prisma/enums"

import { getCurrentCycleRange } from "@/features/credit-cards/lib/billing-cycle.utils"
import { prisma } from "@/shared/lib/prisma"

import type {
	CategoryExpense,
	CreditCardSnapshot,
	FinancialSnapshot,
	GoalSnapshot,
	OutstandingInstallment,
	RecurringObligation,
} from "@/features/simulations/types/simulations.types"

// ─── Frequency normalization ─────────────────────────────────────────

function getMonthlyMultiplier(frequency: RecurrenceFrequency, interval: number): number {
	const base = (() => {
		switch (frequency) {
			case "DAILY":
				return 365 / 12
			case "WEEKLY":
				return 52 / 12
			case "BIWEEKLY":
				return 26 / 12
			case "MONTHLY":
				return 1
			case "BIMONTHLY":
				return 1 / 2
			case "QUARTERLY":
				return 1 / 3
			case "SEMIANNUAL":
				return 1 / 6
			case "ANNUAL":
				return 1 / 12
		}
	})()

	return base / interval
}

// ─── Main query ──────────────────────────────────────────────────────

export async function getFinancialSnapshot(userId: string): Promise<FinancialSnapshot> {
	const now = new Date()
	const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

	const [
		recentTransactions,
		creditCards,
		installmentParents,
		recurringTemplates,
		goals,
		investmentAgg,
	] = await Promise.all([
		// Transactions from last 3 months (non-template)
		prisma.transaction.findMany({
			where: {
				userId,
				isTemplate: false,
				date: { gte: threeMonthsAgo },
			},
			include: {
				category: {
					select: {
						id: true,
						name: true,
						color: true,
						icon: true,
						isAvoidable: true,
						isRecurring: true,
						alertThreshold: true,
					},
				},
			},
		}),

		// Credit cards with usage
		prisma.creditCard.findMany({
			where: { userId, isActive: true },
		}),

		// Outstanding installments: find parent transaction groups with remaining installments
		prisma.transaction.findMany({
			where: {
				userId,
				isTemplate: false,
				parentTransactionId: { not: null },
				installmentNumber: { not: null },
				totalInstallments: { not: null },
				impactDate: { gte: now },
			},
			select: {
				parentTransactionId: true,
				description: true,
				creditCardId: true,
				amount: true,
				installmentNumber: true,
				totalInstallments: true,
			},
		}),

		// Recurring templates (active)
		prisma.transaction.findMany({
			where: {
				userId,
				isTemplate: true,
				recurrenceRule: { isActive: true },
			},
			include: {
				recurrenceRule: {
					select: { frequency: true, interval: true },
				},
			},
		}),

		// Active goals with contribution aggregates
		prisma.goal.findMany({
			where: { userId, groupId: null, status: GoalStatus.ACTIVE },
			include: {
				contributions: {
					select: { amount: true },
				},
			},
		}),

		// Investment total value
		prisma.investment.aggregate({
			where: { userId, isActive: true },
			_sum: { currentValue: true },
		}),
	])

	// ─── Compute data months ──────────────────────────────────────────
	const transactionMonths = new Set(
		recentTransactions.map((t) => `${t.date.getFullYear()}-${t.date.getMonth()}`)
	)
	const dataMonths = Math.max(transactionMonths.size, 1)
	const divisor = dataMonths

	// ─── Monthly income / expenses ────────────────────────────────────
	let totalIncome = 0
	let totalExpenses = 0
	const categoryMap = new Map<
		string,
		{
			categoryId: string
			categoryName: string
			categoryColor: string
			categoryIcon: string
			isAvoidable: boolean
			isRecurring: boolean
			alertThreshold: number | null
			total: number
		}
	>()

	for (const tx of recentTransactions) {
		if (tx.type === TransactionType.INCOME) {
			totalIncome += tx.amount
		} else if (tx.type === TransactionType.EXPENSE) {
			totalExpenses += tx.amount

			const existing = categoryMap.get(tx.categoryId)
			if (existing) {
				existing.total += tx.amount
			} else {
				categoryMap.set(tx.categoryId, {
					categoryId: tx.category.id,
					categoryName: tx.category.name,
					categoryColor: tx.category.color,
					categoryIcon: tx.category.icon,
					isAvoidable: tx.category.isAvoidable,
					isRecurring: tx.category.isRecurring,
					alertThreshold: tx.category.alertThreshold,
					total: tx.amount,
				})
			}
		}
	}

	const monthlyIncome = Math.round(totalIncome / divisor)
	const monthlyExpenses = Math.round(totalExpenses / divisor)

	const expensesByCategory: CategoryExpense[] = Array.from(categoryMap.values()).map((c) => ({
		categoryId: c.categoryId,
		categoryName: c.categoryName,
		categoryColor: c.categoryColor,
		categoryIcon: c.categoryIcon,
		isAvoidable: c.isAvoidable,
		isRecurring: c.isRecurring,
		alertThreshold: c.alertThreshold,
		monthlyAverage: Math.round(c.total / divisor),
	}))

	// ─── Credit cards with usage ──────────────────────────────────────
	const creditCardSnapshots: CreditCardSnapshot[] = await Promise.all(
		creditCards.map(async (card) => {
			const { start, end } = getCurrentCycleRange(card.closingDay, card.paymentDay)
			const result = await prisma.transaction.aggregate({
				where: {
					creditCardId: card.id,
					type: TransactionType.EXPENSE,
					isTemplate: false,
					date: { gte: start, lte: end },
				},
				_sum: { amount: true },
			})
			const used = result._sum.amount ?? 0
			return {
				id: card.id,
				name: card.name,
				lastFourDigits: card.lastFourDigits,
				totalLimit: card.totalLimit,
				usedLimit: used,
				availableLimit: Math.max(0, card.totalLimit - used),
				closingDay: card.closingDay,
				paymentDay: card.paymentDay,
			}
		})
	)

	// ─── Outstanding installments ─────────────────────────────────────
	const installmentMap = new Map<
		string,
		{
			description: string
			creditCardId: string | null
			amounts: number[]
		}
	>()

	for (const tx of installmentParents) {
		if (!tx.parentTransactionId) continue
		const existing = installmentMap.get(tx.parentTransactionId)
		if (existing) {
			existing.amounts.push(tx.amount)
		} else {
			installmentMap.set(tx.parentTransactionId, {
				description: tx.description,
				creditCardId: tx.creditCardId,
				amounts: [tx.amount],
			})
		}
	}

	const outstandingInstallments: OutstandingInstallment[] = Array.from(
		installmentMap.entries()
	).map(([parentId, data]) => ({
		parentTransactionId: parentId,
		description: data.description,
		creditCardId: data.creditCardId,
		remainingPayments: data.amounts.length,
		monthlyAmount: data.amounts.length > 0 ? data.amounts[0]! : 0,
		totalRemaining: data.amounts.reduce((sum, a) => sum + a, 0),
	}))

	// ─── Recurring obligations ────────────────────────────────────────
	const recurringObligations: RecurringObligation[] = recurringTemplates
		.filter((t) => t.recurrenceRule !== null)
		.map((t) => {
			const rule = t.recurrenceRule!
			const monthlyAmount = Math.round(
				t.amount * getMonthlyMultiplier(rule.frequency, rule.interval)
			)
			return {
				id: t.id,
				description: t.description,
				type: t.type as "INCOME" | "EXPENSE",
				monthlyAmount,
			}
		})

	// ─── Goals ────────────────────────────────────────────────────────
	const goalSnapshots: GoalSnapshot[] = goals.map((g) => {
		const currentAmount = g.contributions.reduce((sum, c) => sum + c.amount, 0)
		return {
			id: g.id,
			name: g.name,
			targetAmount: g.targetAmount,
			currentAmount,
			targetDate: g.targetDate,
			remaining: Math.max(0, g.targetAmount - currentAmount),
		}
	})

	// ─── Investment total ─────────────────────────────────────────────
	const totalInvestmentValue = investmentAgg._sum.currentValue ?? 0

	return {
		monthlyIncome,
		monthlyExpenses,
		expensesByCategory,
		creditCards: creditCardSnapshots,
		outstandingInstallments,
		recurringObligations,
		goals: goalSnapshots,
		totalInvestmentValue,
		dataMonths,
		isLimitedData: dataMonths < 3,
	}
}
