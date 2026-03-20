import { PaymentMethod, RecurrenceFrequency, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

const endDateRefinement = (data: { startDate: Date; endDate?: Date }) => {
	if (data.endDate && data.startDate) {
		return data.endDate > data.startDate
	}
	return true
}

const endDateRefinementConfig = {
	message: "endDateAfterStart",
	path: ["endDate"] as string[],
}

const baseRecurringFields = {
	amount: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.positive({ error: "positive" }),
	description: z
		.string()
		.min(1, { error: "required" })
		.max(200, { error: "maxLength200" }),
	notes: z.string().max(500, { error: "maxLength500" }).optional(),
	type: z.nativeEnum(TransactionType, {
		error: "invalidType",
	}),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "invalidPaymentMethod",
	}),
	categoryId: z.string().min(1, { error: "required" }),
	frequency: z.nativeEnum(RecurrenceFrequency, {
		error: "invalidFrequency",
	}),
	interval: z.coerce
		.number()
		.int({ error: "wholeNumber" })
		.min(1, { error: "minInterval1" })
		.max(365, { error: "maxInterval365" })
		.default(1),
	startDate: z.coerce.date({ error: "validDate" }),
	endDate: z.coerce.date({ error: "validDate" }).optional(),
}

export const createRecurringSchema = z
	.object(baseRecurringFields)
	.refine(endDateRefinement, endDateRefinementConfig)

export const updateRecurringSchema = z
	.object({
		...baseRecurringFields,
		id: z.string().min(1, { error: "requiredId" }),
	})
	.refine(endDateRefinement, endDateRefinementConfig)

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>
