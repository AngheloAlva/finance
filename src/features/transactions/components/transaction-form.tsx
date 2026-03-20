"use client"

import { useActionState, useEffect, useState } from "react"
import type { CreditCard } from "@/generated/prisma/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { CreditCardSelect } from "@/features/credit-cards/components/credit-card-select"
import { createInstallmentPurchaseAction } from "@/features/transactions/actions/create-installment.action"
import { createTransactionAction } from "@/features/transactions/actions/create-transaction.action"
import { updateTransactionAction } from "@/features/transactions/actions/update-transaction.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { FieldError } from "@/shared/components/field-error"
import { centsToDisplay } from "@/shared/lib/formatters"
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types"

interface TransactionFormProps {
	mode: FormMode
	defaultValues?: {
		id: string
		amount: number
		description: string
		notes: string | null
		date: string
		impactDate: string
		type: string
		paymentMethod: string
		categoryId: string
		creditCardId: string | null
	}
	categories: CategoryWithChildren[]
	creditCards?: CreditCard[]
	onSuccess?: () => void
}

function formatDateForInput(dateStr: string): string {
	const d = new Date(dateStr)
	return d.toISOString().split("T")[0] ?? ""
}

export function TransactionForm({
	mode,
	defaultValues,
	categories,
	creditCards = [],
	onSuccess,
}: TransactionFormProps) {
	const t = useTranslations("transactions")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")
	const [paymentMethod, setPaymentMethod] = useState(defaultValues?.paymentMethod ?? "CASH")
	const [installmentsEnabled, setInstallmentsEnabled] = useState(false)

	const isCredit = paymentMethod === "CREDIT"
	const showInstallmentFields = mode === FORM_MODE.CREATE && isCredit && installmentsEnabled

	const action =
		mode === FORM_MODE.EDIT
			? updateTransactionAction
			: showInstallmentFields
				? createInstallmentPurchaseAction
				: createTransactionAction
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
				<Label htmlFor="tx-amount">{t("form.amount")}</Label>
				<AmountInput name="amount" defaultValue={defaultValues?.amount} />
				{!state.success && <FieldError errors={state.fieldErrors?.amount} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="tx-description">{t("form.description")}</Label>
				<Input
					id="tx-description"
					name="description"
					type="text"
					defaultValue={defaultValues?.description}
					required
					placeholder={t("form.descriptionPlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.description} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="tx-notes">{t("form.notes")}</Label>
				<Textarea
					id="tx-notes"
					name="notes"
					defaultValue={defaultValues?.notes ?? ""}
					placeholder={t("form.notesPlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.notes} />}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>{t("form.date")}</Label>
					<DatePicker
						name="date"
						defaultValue={defaultValues ? formatDateForInput(defaultValues.date) : undefined}
						required
						placeholder={t("form.selectDate")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.date} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>{t("form.impactDate")}</Label>
					<DatePicker
						name="impactDate"
						defaultValue={defaultValues ? formatDateForInput(defaultValues.impactDate) : undefined}
						placeholder={t("form.selectImpactDate")}
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.impactDate} />}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>{t("form.type")}</Label>
					<Select
						name="type"
						defaultValue={defaultValues?.type ?? "EXPENSE"}
						items={[
							{ value: "INCOME", label: t("types.income") },
							{ value: "EXPENSE", label: t("types.expense") },
							{ value: "TRANSFER", label: t("types.transfer") },
						]}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("form.selectType")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="INCOME">{t("types.income")}</SelectItem>
							<SelectItem value="EXPENSE">{t("types.expense")}</SelectItem>
							<SelectItem value="TRANSFER">{t("types.transfer")}</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && <FieldError errors={state.fieldErrors?.type} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>{t("form.paymentMethod")}</Label>
					<Select
						name="paymentMethod"
						defaultValue={defaultValues?.paymentMethod ?? "CASH"}
						value={paymentMethod}
						onValueChange={(value) => {
							if (value) {
								setPaymentMethod(value)
								if (value !== "CREDIT") {
									setInstallmentsEnabled(false)
								}
							}
						}}
						items={[
							{ value: "CASH", label: t("paymentMethods.cash") },
							{ value: "DEBIT", label: t("paymentMethods.debit") },
							{ value: "CREDIT", label: t("paymentMethods.credit") },
							{ value: "TRANSFER", label: t("paymentMethods.transfer") },
							{ value: "OTHER", label: t("paymentMethods.other") },
						]}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("form.selectMethod")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="CASH">{t("paymentMethods.cash")}</SelectItem>
							<SelectItem value="DEBIT">{t("paymentMethods.debit")}</SelectItem>
							<SelectItem value="CREDIT">{t("paymentMethods.credit")}</SelectItem>
							<SelectItem value="TRANSFER">{t("paymentMethods.transfer")}</SelectItem>
							<SelectItem value="OTHER">{t("paymentMethods.other")}</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && <FieldError errors={state.fieldErrors?.paymentMethod} />}
				</div>
			</div>

			{isCredit && creditCards.length > 0 && (
				<div className="flex flex-col gap-1.5">
					<Label>{t("form.creditCard")}</Label>
					<CreditCardSelect
						creditCards={creditCards}
						name="creditCardId"
						defaultValue={defaultValues?.creditCardId ?? undefined}
						error={!state.success ? state.fieldErrors?.creditCardId?.[0] : undefined}
					/>
				</div>
			)}

			{mode === FORM_MODE.CREATE && isCredit && (
				<div className="flex items-center justify-between gap-2 rounded-none border px-3 py-2">
					<Label htmlFor="tx-installments-toggle" className="cursor-pointer">
						{t("form.payInInstallments")}
					</Label>
					<Switch
						id="tx-installments-toggle"
						checked={installmentsEnabled}
						onCheckedChange={(checked) => setInstallmentsEnabled(checked)}
					/>
				</div>
			)}

			{showInstallmentFields && (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="tx-totalInstallments">{t("form.numberOfInstallments")}</Label>
					<Input
						id="tx-totalInstallments"
						name="totalInstallments"
						type="number"
						min={2}
						max={48}
						defaultValue={3}
						required
					/>
					{!state.success && <FieldError errors={state.fieldErrors?.totalInstallments} />}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label>{t("form.category")}</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					defaultValue={defaultValues?.categoryId}
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending
					? tc("saving")
					: mode === FORM_MODE.CREATE
						? t("form.createTransaction")
						: t("form.updateTransaction")}
			</Button>
		</form>
	)
}
