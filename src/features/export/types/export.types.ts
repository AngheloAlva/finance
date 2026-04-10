import type { TransactionType } from "@/generated/prisma/enums"

export interface ExportFilters {
	dateFrom?: string
	dateTo?: string
	type?: TransactionType
	categoryId?: string
	tagId?: string
}
