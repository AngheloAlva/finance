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
		error: "Invalid investment type",
	}),
	name: z
		.string()
		.min(1, { error: "Name is required" })
		.max(100, { error: "Name must be at most 100 characters" }),
	institution: z
		.string()
		.min(1, { error: "Institution is required" })
		.max(100, { error: "Institution must be at most 100 characters" }),
	initialAmount: z.coerce
		.number()
		.int({ error: "Amount must be a valid number" })
		.positive({ error: "Amount must be greater than zero" }),
	currency: z.string().length(3, { error: "Currency must be 3 characters" }).default("USD"),
	startDate: z.coerce.date({ error: "Start date is required" }),
	maturityDate: z.coerce.date().optional(),
	estimatedReturn: z.string().optional().transform(toBasisPoints).pipe(z.number().int().optional()),
})

export const updateInvestmentSchema = createInvestmentSchema.omit({ initialAmount: true }).extend({
	id: z.string().min(1, { error: "Investment ID is required" }),
	isActive: z
		.string()
		.optional()
		.transform((val) => val === "true" || val === "on"),
})

export const updateInvestmentValueSchema = z.object({
	id: z.string().min(1, { error: "Investment ID is required" }),
	currentValue: z.coerce
		.number()
		.int({ error: "Value must be a valid number" })
		.nonnegative({ error: "Value cannot be negative" }),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
export type UpdateInvestmentValueInput = z.infer<typeof updateInvestmentValueSchema>
