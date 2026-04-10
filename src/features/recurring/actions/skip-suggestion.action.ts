"use server"

import { revalidatePath } from "next/cache"

import { computeNextDate } from "@/features/recurring/lib/recurring.utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

export async function skipSuggestionAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const templateId = formData.get("templateId") as string | null

	if (!templateId) {
		return { success: false, error: "SUGGESTION_MISSING_TEMPLATE" }
	}

	const session = await requireSession()

	try {
		const template = await prisma.transaction.findUnique({
			where: { id: templateId },
			include: { recurrenceRule: true },
		})

		if (!template) {
			return { success: false, error: "RECURRING_NOT_FOUND" }
		}

		if (template.userId !== session.user.id) {
			return { success: false, error: "RECURRING_NOT_OWNED" }
		}

		const rule = template.recurrenceRule
		if (!rule || rule.generationMode !== "SUGGEST") {
			return { success: false, error: "SUGGESTION_NOT_SUGGEST_MODE" }
		}

		const nextDate = computeNextDate(
			new Date(rule.nextGenerationDate),
			rule.frequency,
			rule.interval,
		)
		const shouldDeactivate = rule.endDate && nextDate > rule.endDate

		await prisma.recurrenceRule.update({
			where: { id: rule.id },
			data: {
				nextGenerationDate: nextDate,
				...(shouldDeactivate && { isActive: false }),
			},
		})

		revalidatePath("/")
		revalidatePath("/recurring")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "SUGGESTION_SKIP_FAILED" }
	}
}
