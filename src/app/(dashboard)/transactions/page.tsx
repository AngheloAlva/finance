import { Plus } from "lucide-react"
import Link from "next/link"

import { getCreditCards } from "@/features/credit-cards/lib/credit-cards.queries"
import { getUserCategories } from "@/features/categories/lib/categories.queries"
import { requireSession } from "@/shared/lib/auth"
import {
	getTransactions,
	parseSearchParams,
} from "@/features/transactions/lib/transactions.queries"

import { TransactionPagination } from "@/features/transactions/components/transaction-pagination"
import { TransactionFilters } from "@/features/transactions/components/transaction-filters"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { TransactionTable } from "@/features/transactions/components/transaction-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import type { CurrencyCode } from "@/shared/lib/constants"

interface TransactionsPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
	const session = await requireSession()

	const rawParams = await searchParams
	const { filters, pagination } = parseSearchParams(rawParams)

	const [result, categories, creditCards] = await Promise.all([
		getTransactions(session.user.id, filters, pagination),
		getUserCategories(session.user.id),
		getCreditCards(session.user.id),
	])

	const currency = (session.user.currency ?? "USD") as CurrencyCode
	const typedCategories = categories as CategoryWithChildren[]

	const hasFilters =
		filters.dateFrom ??
		filters.dateTo ??
		filters.type ??
		filters.paymentMethod ??
		filters.categoryId

	const isEmpty = result.total === 0

	return (
		<div className="mx-auto max-w-5xl">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-lg font-semibold">Transactions</h1>
				<TransactionDialog
					mode="create"
					categories={typedCategories}
					creditCards={creditCards}
					trigger={
						<Button size="sm">
							<Plus className="size-3.5" data-icon="inline-start" />
							New Transaction
						</Button>
					}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<TransactionFilters categories={typedCategories} currentFilters={filters} />
				</CardContent>
			</Card>

			<Card className="mt-4">
				<CardContent className="p-0">
					{isEmpty && !hasFilters ? (
						<div className="flex flex-col items-center gap-3 py-12 text-center">
							<p className="text-muted-foreground text-sm">
								No transactions yet. Start tracking your finances!
							</p>
							<TransactionDialog
								mode="create"
								categories={typedCategories}
								trigger={
									<Button size="sm">
										<Plus className="size-3.5" data-icon="inline-start" />
										Add your first transaction
									</Button>
								}
							/>
						</div>
					) : isEmpty && hasFilters ? (
						<div className="flex flex-col items-center gap-3 py-12 text-center">
							<p className="text-muted-foreground text-sm">No transactions match your filters.</p>
							<Button variant="outline" size="sm" render={<Link href="/transactions" />}>
								Clear filters
							</Button>
						</div>
					) : (
						<TransactionTable
							transactions={result.data}
							categories={typedCategories}
							currency={currency}
						/>
					)}
				</CardContent>
			</Card>

			{!isEmpty && (
				<div className="mt-4">
					<TransactionPagination
						total={result.total}
						page={result.page}
						pageSize={result.pageSize}
						searchParams={rawParams}
					/>
				</div>
			)}
		</div>
	)
}
