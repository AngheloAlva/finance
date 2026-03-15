import Link from "next/link"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryIcon } from "@/shared/components/category-icon"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatDate } from "@/shared/lib/formatters"

import { TransactionType } from "@/generated/prisma/enums"
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types"

interface RecentTransactionsProps {
	transactions: TransactionWithCategory[]
	currency: CurrencyCode
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Transactions</CardTitle>
			</CardHeader>
			<CardContent>
				{transactions.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center">
						<p className="text-muted-foreground text-sm">No transactions yet</p>
						<Link
							href="/transactions"
							className="text-primary text-sm font-medium underline-offset-4 hover:underline"
						>
							Add your first transaction
						</Link>
					</div>
				) : (
					<ul className="flex flex-col gap-3">
						{transactions.map((tx) => (
							<li key={tx.id} className="flex items-center gap-3">
								<div
									className="flex size-8 shrink-0 items-center justify-center rounded-none"
									style={{ backgroundColor: `${tx.category.color}20` }}
								>
									<CategoryIcon icon={tx.category.icon} color={tx.category.color} size="md" />
								</div>
								<div className="flex min-w-0 flex-1 flex-col">
									<p className="truncate text-sm font-medium">{tx.description}</p>
									<p className="text-muted-foreground text-xs">{formatDate(tx.date, "short")}</p>
								</div>
								<CurrencyDisplay
									cents={tx.type === TransactionType.EXPENSE ? -tx.amount : tx.amount}
									currency={currency}
									colorize
									className="text-sm font-medium"
								/>
							</li>
						))}
					</ul>
				)}
			</CardContent>
			{transactions.length > 0 && (
				<CardFooter className="justify-center">
					<Link
						href="/transactions"
						className="text-primary text-sm font-medium underline-offset-4 hover:underline"
					>
						View all transactions
					</Link>
				</CardFooter>
			)}
		</Card>
	)
}
