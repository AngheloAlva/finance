import { AlertType, AlertSeverity, GoalStatus, TransactionType } from "@/generated/prisma/enums"

import { prisma } from "@/shared/lib/prisma"
import { centsToDisplay } from "@/shared/lib/formatters"
import { checkBudgetThresholds } from "@/features/budgets/lib/budget-alerts"
import { getCurrentCycleRange } from "@/features/credit-cards/lib/billing-cycle.utils"
import type {
	TransactionAlertContext,
	GoalAlertContext,
	InvestmentAlertContext,
} from "@/features/alerts/types/alerts.types"

function getDeduplicationMonth(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	return `${year}-${month}`
}

function getMonthRange(date: Date): { start: Date; end: Date } {
	const year = date.getFullYear()
	const month = date.getMonth()
	return {
		start: new Date(year, month, 1),
		end: new Date(year, month + 1, 1),
	}
}

async function getCurrentMonthSum(
	userId: string,
	categoryId: string,
	impactDate: Date
): Promise<number> {
	const { start, end } = getMonthRange(impactDate)

	const result = await prisma.transaction.aggregate({
		where: {
			userId,
			categoryId,
			type: TransactionType.EXPENSE,
			isTemplate: false,
			impactDate: { gte: start, lt: end },
		},
		_sum: { amount: true },
	})

	return Math.abs(result._sum.amount ?? 0)
}

export async function checkCategoryThreshold(context: TransactionAlertContext): Promise<void> {
	const { userId, categoryId, impactDate } = context

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { name: true, alertThreshold: true },
	})

	if (!category?.alertThreshold || category.alertThreshold === 0) return

	const currentSum = await getCurrentMonthSum(userId, categoryId, impactDate)

	if (currentSum <= category.alertThreshold) return

	const deduplicationKey = getDeduplicationMonth(impactDate)
	const formattedThreshold = centsToDisplay(category.alertThreshold)

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.CATEGORY_THRESHOLD_EXCEEDED,
				referenceId: categoryId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.CATEGORY_THRESHOLD_EXCEEDED,
			message: `Spending in ${category.name} exceeded your threshold of $${formattedThreshold} this month`,
			severity: AlertSeverity.WARNING,
			referenceType: "category",
			referenceId: categoryId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Spending in ${category.name} exceeded your threshold of $${formattedThreshold} this month`,
			severity: AlertSeverity.WARNING,
			updatedAt: new Date(),
		},
	})
}

export async function checkSpendingSpike(context: TransactionAlertContext): Promise<void> {
	const { userId, categoryId, impactDate } = context

	const category = await prisma.category.findUnique({
		where: { id: categoryId },
		select: { name: true, alertThreshold: true },
	})

	if (!category?.alertThreshold) return

	const currentSum = await getCurrentMonthSum(userId, categoryId, impactDate)

	const currentYear = impactDate.getFullYear()
	const currentMonth = impactDate.getMonth()

	// Build date ranges for the 3 months before the current one
	const previousMonths: Array<{ start: Date; end: Date }> = []
	for (let i = 1; i <= 3; i++) {
		const d = new Date(currentYear, currentMonth - i, 1)
		previousMonths.push({
			start: d,
			end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
		})
	}

	const monthlySums = await prisma.transaction.groupBy({
		by: ["impactDate"],
		where: {
			userId,
			categoryId,
			type: TransactionType.EXPENSE,
			isTemplate: false,
			OR: previousMonths.map(({ start, end }) => ({
				impactDate: { gte: start, lt: end },
			})),
		},
		_sum: { amount: true },
	})

	// Aggregate per-month from the groupBy results
	const monthBuckets = new Map<string, number>()
	for (const row of monthlySums) {
		const date = row.impactDate instanceof Date ? row.impactDate : new Date(row.impactDate)
		const key = `${date.getFullYear()}-${date.getMonth()}`
		const current = monthBuckets.get(key) ?? 0
		monthBuckets.set(key, current + Math.abs(row._sum.amount ?? 0))
	}

	// Need at least 3 months of historical data
	if (monthBuckets.size < 3) return

	const monthlyValues = Array.from(monthBuckets.values())
	const average = monthlyValues.reduce((sum, v) => sum + v, 0) / monthlyValues.length

	if (average === 0 || currentSum <= average * 1.5) return

	const deduplicationKey = getDeduplicationMonth(impactDate)
	const formattedCurrent = centsToDisplay(currentSum)
	const formattedAverage = centsToDisplay(Math.round(average))

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.CATEGORY_SPENDING_SPIKE,
				referenceId: categoryId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.CATEGORY_SPENDING_SPIKE,
			message: `Unusual spending spike in ${category.name}: $${formattedCurrent} vs average $${formattedAverage}`,
			severity: AlertSeverity.CRITICAL,
			referenceType: "category",
			referenceId: categoryId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Unusual spending spike in ${category.name}: $${formattedCurrent} vs average $${formattedAverage}`,
			severity: AlertSeverity.CRITICAL,
			updatedAt: new Date(),
		},
	})
}

