import { PaymentMethod, SplitRule, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Split item (used inside the create form)
// ---------------------------------------------------------------------------

export const splitItemSchema = z.object({
	userId: z.string().min(1, { error: "requiredId" }),
	amount: z.number().int().optional(),
	percentage: z.number().optional(),
})

// ---------------------------------------------------------------------------
// Create group transaction
// ---------------------------------------------------------------------------

export const createGroupTransactionSchema = z.object({
	description: z
		.string()
		.min(1, { error: "required" })
		.max(200, { error: "maxLength200" }),
	amount: z.coerce
		.number()
		.int({ error: "invalidNumber" })
		.positive({ error: "positive" }),
	type: z.nativeEnum(TransactionType, {
		error: "invalidType",
	}),
	categoryId: z.string().min(1, { error: "required" }),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "invalidPaymentMethod",
	}),
	notes: z.string().max(500, { error: "maxLength500" }).optional(),
	date: z.coerce.date({ error: "validDate" }),
	groupId: z.string().min(1, { error: "requiredId" }),
	splitRule: z.nativeEnum(SplitRule, {
		error: "invalidSplitRule",
	}),
	splits: z.array(splitItemSchema).min(1, { error: "minSplitMembers1" }),
})

// ---------------------------------------------------------------------------
// Settle split
// ---------------------------------------------------------------------------

export const settleSplitSchema = z.object({
	splitId: z.string().min(1, { error: "requiredId" }),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateGroupTransactionInput = z.infer<typeof createGroupTransactionSchema>
export type SettleSplitInput = z.infer<typeof settleSplitSchema>
