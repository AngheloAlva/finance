"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function deleteBudgetAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const id = formData.get("id") as string | null
	if (!id) return { success: false, error: "BUDGET_NOT_FOUND" }

	const session = await requireSession()

	try {
		const existing = await prisma.budget.findUnique({ where: { id } })

		if (!existing) return { success: false, error: "BUDGET_NOT_FOUND" }
		if (existing.userId !== session.user.id) return { success: false, error: "BUDGET_NOT_OWNED" }

		await prisma.budget.delete({ where: { id } })

		revalidatePath("/budgets")
		revalidatePath("/")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "BUDGET_DELETE_FAILED" }
	}
}
