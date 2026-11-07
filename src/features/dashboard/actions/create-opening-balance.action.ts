"use server"

import { revalidatePath } from "next/cache"

import { OPENING_BALANCE_CATEGORY_ID } from "@/features/categories/lib/system-categories"
import { createTransactionSchema } from "@/features/transactions/lib/transactions.schema"
import { PaymentMethod, TransactionType } from "@/generated/prisma/enums"
import { formatZodErrors } from "@/shared/lib/action-utils"
import { requireSession } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import type { ActionResult } from "@/shared/types/common.types"

const openingBalanceSchema = createTransactionSchema.pick({
	amount: true,
	date: true,
	description: true,
})

/**
 * Records the money a new user starts with, from the amount alone. It is a
 * TRANSFER in the opening-balance category, so it raises the accumulated
 * balance without counting as income for the month. One per account.
 */
export async function createOpeningBalanceAction(
	_prevState: ActionResult<void>,
	formData: FormData,
): Promise<ActionResult<void>> {
	const result = openingBalanceSchema.safeParse({
		amount: formData.get("amount"),
		date: formData.get("date"),
		description: formData.get("description"),
	})

	if (!result.success) {
		return formatZodErrors(result.error)
	}

	const { amount, date, description } = result.data
	const session = await requireSession()

	try {
		const existing = await prisma.transaction.findFirst({
			where: { userId: session.user.id, categoryId: OPENING_BALANCE_CATEGORY_ID },
			select: { id: true },
		})
		if (existing) {
			return { success: false, error: "OPENING_BALANCE_EXISTS" }
		}

		await prisma.transaction.create({
			data: {
				amount,
				description,
				date,
				impactDate: date,
				type: TransactionType.TRANSFER,
				paymentMethod: PaymentMethod.OTHER,
				categoryId: OPENING_BALANCE_CATEGORY_ID,
				userId: session.user.id,
			},
		})
	} catch {
		return { success: false, error: "OPENING_BALANCE_CREATE_FAILED" }
	}

	revalidatePath("/")
	revalidatePath("/transactions")

	return { success: true, data: undefined }
}
