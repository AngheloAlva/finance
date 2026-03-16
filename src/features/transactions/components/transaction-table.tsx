"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { DeleteInstallmentGroupButton } from "@/features/transactions/components/delete-installment-group-button"
import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button"
import { InstallmentBadge } from "@/features/transactions/components/installment-badge"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types"
import { TransactionType } from "@/generated/prisma/enums"
import { CategoryIcon } from "@/shared/components/category-icon"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatDate } from "@/shared/lib/formatters"

const PAYMENT_METHOD_LABELS = {
	CASH: "Cash",
	DEBIT: "Debit",
	CREDIT: "Credit",
	TRANSFER: "Transfer",
	OTHER: "Other",
} as const

const TYPE_LABELS = {
	INCOME: "Income",
	EXPENSE: "Expense",
	TRANSFER: "Transfer",
} as const

const TYPE_VARIANTS = {
	INCOME: "default",
	EXPENSE: "destructive",
	TRANSFER: "secondary",
} as const

interface TransactionTableProps {
	transactions: TransactionWithCategory[]
	categories: CategoryWithChildren[]
	creditCards?: import("@/generated/prisma/client").CreditCard[]
	currency: CurrencyCode
}

type SortableColumn = "date" | "amount" | "description"

export function TransactionTable({ transactions, categories, creditCards, currency }: TransactionTableProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const currentSortBy = searchParams.get("sortBy") ?? "date"
	const currentSortDir = searchParams.get("sortDir") ?? "desc"

	function handleSort(column: SortableColumn) {
		const params = new URLSearchParams(searchParams.toString())
		if (currentSortBy === column) {
			params.set("sortDir", currentSortDir === "asc" ? "desc" : "asc")
		} else {
			params.set("sortBy", column)
			params.set("sortDir", column === "date" ? "desc" : "asc")
		}
		params.set("page", "1")
		router.push(`/transactions?${params.toString()}`)
	}

	function renderSortIcon(column: SortableColumn) {
		if (currentSortBy !== column) {
			return <ArrowUpDown className="size-3" />
		}
		return currentSortDir === "asc" ? (
			<ArrowUp className="size-3" />
		) : (
			<ArrowDown className="size-3" />
		)
	}

	if (transactions.length === 0) {
		return (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Date</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Method</TableHead>
						<TableHead className="w-20">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
							No transactions found.
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		)
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						<button
							type="button"
							className="inline-flex items-center gap-1"
							onClick={() => handleSort("date")}
						>
							Date {renderSortIcon("date")}
						</button>
					</TableHead>
					<TableHead>
						<button
							type="button"
							className="inline-flex items-center gap-1"
							onClick={() => handleSort("description")}
						>
							Description {renderSortIcon("description")}
						</button>
					</TableHead>
					<TableHead>Category</TableHead>
					<TableHead>
						<button
							type="button"
							className="inline-flex items-center gap-1"
							onClick={() => handleSort("amount")}
						>
							Amount {renderSortIcon("amount")}
						</button>
					</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="w-20">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{transactions.map((tx) => (
					<TableRow key={tx.id}>
						<TableCell>{formatDate(tx.date, "short")}</TableCell>
						<TableCell className="max-w-48">
							<span className="flex items-center gap-1.5 truncate">
								<span className="truncate">{tx.description}</span>
								<InstallmentBadge
									installmentNumber={tx.installmentNumber}
									totalInstallments={tx.totalInstallments}
								/>
							</span>
						</TableCell>
						<TableCell>
							<span className="inline-flex items-center gap-1.5">
								<CategoryIcon icon={tx.category.icon} color={tx.category.color} />
								<span>{tx.category.name}</span>
							</span>
						</TableCell>
						<TableCell>
							<CurrencyDisplay
								cents={tx.type === TransactionType.EXPENSE ? -tx.amount : tx.amount}
								currency={currency}
								colorize
							/>
						</TableCell>
						<TableCell>
							<Badge variant={TYPE_VARIANTS[tx.type]}>{TYPE_LABELS[tx.type]}</Badge>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-1.5">
								<Badge variant="outline">{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</Badge>
								{tx.creditCard && (
									<span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
										<span
											className="size-2 rounded-none"
											style={{ backgroundColor: tx.creditCard.color }}
										/>
										*{tx.creditCard.lastFourDigits}
									</span>
								)}
							</div>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-1">
								<TransactionDialog
									mode="edit"
									transaction={tx}
									categories={categories}
									creditCards={creditCards}
									trigger={
										<Button variant="ghost" size="icon-xs">
											<Pencil className="size-3" />
										</Button>
									}
								/>
								<DeleteTransactionButton
									transactionId={tx.id}
									transactionDescription={tx.description}
								/>
								{tx.totalInstallments != null && tx.totalInstallments > 0 && (
									<DeleteInstallmentGroupButton
										parentTransactionId={tx.parentTransactionId ?? tx.id}
										description={tx.description}
									/>
								)}
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
