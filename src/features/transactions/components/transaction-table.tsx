"use client"

import { useSearchParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
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

const PAYMENT_METHOD_KEYS = {
	CASH: "paymentMethods.cash",
	DEBIT: "paymentMethods.debit",
	CREDIT: "paymentMethods.credit",
	TRANSFER: "paymentMethods.transfer",
	OTHER: "paymentMethods.other",
} as const

const TYPE_KEYS = {
	INCOME: "types.income",
	EXPENSE: "types.expense",
	TRANSFER: "types.transfer",
} as const

export function TransactionTable({ transactions, categories, creditCards, currency }: TransactionTableProps) {
	const t = useTranslations("transactions")
	const locale = useLocale()
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
						<TableHead>{t("table.date")}</TableHead>
						<TableHead>{t("table.description")}</TableHead>
						<TableHead>{t("table.category")}</TableHead>
						<TableHead>{t("table.amount")}</TableHead>
						<TableHead>{t("table.type")}</TableHead>
						<TableHead>{t("table.method")}</TableHead>
						<TableHead className="w-20">{t("table.actions")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
							{t("noTransactionsFound")}
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
							{t("table.date")} {renderSortIcon("date")}
						</button>
					</TableHead>
					<TableHead>
						<button
							type="button"
							className="inline-flex items-center gap-1"
							onClick={() => handleSort("description")}
						>
							{t("table.description")} {renderSortIcon("description")}
						</button>
					</TableHead>
					<TableHead>{t("table.category")}</TableHead>
					<TableHead>
						<button
							type="button"
							className="inline-flex items-center gap-1"
							onClick={() => handleSort("amount")}
						>
							{t("table.amount")} {renderSortIcon("amount")}
						</button>
					</TableHead>
					<TableHead>{t("table.type")}</TableHead>
					<TableHead>{t("table.method")}</TableHead>
					<TableHead className="w-20">{t("table.actions")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{transactions.map((tx) => (
					<TableRow key={tx.id}>
						<TableCell>{formatDate(tx.date, "short", locale)}</TableCell>
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
								locale={locale}
							/>
						</TableCell>
						<TableCell>
							<Badge variant={TYPE_VARIANTS[tx.type]}>{t(TYPE_KEYS[tx.type])}</Badge>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-1.5">
								<Badge variant="outline">{t(PAYMENT_METHOD_KEYS[tx.paymentMethod])}</Badge>
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
