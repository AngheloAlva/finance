"use client"

import { useActionState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { upsertBudgetAction } from "@/features/budgets/actions/upsert-budget.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { FieldError } from "@/shared/components/field-error"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface BudgetFormProps {
	categories: CategoryWithChildren[]
	month: number
	year: number
	onSuccess?: () => void
}

export function BudgetForm({ categories, month, year, onSuccess }: BudgetFormProps) {
	const t = useTranslations("budgets")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")
	const [state, formAction, isPending] = useActionState(upsertBudgetAction, INITIAL_VOID_STATE)

	useEffect(() => {
		if (state.success) {
			toast.success(t("createdSuccess"))
			onSuccess?.()
		}
	}, [state, onSuccess, t])

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<input type="hidden" name="month" value={month} />
			<input type="hidden" name="year" value={year} />

			{!state.success && state.error && (
				<div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{tErrors(state.error as Parameters<typeof tErrors>[0])}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label>{t("category")}</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("amount")}</Label>
				<AmountInput name="amount" />
				{!state.success && <FieldError errors={state.fieldErrors?.amount} />}
			</div>

			<Button type="submit" disabled={isPending} className="w-full">
				{isPending ? tc("saving") : t("setBudget")}
			</Button>
		</form>
	)
}
