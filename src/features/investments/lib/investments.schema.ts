import { InvestmentType } from "@/generated/prisma/enums"
import { z } from "zod"

function toBasisPoints(val: string | undefined): number | undefined {
	if (!val || val.trim() === "") return undefined
	const cleaned = val.replace(/[^0-9.-]/g, "")
	const parsed = parseFloat(cleaned)
	if (Number.isNaN(parsed)) return undefined
	return Math.round(parsed * 100)
}

export const createInvestmentSchema = z.object({
	type: z.nativeEnum(InvestmentType, {
		error: "invalidInvestmentType",
	}),
	name: z
		.string()
		.min(1, { error: "required" })
		.max(100, { error: "maxLength100" }),
	institution: z
		.string()
		.min(1, { error: "required" })
		.max(100, { error: "maxLength100" }),
	initialAmount: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.positive({ error: "positive" }),
	currency: z.string().length(3, { error: "currencyLength3" }).default("USD"),
	startDate: z.coerce.date({ error: "validDate" }),
	maturityDate: z.coerce.date().optional(),
	estimatedReturn: z.string().optional().transform(toBasisPoints).pipe(z.number().int().optional()),
	purchaseExchangeRate: z.coerce.number().int().positive().optional(),
	currentExchangeRate: z.coerce.number().int().positive().optional(),
	totalFees: z.coerce.number().int().nonnegative().optional(),
})

export const updateInvestmentSchema = createInvestmentSchema.omit({ initialAmount: true }).extend({
	id: z.string().min(1, { error: "requiredId" }),
	isActive: z
		.string()
		.optional()
		.transform((val) => val === "true" || val === "on"),
})

export const updateInvestmentValueSchema = z.object({
	id: z.string().min(1, { error: "requiredId" }),
	currentValue: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.nonnegative({ error: "nonnegative" }),
	currentExchangeRate: z.coerce.number().int().positive().optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
export type UpdateInvestmentValueInput = z.infer<typeof updateInvestmentValueSchema>
