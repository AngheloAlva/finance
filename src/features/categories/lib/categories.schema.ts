import { TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

import { parseCurrencyInput } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

const baseCategoryFields = {
	name: z
		.string()
		.min(2, { error: "Name must be at least 2 characters" })
		.max(50, { error: "Name must be at most 50 characters" }),
	icon: z.string().min(1, { error: "Icon is required" }),
	color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: "Color must be a valid hex color" }),
	transactionType: z.nativeEnum(TransactionType, {
		error: "Please select a valid transaction type",
	}),
	isRecurring: z.coerce.boolean(),
	isAvoidable: z.coerce.boolean(),
	alertThreshold: z.preprocess(
		(val) => (val === "" || val === null || val === undefined ? undefined : val),
		z.coerce
			.number()
			.positive({ error: "Threshold must be positive" })
			.optional()
	),
	currencyCode: z.string().default("USD"),
	parentId: z.string().optional(),
}

function transformAlertThreshold<T extends { alertThreshold?: number; currencyCode: string }>(data: T) {
	return {
		...data,
		alertThreshold: data.alertThreshold != null
			? parseCurrencyInput(data.alertThreshold.toString(), data.currencyCode as CurrencyCode)
			: undefined,
	}
}

export const createCategorySchema = z
	.object(baseCategoryFields)
	.transform(transformAlertThreshold)

export const updateCategorySchema = z
	.object({
		...baseCategoryFields,
		id: z.string().min(1, { error: "Category ID is required" }),
	})
	.transform(transformAlertThreshold)

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
