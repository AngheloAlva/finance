"use server"

import { revalidatePath } from "next/cache"

import { createRuleSchema } from "@/features/categorization/lib/categorization.schema"
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function createRuleAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const raw = {
		pattern: formData.get("pattern"),
		matchType: formData.get("matchType") || undefined,
		categoryId: formData.get("categoryId"),
	}

	const result = createRuleSchema.safeParse(raw)
	if (!result.success) return formatZodErrors(result.error)

	const { pattern, matchType, categoryId } = result.data
	const session = await requireSession()

	try {
		const categoryCheck = await assertCategoryAccess(categoryId, session.user.id)
		if (!categoryCheck.success) return categoryCheck

		await prisma.categorizationRule.create({
			data: {
				pattern: pattern.trim().toLowerCase(),
				matchType,
				categoryId,
				userId: session.user.id,
			},
		})

		revalidatePath("/settings")

		return { success: true, data: undefined }
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return { success: false, error: "RULE_ALREADY_EXISTS" }
		}
		return { success: false, error: "RULE_CREATE_FAILED" }
	}
}