interface CreditCardAlertInput {
	id: string
	name: string
	totalLimit: number
	closingDay: number
	paymentDay: number
}

export async function checkCreditCardAlerts(
	creditCards: CreditCardAlertInput[],
	userId: string
): Promise<void> {
	const today = new Date()
	const deduplicationKey = getDeduplicationMonth(today)

	await Promise.all(creditCards.map(async (card) => {
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

		const usedLimit = Math.abs(result._sum.amount ?? 0)
		const usageRatio = usedLimit / card.totalLimit

		// High usage alert: > 95%
		if (usageRatio > 0.95) {
			await prisma.alert.upsert({
				where: {
					userId_type_referenceId_deduplicationKey: {
						userId,
						type: AlertType.CREDIT_CARD_HIGH_USAGE,
						referenceId: card.id,
						deduplicationKey,
					},
				},
				create: {
					type: AlertType.CREDIT_CARD_HIGH_USAGE,
					message: `Credit card ${card.name} is at ${Math.round(usageRatio * 100)}% usage`,
					severity: AlertSeverity.CRITICAL,
					referenceType: "creditCard",
					referenceId: card.id,
					deduplicationKey,
					userId,
				},
				update: {
					message: `Credit card ${card.name} is at ${Math.round(usageRatio * 100)}% usage`,
					severity: AlertSeverity.CRITICAL,
					updatedAt: new Date(),
				},
			})
		}

		// Payment due alert: payment day within 3 days AND has outstanding balance
		if (usedLimit > 0) {
			const todayMonth = today.getMonth()
			const todayYear = today.getFullYear()

			// Calculate days until payment day in the current or next month
			let paymentDate = new Date(todayYear, todayMonth, card.paymentDay)
			if (paymentDate < today) {
				// Payment day already passed this month, check next month
				paymentDate = new Date(todayYear, todayMonth + 1, card.paymentDay)
			}

			const diffMs = paymentDate.getTime() - today.getTime()
			const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

			if (diffDays >= 0 && diffDays <= 3) {
				await prisma.alert.upsert({
					where: {
						userId_type_referenceId_deduplicationKey: {
							userId,
							type: AlertType.CREDIT_CARD_PAYMENT_DUE,
							referenceId: card.id,
							deduplicationKey,
						},
					},
					create: {
						type: AlertType.CREDIT_CARD_PAYMENT_DUE,
						message: `Payment for ${card.name} is due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
						severity: AlertSeverity.WARNING,
						referenceType: "creditCard",
						referenceId: card.id,
						deduplicationKey,
						userId,
					},
					update: {
						message: `Payment for ${card.name} is due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
						severity: AlertSeverity.WARNING,
						updatedAt: new Date(),
					},
				})
			}
		}
	}))
}

