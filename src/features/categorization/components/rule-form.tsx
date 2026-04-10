"use client"

import { useActionState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { createRuleAction } from "@/features/categorization/actions/create-rule.action"
import { updateRuleAction } from "@/features/categorization/actions/update-rule.action"
import { MATCH_TYPE_KEYS } from "@/features/categorization/types/categorization.types"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { FieldError } from "@/shared/components/field-error"
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types"

interface RuleFormProps {
	mode: FormMode
	categories: CategoryWithChildren[]
	defaultValues?: {
		id: string
		pattern: string
		matchType: string
		categoryId: string
	}
	onSuccess?: () => void
}

export function RuleForm({ mode, categories, defaultValues, onSuccess }: RuleFormProps) {
	const t = useTranslations("categorization")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")
	const action = mode === FORM_MODE.CREATE ? createRuleAction : updateRuleAction
	const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE)

	useEffect(() => {
		if (state.success) {
			toast.success(mode === FORM_MODE.CREATE ? t("createdSuccess") : t("updatedSuccess"))
			onSuccess?.()
		}
	}, [state, mode, onSuccess, t])

	return (
		<form action={formAction} className="flex flex-col gap-4">
			{mode === FORM_MODE.EDIT && defaultValues && (
				<input type="hidden" name="id" value={defaultValues.id} />
			)}

			{!state.success && state.error && (
				<div className="rounded-none border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					{tErrors(state.error as Parameters<typeof tErrors>[0])}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label>{t("pattern")}</Label>
				<Input
					name="pattern"
					type="text"
					defaultValue={defaultValues?.pattern}
					placeholder={t("patternPlaceholder")}
					required
				/>
				<p className="text-muted-foreground text-xs">{t("patternHint")}</p>
				{!state.success && <FieldError errors={state.fieldErrors?.pattern} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("matchType")}</Label>
				<Select
					name="matchType"
					defaultValue={defaultValues?.matchType ?? "CONTAINS"}
					items={Object.entries(MATCH_TYPE_KEYS).map(([value, key]) => ({
						value,
						label: t(`matchTypes.${key}` as Parameters<typeof t>[0]),
					}))}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(MATCH_TYPE_KEYS).map(([value, key]) => (
							<SelectItem key={value} value={value}>
								{t(`matchTypes.${key}` as Parameters<typeof t>[0])}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("category")}</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					defaultValue={defaultValues?.categoryId}
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<Button type="submit" disabled={isPending} className="w-full">
				{isPending ? tc("saving") : mode === FORM_MODE.CREATE ? t("createRule") : t("updateRule")}
			</Button>
		</form>
	)
}
