import { z } from "zod"

export const upsertBudgetSchema = z.object({
	categoryId: z.string().min(1, { error: "required" }),
	amount: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.positive({ error: "positive" }),
	month: z.coerce.number().int().min(1).max(12),
	year: z.coerce.number().int().min(2000).max(2100),
})

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>
