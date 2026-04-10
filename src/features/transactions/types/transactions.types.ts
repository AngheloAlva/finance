import type { Category, CreditCard, Tag, Transaction } from "@/generated/prisma/client"
import type { PaymentMethod, TransactionType } from "@/generated/prisma/enums"

export type TransactionWithCategory = Transaction & {
	category: Pick<Category, "id" | "name" | "icon" | "color">
	creditCard: Pick<CreditCard, "name" | "lastFourDigits" | "color"> | null
	tags: Array<{ tag: Pick<Tag, "id" | "name" | "color"> }>
}

export interface TransactionFilters {
	dateFrom?: string
	dateTo?: string
	type?: TransactionType
	paymentMethod?: PaymentMethod
	categoryId?: string
	creditCardId?: string
	tagId?: string
	sortBy?: "date" | "amount" | "description"
	sortDir?: "asc" | "desc"
}

export interface TransactionSearchParams extends TransactionFilters {
	page?: string
	pageSize?: string
}
