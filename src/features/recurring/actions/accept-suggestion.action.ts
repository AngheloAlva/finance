"use server"

import { revalidatePath } from "next/cache"

import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils"
import { computeNextDate } from "@/features/recurring/lib/recurring.utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

interface AcceptSuggestionInput {
	templateId: string
	amount?: number
}

export async function acceptSuggestionAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const templateId = formData.get("templateId") as string | null
	const rawAmount = formData.get("amount") as string | null

	if (!templateId) {
		return { success: false, error: "SUGGESTION_MISSING_TEMPLATE" }
	}

	const session = await requireSession()

	try {
		const template = await prisma.transaction.findUnique({
			where: { id: templateId },
			include: { recurrenceRule: true, creditCard: true },
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

		const amount = rawAmount ? parseInt(rawAmount, 10) : template.amount
		const transactionDate = new Date(rule.nextGenerationDate)

		let impactDate = transactionDate
		if (template.creditCard) {
			const { paymentDueDate } = computeStatementDates(
				template.creditCard.closingDay,
				template.creditCard.paymentDay,
				transactionDate,
			)
			impactDate = paymentDueDate
		}

		const nextDate = computeNextDate(transactionDate, rule.frequency, rule.interval)
		const shouldDeactivate = rule.endDate && nextDate > rule.endDate

		await prisma.$transaction([
			prisma.transaction.create({
				data: {
					amount,
					description: template.description,
					notes: template.notes,
					date: transactionDate,
					impactDate,
					type: template.type,
					paymentMethod: template.paymentMethod,
					categoryId: template.categoryId,
					userId: template.userId,
					isTemplate: false,
					generatedFromId: template.id,
					creditCardId: template.creditCardId,
				},
			}),
			prisma.recurrenceRule.update({
				where: { id: rule.id },
				data: {
					nextGenerationDate: nextDate,
					...(shouldDeactivate && { isActive: false }),
				},
			}),
		])

		revalidatePath("/")
		revalidatePath("/transactions")
		revalidatePath("/recurring")

		return { success: true, data: undefined }
	} catch {
		return { success: false, error: "SUGGESTION_ACCEPT_FAILED" }
	}
}
