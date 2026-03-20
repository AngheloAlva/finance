import { TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

import { parseCurrencyInput } from "@/shared/lib/formatters"
import type { CurrencyCode } from "@/shared/lib/constants"

const baseCategoryFields = {
	name: z
		.string()
		.min(2, { error: "minLength2" })
		.max(50, { error: "maxLength50" }),
	icon: z.string().min(1, { error: "required" }),
	color: z.string().regex(/^#[0-9a-f]{6}$/i, { error: "invalidHexColor" }),
	transactionType: z.nativeEnum(TransactionType, {
		error: "invalidType",
	}),
	isRecurring: z.coerce.boolean(),
	isAvoidable: z.coerce.boolean(),
	alertThreshold: z.preprocess(
		(val) => (val === "" || val === null || val === undefined ? undefined : val),
		z.coerce
			.number()
			.positive({ error: "positive" })
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
		id: z.string().min(1, { error: "requiredId" }),
	})
	.transform(transformAlertThreshold)

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
