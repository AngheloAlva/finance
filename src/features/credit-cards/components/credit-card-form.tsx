"use client"

import { useActionState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCreditCardAction } from "@/features/credit-cards/actions/create-credit-card.action"
import { updateCreditCardAction } from "@/features/credit-cards/actions/update-credit-card.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { FieldError } from "@/shared/components/field-error"
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types"

const CARD_COLORS = [
	{ value: "#1e293b", labelKey: "slate" },
	{ value: "#1e3a5f", labelKey: "navy" },
	{ value: "#064e3b", labelKey: "emerald" },
	{ value: "#7c2d12", labelKey: "amber" },
	{ value: "#581c87", labelKey: "purple" },
	{ value: "#9f1239", labelKey: "rose" },
	{ value: "#0f172a", labelKey: "dark" },
	{ value: "#334155", labelKey: "gray" },
] as const

interface CreditCardFormProps {
	mode: FormMode
	defaultValues?: {
		id: string
		name: string
		lastFourDigits: string
		brand: string
		totalLimit: number
		closingDay: number
		paymentDay: number
		color: string
	}
	onSuccess?: () => void
}

export function CreditCardForm({ mode, defaultValues, onSuccess }: CreditCardFormProps) {
	const t = useTranslations("creditCards")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")
	const action = mode === FORM_MODE.CREATE ? createCreditCardAction : updateCreditCardAction
	const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE)

	useEffect(() => {
		if (state.success) {
			const message =
				mode === FORM_MODE.CREATE
					? t("form.createdSuccess")
					: t("form.updatedSuccess")
			toast.success(message)
			onSuccess?.()
		}
	}, [state, mode, onSuccess, t])

	return (
		<form action={formAction} className="flex flex-col gap-4">
			{mode === FORM_MODE.EDIT && defaultValues && (
				<input type="hidden" name="id" value={defaultValues.id} />
			)}

			{!state.success && state.error && (
				<div className="border-destructive/50 bg-destructive/10 text-destructive rounded-none border px-3 py-2 text-xs">
					{tErrors(state.error as Parameters<typeof tErrors>[0])}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="cc-name">{t("form.cardName")}</Label>
				<Input
					id="cc-name"
					name="name"
					type="text"
					defaultValue={defaultValues?.name}
					required
					placeholder={t("form.cardNamePlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.name} />}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-lastFourDigits">{t("form.lastFourDigits")}</Label>
					<Input
						id="cc-lastFourDigits"
						name="lastFourDigits"
						type="text"
						maxLength={4}
						defaultValue={defaultValues?.lastFourDigits}
						required
						placeholder={t("form.lastFourDigitsPlaceholder")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.lastFourDigits} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-brand">{t("form.brand")}</Label>
					<Input
						id="cc-brand"
						name="brand"
						type="text"
						defaultValue={defaultValues?.brand}
						required
						placeholder={t("form.brandPlaceholder")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.brand} />}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="cc-totalLimit">{t("form.creditLimit")}</Label>
				<AmountInput name="totalLimit" defaultValue={defaultValues?.totalLimit} />
				{!state.success && <FieldError errors={state.fieldErrors?.totalLimit} />}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-closingDay">{t("form.closingDay")}</Label>
					<Input
						id="cc-closingDay"
						name="closingDay"
						type="number"
						min={1}
						max={31}
						defaultValue={defaultValues?.closingDay}
						required
						placeholder={t("form.closingDayPlaceholder")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.closingDay} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-paymentDay">{t("form.paymentDay")}</Label>
					<Input
						id="cc-paymentDay"
						name="paymentDay"
						type="number"
						min={1}
						max={31}
						defaultValue={defaultValues?.paymentDay}
						required
						placeholder={t("form.paymentDayPlaceholder")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.paymentDay} />}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("form.cardColor")}</Label>
				<div className="flex flex-wrap gap-2">
					{CARD_COLORS.map((cardColor) => (
						<label key={cardColor.value} className="cursor-pointer">
							<input
								type="radio"
								name="color"
								value={cardColor.value}
								defaultChecked={
									defaultValues
										? defaultValues.color === cardColor.value
										: cardColor.value === CARD_COLORS[0].value
								}
								className="peer sr-only"
							/>
							<div
								className="peer-checked:border-primary peer-checked:ring-primary/30 size-8 rounded-none border-2 border-transparent transition-all peer-checked:ring-2"
								style={{ backgroundColor: cardColor.value }}
								title={t(`colors.${cardColor.labelKey}` as Parameters<typeof t>[0])}
							/>
						</label>
					))}
				</div>
				{!state.success && <FieldError errors={state.fieldErrors?.color} />}
			</div>

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending
					? tc("saving")
					: mode === FORM_MODE.CREATE
						? t("form.createCreditCard")
						: t("form.updateCreditCard")}
			</Button>
		</form>
	)
}
