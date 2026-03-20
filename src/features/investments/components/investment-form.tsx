"use client"

import { InvestmentType } from "@/generated/prisma/enums"
import { useActionState, useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvestmentAction } from "@/features/investments/actions/create-investment.action"
import { updateInvestmentAction } from "@/features/investments/actions/update-investment.action"
import {
	INVESTMENT_TYPE_KEYS,
	displayToRate,
	rateToDisplay,
} from "@/features/investments/lib/investments.utils"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { useCurrency } from "@/shared/components/currency-provider"
import { FieldError } from "@/shared/components/field-error"
import { CURRENCIES } from "@/shared/lib/constants"
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types"

interface InvestmentFormProps {
	mode: FormMode
	defaultValues?: {
		id: string
		type: InvestmentType
		name: string
		institution: string
		initialAmount: number
		currency: string
		startDate: string
		maturityDate?: string
		estimatedReturn?: number
		isActive: boolean
		purchaseExchangeRate?: number
		currentExchangeRate?: number
		totalFees?: number
	}
	onSuccess?: () => void
}

export function InvestmentForm({ mode, defaultValues, onSuccess }: InvestmentFormProps) {
	const t = useTranslations("investments.form")
	const tTypes = useTranslations("investments.types")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")
	const baseCurrency = useCurrency()
	const action = mode === FORM_MODE.CREATE ? createInvestmentAction : updateInvestmentAction
	const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE)

	const [selectedCurrency, setSelectedCurrency] = useState(
		defaultValues?.currency ?? baseCurrency,
	)

	const isForeignCurrency = selectedCurrency !== baseCurrency

	const [exchangeRateDisplay, setExchangeRateDisplay] = useState(() => {
		if (defaultValues?.purchaseExchangeRate) {
			return rateToDisplay(defaultValues.purchaseExchangeRate).toString()
		}
		return ""
	})

	const handleExchangeRateBlur = useCallback(() => {
		const cleaned = exchangeRateDisplay.replace(/[^0-9.-]/g, "")
		const value = parseFloat(cleaned)
		if (!Number.isNaN(value) && value > 0) {
			setExchangeRateDisplay(value.toFixed(4))
		}
	}, [exchangeRateDisplay])

	const exchangeRateStored = (() => {
		const cleaned = exchangeRateDisplay.replace(/[^0-9.-]/g, "")
		const value = parseFloat(cleaned)
		if (!Number.isNaN(value) && value > 0) {
			return displayToRate(value)
		}
		return ""
	})()

	useEffect(() => {
		if (state.success) {
			const message =
				mode === FORM_MODE.CREATE ? t("createdSuccess") : t("updatedSuccess")
			toast.success(message)
			onSuccess?.()
		}
	}, [state, mode, onSuccess])

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
				<Label htmlFor="inv-type">{t("type")}</Label>
				<select
					id="inv-type"
					name="type"
					defaultValue={defaultValues?.type ?? InvestmentType.STOCKS}
					className="border-input focus-visible:ring-ring flex h-9 w-full rounded-none border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
				>
					{Object.values(InvestmentType).map((type) => (
						<option key={type} value={type}>
							{tTypes(INVESTMENT_TYPE_KEYS[type] as Parameters<typeof tTypes>[0])}
						</option>
					))}
				</select>
				{!state.success && <FieldError errors={state.fieldErrors?.type} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-name">{t("name")}</Label>
				<Input
					id="inv-name"
					name="name"
					type="text"
					defaultValue={defaultValues?.name}
					required
					placeholder={t("namePlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.name} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-institution">{t("institution")}</Label>
				<Input
					id="inv-institution"
					name="institution"
					type="text"
					defaultValue={defaultValues?.institution}
					required
					placeholder={t("institutionPlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.institution} />}
			</div>

			{mode === FORM_MODE.CREATE && (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="inv-initialAmount">{t("initialAmount")}</Label>
					<AmountInput name="initialAmount" defaultValue={defaultValues?.initialAmount} />
					{!state.success && <FieldError errors={state.fieldErrors?.initialAmount} />}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-currency">{t("currency")}</Label>
				<select
					id="inv-currency"
					name="currency"
					value={selectedCurrency}
					onChange={(e) => setSelectedCurrency(e.target.value)}
					className="border-input focus-visible:ring-ring flex h-9 w-full rounded-none border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
				>
					{CURRENCIES.map((c) => (
						<option key={c.code} value={c.code}>
							{c.code} — {c.name}
						</option>
					))}
				</select>
				{!state.success && <FieldError errors={state.fieldErrors?.currency} />}
			</div>

			{isForeignCurrency && (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="inv-exchangeRate">
						{t("exchangeRate", { from: selectedCurrency, to: baseCurrency })}
					</Label>
					<input type="hidden" name="purchaseExchangeRate" value={exchangeRateStored} />
					<input type="hidden" name="currentExchangeRate" value={exchangeRateStored} />
					<Input
						id="inv-exchangeRate"
						type="text"
						inputMode="decimal"
						placeholder={t("exchangeRatePlaceholder")}
						value={exchangeRateDisplay}
						onChange={(e) => setExchangeRateDisplay(e.target.value)}
						onBlur={handleExchangeRateBlur}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.purchaseExchangeRate} />}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-totalFees">{t("brokerFees")}</Label>
				<AmountInput name="totalFees" defaultValue={defaultValues?.totalFees} />
				{!state.success && <FieldError errors={state.fieldErrors?.totalFees} />}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>{t("startDate")}</Label>
					<DatePicker
						name="startDate"
						defaultValue={defaultValues?.startDate}
						required
						placeholder={t("selectStartDate")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.startDate} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>{t("maturityDate")}</Label>
					<DatePicker
						name="maturityDate"
						defaultValue={defaultValues?.maturityDate}
						placeholder={t("selectMaturityDate")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.maturityDate} />}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-estimatedReturn">{t("estimatedReturn")}</Label>
				<Input
					id="inv-estimatedReturn"
					name="estimatedReturn"
					type="text"
					inputMode="decimal"
					placeholder={t("estimatedReturnPlaceholder")}
					defaultValue={
						defaultValues?.estimatedReturn !== undefined
							? (defaultValues.estimatedReturn / 100).toFixed(2)
							: ""
					}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.estimatedReturn} />}
			</div>

			{mode === FORM_MODE.EDIT && (
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="inv-isActive"
						name="isActive"
						value="true"
						defaultChecked={defaultValues?.isActive ?? true}
						className="border-input size-4 rounded"
					/>
					<Label htmlFor="inv-isActive">{t("active")}</Label>
				</div>
			)}

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? tc("saving") : mode === FORM_MODE.CREATE ? t("createInvestment") : t("updateInvestment")}
			</Button>
		</form>
	)
}
