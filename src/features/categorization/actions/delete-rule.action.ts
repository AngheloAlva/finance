"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function deleteRuleAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const id = formData.get("id") as string | null
	if (!id) return { success: false, error: "RULE_NOT_FOUND" }

	const session = await requireSession()

	try {
		const existing = await prisma.categorizationRule.findUnique({ where: { id } })
		if (!existing) return { success: false, error: "RULE_NOT_FOUND" }
		if (existing.userId !== session.user.id) return { success: false, error: "RULE_NOT_OWNED" }

		await prisma.categorizationRule.delete({ where: { id } })

		revalidatePath("/settings")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "RULE_DELETE_FAILED" }
	}
}
