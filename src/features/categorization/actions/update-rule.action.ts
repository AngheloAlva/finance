"use server"

import { revalidatePath } from "next/cache"

import { updateRuleSchema } from "@/features/categorization/lib/categorization.schema"
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function updateRuleAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const raw = {
		id: formData.get("id"),
		pattern: formData.get("pattern"),
		matchType: formData.get("matchType") || undefined,
		categoryId: formData.get("categoryId"),
	}

	const result = updateRuleSchema.safeParse(raw)
	if (!result.success) return formatZodErrors(result.error)

	const { id, pattern, matchType, categoryId } = result.data
	const session = await requireSession()

	try {
		const existing = await prisma.categorizationRule.findUnique({ where: { id } })
		if (!existing) return { success: false, error: "RULE_NOT_FOUND" }
		if (existing.userId !== session.user.id) return { success: false, error: "RULE_NOT_OWNED" }

		const categoryCheck = await assertCategoryAccess(categoryId, session.user.id)
		if (!categoryCheck.success) return categoryCheck

		await prisma.categorizationRule.update({
			where: { id },
			data: {
				pattern: pattern.trim().toLowerCase(),
				matchType,
				categoryId,
			},
		})

		revalidatePath("/settings")

		return { success: true, data: undefined }
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return { success: false, error: "RULE_ALREADY_EXISTS" }
		}
		return { success: false, error: "RULE_UPDATE_FAILED" }
	}
}
