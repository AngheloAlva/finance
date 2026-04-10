"use server"

import { revalidatePath } from "next/cache"

import { MatchType } from "@/generated/prisma/enums"
import { assertCategoryAccess } from "@/features/categories/lib/categories.queries"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

/**
 * Called from the client after a transaction is created, to learn a new rule
 * from the description → category pairing. Silently no-ops if a rule with the
 * same pattern already exists for the user.
 */
export async function learnFromTransactionAction(
	description: string,
	categoryId: string,
): Promise<ActionResult<void>> {
	if (!description || description.trim().length === 0) {
		return { success: false, error: "RULE_EMPTY_PATTERN" }
	}

	const session = await requireSession()

	try {
		const categoryCheck = await assertCategoryAccess(categoryId, session.user.id)
		if (!categoryCheck.success) return categoryCheck

		const pattern = description.trim().toLowerCase()

		const existing = await prisma.categorizationRule.findUnique({
			where: { userId_pattern: { userId: session.user.id, pattern } },
		})

		if (existing) {
			// Silently bump hit count instead of failing
			await prisma.categorizationRule.update({
				where: { id: existing.id },
				data: { hitCount: { increment: 1 } },
			})
			return { success: true, data: undefined }
		}

		await prisma.categorizationRule.create({
			data: {
				pattern,
				matchType: MatchType.CONTAINS,
				categoryId,
				userId: session.user.id,
				hitCount: 1,
			},
		})

		revalidatePath("/settings")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "RULE_CREATE_FAILED" }
	}
}
