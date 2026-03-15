import { PaymentMethod, SplitRule, TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Split item (used inside the create form)
// ---------------------------------------------------------------------------

export const splitItemSchema = z.object({
	userId: z.string().min(1, { error: "User ID is required" }),
	amount: z.number().int().optional(),
	percentage: z.number().optional(),
})

// ---------------------------------------------------------------------------
// Create group transaction
// ---------------------------------------------------------------------------

export const createGroupTransactionSchema = z.object({
	description: z
		.string()
		.min(1, { error: "Description is required" })
		.max(200, { error: "Description must be at most 200 characters" }),
	amount: z.coerce
		.number()
		.int({ error: "Amount must be a valid number" })
		.positive({ error: "Amount must be greater than zero" }),
	type: z.nativeEnum(TransactionType, {
		error: "Please select a valid transaction type",
	}),
	categoryId: z.string().min(1, { error: "Category is required" }),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		error: "Please select a valid payment method",
	}),
	notes: z.string().max(500, { error: "Notes must be at most 500 characters" }).optional(),
	date: z.coerce.date({ error: "A valid date is required" }),
	groupId: z.string().min(1, { error: "Group ID is required" }),
	splitRule: z.nativeEnum(SplitRule, {
		error: "Please select a valid split rule",
	}),
	splits: z.array(splitItemSchema).min(1, { error: "At least one split member is required" }),
})

// ---------------------------------------------------------------------------
// Settle split
// ---------------------------------------------------------------------------

export const settleSplitSchema = z.object({
	splitId: z.string().min(1, { error: "Split ID is required" }),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateGroupTransactionInput = z.infer<typeof createGroupTransactionSchema>
export type SettleSplitInput = z.infer<typeof settleSplitSchema>
