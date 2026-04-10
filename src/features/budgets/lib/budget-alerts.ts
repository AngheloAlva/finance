import { AlertSeverity, AlertType, TransactionType } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"
import { centsToDisplay } from "@/shared/lib/formatters"

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

	if (percentage >= 100) {
		const formattedBudget = centsToDisplay(budget.amount)

		await prisma.alert.upsert({
			where: {
				userId_type_referenceId_deduplicationKey: {
					userId,
					type: AlertType.BUDGET_EXCEEDED,
					referenceId: budget.id,
					deduplicationKey,
				},
			},
			create: {
				type: AlertType.BUDGET_EXCEEDED,
				message: `Budget exceeded for ${budget.category.name}: spent over $${formattedBudget} limit`,
				severity: AlertSeverity.CRITICAL,
				referenceType: "budget",
				referenceId: budget.id,
				deduplicationKey,
				userId,
			},
			update: {
				message: `Budget exceeded for ${budget.category.name}: spent over $${formattedBudget} limit`,
				severity: AlertSeverity.CRITICAL,
				updatedAt: new Date(),
			},
		})
	} else if (percentage >= 80) {
		const formattedBudget = centsToDisplay(budget.amount)

		await prisma.alert.upsert({
			where: {
				userId_type_referenceId_deduplicationKey: {
					userId,
					type: AlertType.BUDGET_WARNING,
					referenceId: budget.id,
					deduplicationKey,
				},
			},
			create: {
				type: AlertType.BUDGET_WARNING,
				message: `Budget warning for ${budget.category.name}: ${Math.round(percentage)}% of $${formattedBudget} used`,
				severity: AlertSeverity.WARNING,
				referenceType: "budget",
				referenceId: budget.id,
				deduplicationKey,
				userId,
			},
			update: {
				message: `Budget warning for ${budget.category.name}: ${Math.round(percentage)}% of $${formattedBudget} used`,
				severity: AlertSeverity.WARNING,
				updatedAt: new Date(),
			},
		})
	}
}
