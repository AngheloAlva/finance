"use client"

import { useTranslations } from "next-intl"

import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { RecurringTemplateCard } from "@/features/recurring/components/recurring-template-card"
import type { RecurringTemplateWithRule } from "@/features/recurring/types/recurring.types"
import type { CurrencyCode } from "@/shared/lib/constants"

interface RecurringListProps {
	templates: RecurringTemplateWithRule[]
	currency: CurrencyCode
	categories: CategoryWithChildren[]
}

export function RecurringList({ templates, currency, categories }: RecurringListProps) {
	const t = useTranslations("recurring")

	if (templates.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-none border border-dashed p-12 text-center">
				<p className="text-muted-foreground text-sm">
					{t("noRecurringYet")}
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-3">
			{templates.map((template) => (
				<RecurringTemplateCard
					key={template.id}
					template={template}
					currency={currency}
					categories={categories}
				/>
			))}
		</div>
	)
}
