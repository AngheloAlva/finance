import { TransactionType } from "@/generated/prisma/enums"
import { z } from "zod"

export const exportFiltersSchema = z.object({
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	type: z.nativeEnum(TransactionType).optional(),
	categoryId: z.string().optional(),
	tagId: z.string().optional(),
})

export type ExportFiltersInput = z.infer<typeof exportFiltersSchema>
