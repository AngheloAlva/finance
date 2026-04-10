"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import type { TagOption } from "@/features/tags/types/tags.types"
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
	tags?: TagOption[]
	trigger: ReactNode
}

export function TransactionDialog({
	mode,
	transaction,
	categories,
	creditCards,
	tags,
	trigger,
}: TransactionDialogProps) {
	const t = useTranslations("transactions")
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
				creditCardId: transaction.creditCardId,
				tagIds: transaction.tags.map((t) => t.tag.id),
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? t("dialog.newTitle") : t("dialog.editTitle")}
			description={
				mode === FORM_MODE.CREATE
					? t("dialog.newDescription")
					: t("dialog.editDescription")
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<TransactionForm
					mode={mode}
					defaultValues={defaultValues}
					categories={categories}
					creditCards={creditCards}
					tags={tags}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
