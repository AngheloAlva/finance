import { PaymentMethod, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

export const createTransactionSchema = z.object({
	amount: z.coerce
		.number()
		.int({ error: "Amount must be a valid number" })
		.positive({ error: "Amount must be greater than zero" }),
	description: z
		.string()
		.min(1, { error: "Description is required" })
		.max(200, { error: "Description must be at most 200 characters" }),
	notes: z.string().max(500, { error: "Notes must be at most 500 characters" }).optional(),
	date: z.coerce.date({ error: "A valid date is required" }),
	impactDate: z.coerce.date().optional(),
	type: z.nativeEnum(TransactionType, {
		error: "Please select a valid transaction type",
	}),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "Please select a valid payment method",
	}),
	categoryId: z.string().min(1, { error: "Category is required" }),
})

export const updateTransactionSchema = createTransactionSchema.extend({
	id: z.string().min(1, { error: "Transaction ID is required" }),
})

export const createInstallmentSchema = createTransactionSchema
	.extend({
		totalInstallments: z.coerce
			.number()
			.int({ error: "Must be a whole number" })
			.min(2, { error: "Minimum 2 installments" })
			.max(48, { error: "Maximum 48 installments" }),
		creditCardId: z.string().min(1, { error: "Credit card is required" }),
	})
	.superRefine((data, ctx) => {
		if (data.paymentMethod !== "CREDIT") {
			ctx.addIssue({
				code: "custom",
				message: "Installments require credit card payment method",
				path: ["paymentMethod"],
			})
		}
	})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateInstallmentInput = z.infer<typeof createInstallmentSchema>
