"use client"

import { useActionState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteBudgetAction } from "@/features/budgets/actions/delete-budget.action"
import { BudgetProgressBar } from "@/features/budgets/components/budget-progress-bar"
import type { BudgetWithSpending } from "@/features/budgets/types/budgets.types"
import { CategoryIcon } from "@/shared/components/category-icon"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import type { CurrencyCode } from "@/shared/lib/constants"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

const STATUS_VARIANTS = {
	ok: "default",
	warning: "secondary",
	exceeded: "destructive",
} as const

interface BudgetCardProps {
	item: BudgetWithSpending
	currency: CurrencyCode
}

export function BudgetCard({ item, currency }: BudgetCardProps) {
	const t = useTranslations("budgets")
	const locale = useLocale()
	const [deleteState, deleteAction, isDeleting] = useActionState(deleteBudgetAction, INITIAL_VOID_STATE)

	useEffect(() => {
		if (deleteState.success) toast.success(t("deletedSuccess"))
	}, [deleteState, t])

	function handleDelete() {
		const formData = new FormData()
		formData.set("id", item.budget.id)
		deleteAction(formData)
	}

	return (
		<div className="flex flex-col gap-2 rounded-none border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CategoryIcon icon={item.budget.category.icon} color={item.budget.category.color} />
					<span className="text-sm font-medium">{item.budget.category.name}</span>
					<Badge variant={STATUS_VARIANTS[item.status]}>
						{t(`status.${item.status}`)}
					</Badge>
				</div>
				<ConfirmDialog
					trigger={
						<Button variant="ghost" size="icon-xs" disabled={isDeleting}>
							<Trash2 className="size-3" />
						</Button>
					}
					title={t("deleteConfirmTitle")}
					description={t("deleteConfirmDescription", { name: item.budget.category.name })}
					onConfirm={handleDelete}
					destructive
					loading={isDeleting}
				/>
			</div>

			<BudgetProgressBar percentage={item.percentage} status={item.status} />

			<div className="flex items-center justify-between text-xs">
				<span className="text-muted-foreground">
					<CurrencyDisplay cents={item.actual} currency={currency} locale={locale} />
					{" / "}
					<CurrencyDisplay cents={item.budget.amount} currency={currency} locale={locale} />
				</span>
				<span className="font-medium">{item.percentage}%</span>
			</div>
		</div>
	)
}
