"use client"

import type { ReactNode } from "react"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import type { TransactionWithCategory } from "@/features/transactions/types/transactions.types"
import type { CreditCard } from "@/generated/prisma/client"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface TransactionDialogProps {
	mode: FormMode
	transaction?: TransactionWithCategory
	categories: CategoryWithChildren[]
	creditCards?: CreditCard[]
	trigger: ReactNode
}

export function TransactionDialog({
	mode,
	transaction,
	categories,
	creditCards,
	trigger,
}: TransactionDialogProps) {
	const defaultValues = transaction
		? {
				id: transaction.id,
				amount: transaction.amount,
				description: transaction.description,
				notes: transaction.notes,
				date: transaction.date.toISOString(),
				impactDate: transaction.impactDate.toISOString(),
				type: transaction.type,
				paymentMethod: transaction.paymentMethod,
				categoryId: transaction.categoryId,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? "New Transaction" : "Edit Transaction"}
			description={
				mode === FORM_MODE.CREATE
					? "Record a new financial transaction."
					: "Update the transaction details."
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<TransactionForm
					mode={mode}
					defaultValues={defaultValues}
					categories={categories}
					creditCards={creditCards}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
