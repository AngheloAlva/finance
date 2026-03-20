"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { RecurringForm } from "@/features/recurring/components/recurring-form"
import type { RecurringTemplateWithRule } from "@/features/recurring/types/recurring.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface RecurringDialogProps {
	mode: FormMode
	template?: RecurringTemplateWithRule
	categories: CategoryWithChildren[]
	trigger: ReactNode
}

export function RecurringDialog({ mode, template, categories, trigger }: RecurringDialogProps) {
	const t = useTranslations("recurring.dialog")
	const defaultValues = template
		? {
				id: template.id,
				amount: template.amount,
				description: template.description,
				notes: template.notes,
				type: template.type,
				paymentMethod: template.paymentMethod,
				categoryId: template.categoryId,
				frequency: template.recurrenceRule.frequency,
				interval: template.recurrenceRule.interval,
				startDate: template.date.toISOString(),
				endDate: template.recurrenceRule.endDate?.toISOString() ?? null,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={
				mode === FORM_MODE.CREATE ? t("newTitle") : t("editTitle")
			}
			description={
				mode === FORM_MODE.CREATE
					? t("newDescription")
					: t("editDescription")
			}
			className="max-h-[90vh] overflow-y-auto sm:max-w-md"
		>
			{(onSuccess) => (
				<RecurringForm
					mode={mode}
					defaultValues={defaultValues}
					categories={categories}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
