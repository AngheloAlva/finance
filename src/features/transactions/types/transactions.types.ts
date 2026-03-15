import type { Category, CreditCard, Transaction } from "@/generated/prisma/client"
import type { PaymentMethod, TransactionType } from "@/generated/prisma/enums"

export type TransactionWithCategory = Transaction & {
	category: Pick<Category, "id" | "name" | "icon" | "color">
	creditCard: Pick<CreditCard, "name" | "lastFourDigits" | "color"> | null
}

export interface TransactionFilters {
	dateFrom?: string
	dateTo?: string
	type?: TransactionType
	paymentMethod?: PaymentMethod
	categoryId?: string
	creditCardId?: string
	sortBy?: "date" | "amount" | "description"
	sortDir?: "asc" | "desc"
}

export interface TransactionSearchParams extends TransactionFilters {
	page?: string
	pageSize?: string
}
