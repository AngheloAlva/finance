"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { CategoryForm } from "@/features/categories/components/category-form"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface CategoryDialogProps {
	mode: FormMode
	category?: CategoryWithChildren
	categories: CategoryWithChildren[]
	groupId?: string
	trigger: ReactNode
}

export function CategoryDialog({
	mode,
	category,
	categories,
	groupId,
	trigger,
}: CategoryDialogProps) {
	const t = useTranslations("categories")
	const defaultValues = category
		? {
				id: category.id,
				name: category.name,
				icon: category.icon,
				color: category.color,
				transactionType: category.transactionType,
				isRecurring: category.isRecurring,
				isAvoidable: category.isAvoidable,
				alertThreshold: category.alertThreshold,
				parentId: category.parentId,
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
		>
			{(onSuccess) => (
				<CategoryForm
					mode={mode}
					defaultValues={defaultValues}
					categories={categories}
					groupId={groupId}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
