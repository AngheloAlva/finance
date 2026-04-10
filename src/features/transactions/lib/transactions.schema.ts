import { PaymentMethod, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

export const createTransactionSchema = z.object({
	amount: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.positive({ error: "positive" }),
	description: z
		.string()
		.min(1, { error: "required" })
		.max(200, { error: "maxLength200" }),
	notes: z.string().max(500, { error: "maxLength500" }).optional(),
	date: z.coerce.date({ error: "validDate" }),
	impactDate: z.coerce.date().optional(),
	type: z.nativeEnum(TransactionType, {
		error: "invalidType",
	}),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "invalidPaymentMethod",
	}),
	categoryId: z.string().min(1, { error: "required" }),
	creditCardId: z.string().optional(),
	tagIds: z.array(z.string()).optional(),
})

export const updateTransactionSchema = createTransactionSchema.extend({
	id: z.string().min(1, { error: "requiredId" }),
})

export const createInstallmentSchema = createTransactionSchema
	.extend({
		totalInstallments: z.coerce
			.number()
			.int({ error: "wholeNumber" })
			.min(2, { error: "minInstallments2" })
			.max(48, { error: "maxInstallments48" }),
		creditCardId: z.string().min(1, { error: "required" }),
	})
	.superRefine((data, ctx) => {
		if (data.paymentMethod !== "CREDIT") {
			ctx.addIssue({
				code: "custom",
				message: "installmentsRequireCredit",
				path: ["paymentMethod"],
			})
		}
	})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateInstallmentInput = z.infer<typeof createInstallmentSchema>
