"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { BudgetForm } from "@/features/budgets/components/budget-form"
import { FormDialog } from "@/shared/components/form-dialog"

interface BudgetDialogProps {
	categories: CategoryWithChildren[]
	month: number
	year: number
	trigger: ReactNode
}

export function BudgetDialog({ categories, month, year, trigger }: BudgetDialogProps) {
	const t = useTranslations("budgets")

	return (
		<FormDialog
			trigger={trigger}
			title={t("setBudget")}
			description={t("setBudgetDescription")}
			className="sm:max-w-sm"
		>
			{(onSuccess) => (
				<BudgetForm
					categories={categories}
					month={month}
					year={year}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
