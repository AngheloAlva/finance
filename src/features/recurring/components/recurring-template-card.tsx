"use client"

import { useActionState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { deleteRecurringAction } from "@/features/recurring/actions/delete-recurring.action"
import { toggleRecurringAction } from "@/features/recurring/actions/toggle-recurring.action"
import { RecurringDialog } from "@/features/recurring/components/recurring-dialog"
import {
	FREQUENCY_KEYS,
	type RecurringTemplateWithRule,
} from "@/features/recurring/types/recurring.types"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatDate } from "@/shared/lib/formatters"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface RecurringTemplateCardProps {
	template: RecurringTemplateWithRule
	currency: CurrencyCode
	categories: CategoryWithChildren[]
}

export function RecurringTemplateCard({
	template,
	currency,
	categories,
}: RecurringTemplateCardProps) {
	const t = useTranslations("recurring.card")
	const tFreq = useTranslations("recurring.frequencies")
	const td = useTranslations("recurring.deleteDialog")
	const locale = useLocale()
	const [deleteState, deleteAction, isDeleting] = useActionState(
		deleteRecurringAction,
		INITIAL_VOID_STATE
	)
	const [toggleState, toggleAction, isToggling] = useActionState(
		toggleRecurringAction,
		INITIAL_VOID_STATE
	)

	const rule = template.recurrenceRule
	const isActive = rule.isActive

	useEffect(() => {
		if (deleteState.success) {
			toast.success(t("deletedSuccess"))
		}
		if (!deleteState.success && deleteState.error) {
			toast.error(deleteState.error)
		}
	}, [deleteState, t])

	useEffect(() => {
		if (toggleState.success) {
			toast.success(isActive ? t("pausedSuccess") : t("activatedSuccess"))
		}
		if (!toggleState.success && toggleState.error) {
			toast.error(toggleState.error)
		}
	}, [toggleState, isActive, t])

	function handleDelete() {
		const formData = new FormData()
		formData.set("id", template.id)
		deleteAction(formData)
	}

	function handleToggle() {
		const formData = new FormData()
		formData.set("id", template.id)
		toggleAction(formData)
	}

	const frequencyLabel = tFreq(FREQUENCY_KEYS[rule.frequency] as Parameters<typeof tFreq>[0])
	const frequencyText =
		rule.interval > 1
			? t("everyInterval", { interval: rule.interval, frequency: frequencyLabel.toLowerCase() })
			: frequencyLabel

	return (
		<div className="flex items-center justify-between rounded-none border p-4">
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">{template.description}</span>
					<Badge variant={isActive ? "default" : "secondary"}>
						{isActive ? t("active") : t("paused")}
					</Badge>
				</div>

				<div className="text-muted-foreground flex items-center gap-2 text-xs">
					<span
						className="inline-block size-2 rounded-none"
						style={{ backgroundColor: template.category.color }}
					/>
					<span>{template.category.name}</span>
					<span>-</span>
					<span>{frequencyText}</span>
				</div>

				<div className="text-muted-foreground text-xs">
					{t("next", { date: formatDate(rule.nextGenerationDate, "short", locale) })}
					{rule.endDate && <span> - {t("ends", { date: formatDate(rule.endDate, "short", locale) })}</span>}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<CurrencyDisplay
					cents={template.amount}
					currency={currency}
					className="text-sm font-medium"
					locale={locale}
				/>

				<Button
					variant="ghost"
					size="icon-xs"
					onClick={handleToggle}
					disabled={isToggling}
					title={isActive ? t("pause") : t("activate")}
				>
					{isActive ? (
						<span className="text-xs">||</span>
					) : (
						<span className="text-xs">&#9654;</span>
					)}
				</Button>

				<RecurringDialog
					mode="edit"
					template={template}
					categories={categories}
					trigger={
						<Button variant="ghost" size="icon-xs">
							<Pencil className="size-3" />
						</Button>
					}
				/>

				<ConfirmDialog
					trigger={
						<Button variant="ghost" size="icon-xs" disabled={isDeleting}>
							<Trash2 className="size-3" />
						</Button>
					}
					title={td("title")}
					description={td("description", { name: template.description })}
					onConfirm={handleDelete}
					destructive
					loading={isDeleting}
				/>
			</div>
		</div>
	)
}