export async function generateAlertsForTransaction(
	context: TransactionAlertContext
): Promise<void> {
	try {
		await Promise.all([
			checkCategoryThreshold(context),
			checkSpendingSpike(context),
			checkBudgetThresholds(context),
		])
	} catch (error) {
		console.error("Failed to generate alerts for transaction:", error)
	}
}

// ---------------------------------------------------------------------------
// Shared helper: average monthly income
// ---------------------------------------------------------------------------

async function getAverageMonthlyIncome(
	userId: string,
	months = 3
): Promise<{ average: number; monthsWithIncome: number }> {
	const now = new Date()
	const ranges = Array.from({ length: months }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1)
		return {
			start: d,
			end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
		}
	})

	const results = await Promise.all(
		ranges.map(({ start, end }) =>
			prisma.transaction.aggregate({
				where: {
					userId,
					type: TransactionType.INCOME,
					isTemplate: false,
					impactDate: { gte: start, lt: end },
				},
				_sum: { amount: true },
			})
		)
	)

	const totals = results.map((r) => r._sum.amount ?? 0)
	const nonZeroMonths = totals.filter((t) => t > 0)
	if (nonZeroMonths.length === 0) return { average: 0, monthsWithIncome: 0 }
	return {
		average: nonZeroMonths.reduce((sum, v) => sum + v, 0) / nonZeroMonths.length,
		monthsWithIncome: nonZeroMonths.length,
	}
}

// ---------------------------------------------------------------------------
// Goal alerts
// ---------------------------------------------------------------------------

export async function checkGoalMilestone(context: GoalAlertContext): Promise<void> {
	const { goalId, userId, goalName, targetAmount, totalContributed } = context

	if (targetAmount === 0) return

	const percentage = (totalContributed / targetAmount) * 100
	const milestones = [25, 50, 75].filter((m) => percentage >= m)

	for (const milestone of milestones) {
		const deduplicationKey = `milestone-${milestone}`

		await prisma.alert.upsert({
			where: {
				userId_type_referenceId_deduplicationKey: {
					userId,
					type: AlertType.GOAL_MILESTONE,
					referenceId: goalId,
					deduplicationKey,
				},
			},
			create: {
				type: AlertType.GOAL_MILESTONE,
				message: `Your goal "${goalName}" reached ${milestone}%! Current progress: $${centsToDisplay(totalContributed)} of $${centsToDisplay(targetAmount)}`,
				severity: AlertSeverity.INFO,
				referenceType: "goal",
				referenceId: goalId,
				deduplicationKey,
				userId,
			},
			update: {
				message: `Your goal "${goalName}" reached ${milestone}%! Current progress: $${centsToDisplay(totalContributed)} of $${centsToDisplay(targetAmount)}`,
				updatedAt: new Date(),
			},
		})
	}
}

export async function checkGoalDeadlineApproaching(context: GoalAlertContext): Promise<void> {
	const { goalId, userId, goalName, targetDate, status } = context

	if (!targetDate) return
	if (status !== GoalStatus.ACTIVE) return

	const today = new Date()
	const diffMs = targetDate.getTime() - today.getTime()
	const daysUntilDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

	if (daysUntilDeadline < 0 || daysUntilDeadline > 7) return

	const deduplicationKey = getDeduplicationMonth(today)

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.GOAL_DEADLINE_APPROACHING,
				referenceId: goalId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.GOAL_DEADLINE_APPROACHING,
			message: `Goal "${goalName}" deadline is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`,
			severity: AlertSeverity.WARNING,
			referenceType: "goal",
			referenceId: goalId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Goal "${goalName}" deadline is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`,
			severity: AlertSeverity.WARNING,
			updatedAt: new Date(),
		},
	})
}

export async function checkGoalCompleted(context: GoalAlertContext): Promise<void> {
	const { goalId, userId, goalName, targetAmount, totalContributed } = context

	if (totalContributed < targetAmount) return

	const deduplicationKey = "completed"

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.GOAL_COMPLETED,
				referenceId: goalId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.GOAL_COMPLETED,
			message: `Congratulations! Goal "${goalName}" is complete! You saved $${centsToDisplay(totalContributed)}`,
			severity: AlertSeverity.INFO,
			referenceType: "goal",
			referenceId: goalId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Congratulations! Goal "${goalName}" is complete! You saved $${centsToDisplay(totalContributed)}`,
			updatedAt: new Date(),
		},
	})
}

