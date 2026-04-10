import { MatchType } from "@/generated/prisma/enums"
import { z } from "zod"

export const createRuleSchema = z.object({
	pattern: z
		.string()
		.min(1, { error: "required" })
		.max(100, { error: "maxLength100" }),
	matchType: z.nativeEnum(MatchType, { error: "invalidMatchType" }).default(MatchType.CONTAINS),
	categoryId: z.string().min(1, { error: "required" }),
})

export const updateRuleSchema = createRuleSchema.extend({
	id: z.string().min(1, { error: "requiredId" }),
})

export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>
