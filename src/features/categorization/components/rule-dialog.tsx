"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { RuleForm } from "@/features/categorization/components/rule-form"
import type { CategorizationRuleWithCategory } from "@/features/categorization/types/categorization.types"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface RuleDialogProps {
	mode: FormMode
	categories: CategoryWithChildren[]
	rule?: CategorizationRuleWithCategory
	trigger: ReactNode
}

export function RuleDialog({ mode, categories, rule, trigger }: RuleDialogProps) {
	const t = useTranslations("categorization")
	const defaultValues = rule
		? {
				id: rule.id,
				pattern: rule.pattern,
				matchType: rule.matchType,
				categoryId: rule.categoryId,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? t("newRule") : t("editRule")}
			description={t("ruleDescription")}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<RuleForm
					mode={mode}
					categories={categories}
					defaultValues={defaultValues}
					onSuccess={onSuccess}
				/>
			)}
		</FormDialog>
	)
}
