"use server"

import { revalidatePath } from "next/cache"

import { upsertBudgetSchema } from "@/features/budgets/lib/budgets.schema"
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function upsertBudgetAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const raw = {
		categoryId: formData.get("categoryId"),
		amount: formData.get("amount"),
		month: formData.get("month"),
		year: formData.get("year"),
	}

	const result = upsertBudgetSchema.safeParse(raw)
	if (!result.success) return formatZodErrors(result.error)

	const { categoryId, amount, month, year } = result.data
	const session = await requireSession()

	try {
		const categoryCheck = await assertCategoryAccess(categoryId, session.user.id)
		if (!categoryCheck.success) return categoryCheck

		await prisma.budget.upsert({
			where: {
				userId_categoryId_month_year: {
					userId: session.user.id,
					categoryId,
					month,
					year,
				},
			},
			create: {
				amount,
				month,
				year,
				categoryId,
				userId: session.user.id,
			},
			update: { amount },
		})

		revalidatePath("/budgets")
		revalidatePath("/")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "BUDGET_UPSERT_FAILED" }
	}
}
