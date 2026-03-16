"use client"

import { useActionState, useEffect, useState } from "react"
import type { CreditCard } from "@/generated/prisma/client"
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
					? "Transaction created successfully"
					: "Transaction updated successfully"
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
					{state.error}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="tx-amount">Amount</Label>
				<AmountInput name="amount" defaultValue={defaultValues?.amount} />
				{!state.success && state.fieldErrors?.amount && (
					<p className="text-destructive text-xs">{state.fieldErrors.amount[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="tx-description">Description</Label>
				<Input
					id="tx-description"
					name="description"
					type="text"
					defaultValue={defaultValues?.description}
					required
					placeholder="e.g. Grocery shopping"
				/>
				{!state.success && state.fieldErrors?.description && (
					<p className="text-destructive text-xs">{state.fieldErrors.description[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="tx-notes">Notes (optional)</Label>
				<Textarea
					id="tx-notes"
					name="notes"
					defaultValue={defaultValues?.notes ?? ""}
					placeholder="Any additional details..."
				/>
				{!state.success && state.fieldErrors?.notes && (
					<p className="text-destructive text-xs">{state.fieldErrors.notes[0]}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Date</Label>
					<DatePicker
						name="date"
						defaultValue={defaultValues ? formatDateForInput(defaultValues.date) : undefined}
						required
						placeholder="Select date"
					/>
					{!state.success && state.fieldErrors?.date && (
						<p className="text-destructive text-xs">{state.fieldErrors.date[0]}</p>
					)}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>Impact Date (optional)</Label>
					<DatePicker
						name="impactDate"
						defaultValue={defaultValues ? formatDateForInput(defaultValues.impactDate) : undefined}
						placeholder="Select impact date"
					/>
					{!state.success && state.fieldErrors?.impactDate && (
						<p className="text-destructive text-xs">{state.fieldErrors.impactDate[0]}</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Type</Label>
					<Select name="type" defaultValue={defaultValues?.type ?? "EXPENSE"}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="INCOME" label="Income">Income</SelectItem>
							<SelectItem value="EXPENSE" label="Expense">Expense</SelectItem>
							<SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && state.fieldErrors?.type && (
						<p className="text-destructive text-xs">{state.fieldErrors.type[0]}</p>
					)}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>Payment Method</Label>
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
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select method" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="CASH" label="Cash">Cash</SelectItem>
							<SelectItem value="DEBIT" label="Debit">Debit</SelectItem>
							<SelectItem value="CREDIT" label="Credit">Credit</SelectItem>
							<SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
							<SelectItem value="OTHER" label="Other">Other</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && state.fieldErrors?.paymentMethod && (
						<p className="text-destructive text-xs">{state.fieldErrors.paymentMethod[0]}</p>
					)}
				</div>
			</div>

			{isCredit && creditCards.length > 0 && (
				<div className="flex flex-col gap-1.5">
					<Label>Credit Card</Label>
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
						Pay in installments
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
					<Label htmlFor="tx-totalInstallments">Number of Installments</Label>
					<Input
						id="tx-totalInstallments"
						name="totalInstallments"
						type="number"
						min={2}
						max={48}
						defaultValue={3}
						required
					/>
					{!state.success && state.fieldErrors?.totalInstallments && (
						<p className="text-destructive text-xs">{state.fieldErrors.totalInstallments[0]}</p>
					)}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label>Category</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					defaultValue={defaultValues?.categoryId}
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending
					? "Saving..."
					: mode === FORM_MODE.CREATE
						? "Create Transaction"
						: "Update Transaction"}
			</Button>
		</form>
	)
}
