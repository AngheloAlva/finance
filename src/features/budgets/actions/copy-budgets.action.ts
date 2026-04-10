"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function copyBudgetsAction(
	_prevState: ActionResult<number>,
	formData: FormData,
): Promise<ActionResult<number>> {
	const month = parseInt(formData.get("month") as string, 10)
	const year = parseInt(formData.get("year") as string, 10)

	if (Number.isNaN(month) || Number.isNaN(year)) {
		return { success: false, error: "BUDGET_COPY_INVALID_PARAMS" }
	}

	const session = await requireSession()

	// Compute previous month
	const prevMonth = month === 1 ? 12 : month - 1
	const prevYear = month === 1 ? year - 1 : year

	try {
		const previousBudgets = await prisma.budget.findMany({
			where: { userId: session.user.id, month: prevMonth, year: prevYear },
		})

		if (previousBudgets.length === 0) {
			return { success: false, error: "BUDGET_COPY_NO_PREVIOUS" }
		}

		// Check which budgets already exist for the target month
		const existing = await prisma.budget.findMany({
			where: { userId: session.user.id, month, year },
			select: { categoryId: true },
		})
		const existingCategories = new Set(existing.map((b) => b.categoryId))

		const toCreate = previousBudgets
			.filter((b) => !existingCategories.has(b.categoryId))
			.map((b) => ({
				amount: b.amount,
				month,
				year,
				categoryId: b.categoryId,
				userId: session.user.id,
			}))

		if (toCreate.length > 0) {
			await prisma.budget.createMany({ data: toCreate })
		}

		revalidatePath("/budgets")
		revalidatePath("/")

		return { success: true, data: toCreate.length }
	} catch {
		return { success: false, error: "BUDGET_COPY_FAILED" }
	}
}