// ---------------------------------------------------------------------------
// Financial health alerts
// ---------------------------------------------------------------------------

export async function checkNegativeBalanceRisk(userId: string): Promise<void> {
	const now = new Date()
	const deduplicationKey = getDeduplicationMonth(now)

	// Get last 3 months of income and expense totals
	const ranges = Array.from({ length: 3 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1)
		return {
			start: d,
			end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
		}
	})

	const [incomeResults, expenseResults] = await Promise.all([
		Promise.all(
			ranges.map(({ start, end }) =>
				prisma.transaction.aggregate({
					where: {
						userId,
						type: TransactionType.INCOME,
						isTemplate: false,
						impactDate: { gte: start, lt: end },
					},
					_sum: { amount: true },
				})
			)
		),
		Promise.all(
			ranges.map(({ start, end }) =>
				prisma.transaction.aggregate({
					where: {
						userId,
						type: TransactionType.EXPENSE,
						isTemplate: false,
						impactDate: { gte: start, lt: end },
					},
					_sum: { amount: true },
				})
			)
		),
	])

	const incomeTotals = incomeResults.map((r) => r._sum.amount ?? 0)
	const expenseTotals = expenseResults.map((r) => Math.abs(r._sum.amount ?? 0))

	// Need at least 3 months of data (check if any month has transactions)
	const monthsWithData = incomeTotals.map((inc, i) => inc > 0 || expenseTotals[i] > 0)
	if (monthsWithData.filter(Boolean).length < 3) return

	const avgIncome = incomeTotals.reduce((s, v) => s + v, 0) / 3
	const avgExpense = expenseTotals.reduce((s, v) => s + v, 0) / 3
	const avgMonthlyNet = avgIncome - avgExpense

	// If net is positive or zero, no risk
	if (avgMonthlyNet >= 0) return

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.NEGATIVE_BALANCE_RISK,
				referenceId: userId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.NEGATIVE_BALANCE_RISK,
			message: `Your projected balance may go negative within 30 days based on recent spending trends. Average monthly deficit: $${centsToDisplay(Math.abs(avgMonthlyNet))}`,
			severity: AlertSeverity.CRITICAL,
			referenceType: "user",
			referenceId: userId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Your projected balance may go negative within 30 days based on recent spending trends. Average monthly deficit: $${centsToDisplay(Math.abs(avgMonthlyNet))}`,
			severity: AlertSeverity.CRITICAL,
			updatedAt: new Date(),
		},
	})
}

export async function checkFutureOverload(userId: string): Promise<void> {
	const now = new Date()
	const deduplicationKey = getDeduplicationMonth(now)

	const { average: avgIncome, monthsWithIncome } = await getAverageMonthlyIncome(userId)

	if (avgIncome === 0 || monthsWithIncome < 3) return

	const thirtyDaysFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)

	// Sum upcoming installments in next 30 days
	const installmentResult = await prisma.transaction.aggregate({
		where: {
			userId,
			type: TransactionType.EXPENSE,
			isTemplate: false,
			parentTransactionId: { not: null },
			impactDate: { gte: now, lt: thirtyDaysFromNow },
		},
		_sum: { amount: true },
	})

	// Sum upcoming recurring expenses (templates with nextGenerationDate in next 30 days)
	const recurringTemplates = await prisma.transaction.findMany({
		where: {
			userId,
			type: TransactionType.EXPENSE,
			isTemplate: true,
			recurrenceRule: {
				isActive: true,
				nextGenerationDate: { gte: now, lt: thirtyDaysFromNow },
			},
		},
		select: { amount: true },
	})

	const installmentTotal = Math.abs(installmentResult._sum.amount ?? 0)
	const recurringTotal = recurringTemplates.reduce((sum, t) => sum + Math.abs(t.amount), 0)
	const totalObligations = installmentTotal + recurringTotal

	if (totalObligations <= avgIncome) return

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.FUTURE_OVERLOAD,
				referenceId: userId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.FUTURE_OVERLOAD,
			message: `Upcoming obligations ($${centsToDisplay(totalObligations)}) in the next 30 days exceed your average monthly income ($${centsToDisplay(avgIncome)})`,
			severity: AlertSeverity.WARNING,
			referenceType: "user",
			referenceId: userId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Upcoming obligations ($${centsToDisplay(totalObligations)}) in the next 30 days exceed your average monthly income ($${centsToDisplay(avgIncome)})`,
			severity: AlertSeverity.WARNING,
			updatedAt: new Date(),
		},
	})
}

