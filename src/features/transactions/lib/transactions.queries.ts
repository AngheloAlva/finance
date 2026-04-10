import type { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/shared/lib/prisma"
import type { PaginatedResult, PaginationParams } from "@/shared/types/common.types"

import type {
	TransactionFilters,
	TransactionWithCategory,
} from "@/features/transactions/types/transactions.types"

function buildWhereClause(
	userId: string,
	filters: TransactionFilters
): Prisma.TransactionWhereInput {
	const conditions: Prisma.TransactionWhereInput[] = [{ userId }, { isTemplate: false }]

	if (filters.dateFrom) {
		conditions.push({ date: { gte: new Date(filters.dateFrom) } })
	}

	if (filters.dateTo) {
		conditions.push({ date: { lte: new Date(filters.dateTo) } })
	}

	if (filters.type) {
		conditions.push({ type: filters.type })
	}

	if (filters.paymentMethod) {
		conditions.push({ paymentMethod: filters.paymentMethod })
	}

	if (filters.categoryId) {
		conditions.push({ categoryId: filters.categoryId })
	}

	if (filters.creditCardId) {
		conditions.push({ creditCardId: filters.creditCardId })
	}

	if (filters.tagId) {
		conditions.push({ tags: { some: { tagId: filters.tagId } } })
	}

	return { AND: conditions }
}

function buildOrderBy(filters: TransactionFilters): Prisma.TransactionOrderByWithRelationInput {
	const field = filters.sortBy ?? "date"
	const dir = filters.sortDir ?? "desc"

	return { [field]: dir }
}

export async function getTransactions(
	userId: string,
	filters: TransactionFilters,
	pagination: PaginationParams
): Promise<PaginatedResult<TransactionWithCategory>> {
	const where = buildWhereClause(userId, filters)
	const orderBy = buildOrderBy(filters)

	const skip = (pagination.page - 1) * pagination.pageSize
	const take = pagination.pageSize

	const [data, total] = await Promise.all([
		prisma.transaction.findMany({
			where,
			orderBy,
			skip,
			take,
			include: {
				category: {
					select: { id: true, name: true, icon: true, color: true },
				},
				creditCard: {
					select: { name: true, lastFourDigits: true, color: true },
				},
				tags: {
					include: { tag: { select: { id: true, name: true, color: true } } },
				},
			},
		}),
		prisma.transaction.count({ where }),
	])

	const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize))

	return {
		data,
		total,
		page: pagination.page,
		pageSize: pagination.pageSize,
		totalPages,
	}
}

export function parseSearchParams(params: Record<string, string | string[] | undefined>): {
	filters: TransactionFilters
	pagination: PaginationParams
} {
	const getString = (key: string): string | undefined => {
		const val = params[key]
		if (typeof val === "string" && val.length > 0) return val
		return undefined
	}

	const filters: TransactionFilters = {
		dateFrom: getString("dateFrom"),
		dateTo: getString("dateTo"),
		type: getString("type") as TransactionFilters["type"],
		paymentMethod: getString("paymentMethod") as TransactionFilters["paymentMethod"],
		categoryId: getString("categoryId"),
		creditCardId: getString("creditCardId"),
		tagId: getString("tagId"),
		sortBy: (getString("sortBy") as TransactionFilters["sortBy"]) ?? "date",
		sortDir: (getString("sortDir") as TransactionFilters["sortDir"]) ?? "desc",
	}

	const page = Math.max(1, parseInt(getString("page") ?? "1", 10) || 1)
	const pageSize = Math.min(100, Math.max(1, parseInt(getString("pageSize") ?? "20", 10) || 20))

	return { filters, pagination: { page, pageSize } }
}
