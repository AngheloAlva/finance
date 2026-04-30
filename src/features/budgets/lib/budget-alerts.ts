import { AlertSeverity, AlertType, TransactionType } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"
import { centsToDisplay } from "@/shared/lib/formatters"
import { upsertAlertWithPush } from "@/features/alerts/lib/alert-upsert"

import type { TransactionAlertContext } from "@/features/alerts/types/alerts.types"

export async function checkBudgetThresholds(context: TransactionAlertContext): Promise<void> {
	const { userId, categoryId, impactDate } = context

	const month = impactDate.getMonth() + 1
	const year = impactDate.getFullYear()

	const budget = await prisma.budget.findUnique({
		where: {
			userId_categoryId_month_year: {
				userId,
				categoryId,
				month,
				year,
			},
		},
		include: {
			category: { select: { name: true } },
		},
	})

	if (!budget) return

	const start = new Date(year, month - 1, 1)
	const end = new Date(year, month, 1)

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

	const actual = Math.abs(result._sum.amount ?? 0)
	const percentage = budget.amount > 0 ? (actual / budget.amount) * 100 : 0

	const deduplicationKey = `${year}-${String(month).padStart(2, "0")}`
	const formattedBudget = centsToDisplay(budget.amount)

	if (percentage >= 100) {
		await upsertAlertWithPush({
			userId,
			type: AlertType.BUDGET_EXCEEDED,
			referenceType: "budget",
			referenceId: budget.id,
			deduplicationKey,
			message: `Budget exceeded for ${budget.category.name}: spent over $${formattedBudget} limit`,
			severity: AlertSeverity.CRITICAL,
		})
	} else if (percentage >= 80) {
		await upsertAlertWithPush({
			userId,
			type: AlertType.BUDGET_WARNING,
			referenceType: "budget",
			referenceId: budget.id,
			deduplicationKey,
			message: `Budget warning for ${budget.category.name}: ${Math.round(percentage)}% of $${formattedBudget} used`,
			severity: AlertSeverity.WARNING,
		})
	}
}
