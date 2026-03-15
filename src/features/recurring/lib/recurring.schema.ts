import { PaymentMethod, RecurrenceFrequency, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

const endDateRefinement = (data: { startDate: Date; endDate?: Date }) => {
	if (data.endDate && data.startDate) {
		return data.endDate > data.startDate
	}
	return true
}

const endDateRefinementConfig = {
	message: "End date must be after start date",
	path: ["endDate"] as string[],
}

const baseRecurringFields = {
	amount: z.coerce
		.number()
		.int({ error: "Amount must be a valid number" })
		.positive({ error: "Amount must be greater than zero" }),
	description: z
		.string()
		.min(1, { error: "Description is required" })
		.max(200, { error: "Description must be at most 200 characters" }),
	notes: z.string().max(500, { error: "Notes must be at most 500 characters" }).optional(),
	type: z.nativeEnum(TransactionType, {
		error: "Please select a valid transaction type",
	}),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "Please select a valid payment method",
	}),
	categoryId: z.string().min(1, { error: "Category is required" }),
	frequency: z.nativeEnum(RecurrenceFrequency, {
		error: "Please select a valid frequency",
	}),
	interval: z.coerce
		.number()
		.int({ error: "Interval must be a whole number" })
		.min(1, { error: "Interval must be at least 1" })
		.max(365, { error: "Interval must be at most 365" })
		.default(1),
	startDate: z.coerce.date({ error: "A valid start date is required" }),
	endDate: z.coerce.date({ error: "A valid end date is required" }).optional(),
}

export const createRecurringSchema = z
	.object(baseRecurringFields)
	.refine(endDateRefinement, endDateRefinementConfig)

export const updateRecurringSchema = z
	.object({
		...baseRecurringFields,
		id: z.string().min(1, { error: "Template ID is required" }),
	})
	.refine(endDateRefinement, endDateRefinementConfig)

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>
