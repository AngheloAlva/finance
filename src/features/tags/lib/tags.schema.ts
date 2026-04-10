import { z } from "zod"

export const createTagSchema = z.object({
	name: z
		.string()
		.min(1, { error: "required" })
		.max(50, { error: "maxLength50" }),
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "invalidColor" }).default("#6b7280"),
})

export const updateTagSchema = createTagSchema.extend({
	id: z.string().min(1, { error: "requiredId" }),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