export async function checkExcessiveInstallments(userId: string): Promise<void> {
	const now = new Date()
	const deduplicationKey = getDeduplicationMonth(now)
	const { start, end } = getMonthRange(now)

	const { average: avgIncome, monthsWithIncome } = await getAverageMonthlyIncome(userId)

	if (avgIncome === 0 || monthsWithIncome < 3) return

	// Sum installment payments in current month
	const installmentResult = await prisma.transaction.aggregate({
		where: {
			userId,
			type: TransactionType.EXPENSE,
			isTemplate: false,
			totalInstallments: { not: null },
			impactDate: { gte: start, lt: end },
		},
		_sum: { amount: true },
	})

	const installmentTotal = Math.abs(installmentResult._sum.amount ?? 0)

	if (installmentTotal === 0) return

	const percentage = (installmentTotal / avgIncome) * 100

	if (percentage <= 40) return

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.EXCESSIVE_INSTALLMENTS,
				referenceId: userId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.EXCESSIVE_INSTALLMENTS,
			message: `Monthly installment payments ($${centsToDisplay(installmentTotal)}) represent ${Math.round(percentage)}% of your average income ($${centsToDisplay(avgIncome)})`,
			severity: AlertSeverity.WARNING,
			referenceType: "user",
			referenceId: userId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Monthly installment payments ($${centsToDisplay(installmentTotal)}) represent ${Math.round(percentage)}% of your average income ($${centsToDisplay(avgIncome)})`,
			severity: AlertSeverity.WARNING,
			updatedAt: new Date(),
		},
	})
}

export async function checkMissingIncome(userId: string): Promise<void> {
	const now = new Date()

	// Only check from the 15th onwards
	if (now.getDate() < 15) return

	const deduplicationKey = getDeduplicationMonth(now)
	const { start, end } = getMonthRange(now)

	// Check if income already exists this month
	const currentMonthIncome = await prisma.transaction.count({
		where: {
			userId,
			type: TransactionType.INCOME,
			isTemplate: false,
			impactDate: { gte: start, lt: end },
		},
	})

	if (currentMonthIncome > 0) return

	// Check last 3 months for income pattern
	const ranges = Array.from({ length: 3 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1)
		return {
			start: d,
			end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
		}
	})

	const monthCounts = await Promise.all(
		ranges.map(({ start: s, end: e }) =>
			prisma.transaction.count({
				where: {
					userId,
					type: TransactionType.INCOME,
					isTemplate: false,
					impactDate: { gte: s, lt: e },
				},
			})
		)
	)

	const monthsWithIncome = monthCounts.filter((c) => c > 0).length

	// Need at least 3 of last 3 months with income (regular pattern)
	if (monthsWithIncome < 3) return

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.MISSING_INCOME,
				referenceId: userId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.MISSING_INCOME,
			message:
				"No income recorded this month yet. You usually have income by now — check if expected payments have been received",
			severity: AlertSeverity.WARNING,
			referenceType: "user",
			referenceId: userId,
			deduplicationKey,
			userId,
		},
		update: {
			message:
				"No income recorded this month yet. You usually have income by now — check if expected payments have been received",
			severity: AlertSeverity.WARNING,
			updatedAt: new Date(),
		},
	})
}

// ---------------------------------------------------------------------------
// Investment alerts
// ---------------------------------------------------------------------------

export async function checkInvestmentSignificantChange(
	context: InvestmentAlertContext
): Promise<void> {
	const { investmentId, userId, investmentName, initialAmount, currentValue } = context

	if (initialAmount === 0) return

	const changePercent = ((currentValue - initialAmount) / initialAmount) * 100

	if (Math.abs(changePercent) <= 10) return

	const isGain = changePercent > 0
	const severity = isGain ? AlertSeverity.INFO : AlertSeverity.WARNING
	const direction = isGain ? "gained" : "lost"
	const now = new Date()
	const deduplicationKey = getDeduplicationMonth(now)

	await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId,
				type: AlertType.INVESTMENT_SIGNIFICANT_CHANGE,
				referenceId: investmentId,
				deduplicationKey,
			},
		},
		create: {
			type: AlertType.INVESTMENT_SIGNIFICANT_CHANGE,
			message: `Investment "${investmentName}" has ${direction} ${Math.abs(Math.round(changePercent))}% from its initial value`,
			severity,
			referenceType: "investment",
			referenceId: investmentId,
			deduplicationKey,
			userId,
		},
		update: {
			message: `Investment "${investmentName}" has ${direction} ${Math.abs(Math.round(changePercent))}% from its initial value`,
			severity,
			updatedAt: new Date(),
		},
	})
}

// ---------------------------------------------------------------------------
// Orchestration functions
// ---------------------------------------------------------------------------

export async function generateAlertsForContribution(goalId: string, userId: string): Promise<void> {
	try {
		const goal = await prisma.goal.findUnique({
			where: { id: goalId },
			select: {
				id: true,
				name: true,
				targetAmount: true,
				targetDate: true,
				status: true,
			},
		})

		if (!goal) return

		const aggregation = await prisma.goalContribution.aggregate({
			where: { goalId },
			_sum: { amount: true },
		})

		const totalContributed = aggregation._sum.amount ?? 0

		const context: GoalAlertContext = {
			goalId: goal.id,
			userId,
			goalName: goal.name,
			targetAmount: goal.targetAmount,
			totalContributed,
			targetDate: goal.targetDate,
			status: goal.status,
		}

		await Promise.all([
			checkGoalMilestone(context),
			checkGoalDeadlineApproaching(context),
			checkGoalCompleted(context),
		])
	} catch (error) {
		console.error("Failed to generate alerts for contribution:", error)
	}
}

export async function checkInvestmentAlerts(investmentId: string, userId: string): Promise<void> {
	try {
		const investment = await prisma.investment.findUnique({
			where: { id: investmentId },
			select: {
				id: true,
				name: true,
				initialAmount: true,
				currentValue: true,
			},
		})

		if (!investment) return

		const context: InvestmentAlertContext = {
			investmentId: investment.id,
			userId,
			investmentName: investment.name,
			initialAmount: investment.initialAmount,
			currentValue: investment.currentValue,
		}

		await checkInvestmentSignificantChange(context)
	} catch (error) {
		console.error("Failed to generate alerts for investment:", error)
	}
}

export async function checkFinancialHealthAlerts(userId: string): Promise<void> {
	try {
		await Promise.all([
			checkNegativeBalanceRisk(userId),
			checkFutureOverload(userId),
			checkExcessiveInstallments(userId),
			checkMissingIncome(userId),
		])
	} catch (error) {
		console.error("Failed to generate financial health alerts:", error)
	}
}
