"use client"

import { InvestmentType } from "@/generated/prisma/enums"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvestmentAction } from "@/features/investments/actions/create-investment.action"
import { updateInvestmentAction } from "@/features/investments/actions/update-investment.action"
import { INVESTMENT_TYPE_LABELS } from "@/features/investments/lib/investments.utils"
import { AmountInput } from "@/features/transactions/components/amount-input"
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
	}
	onSuccess?: () => void
}

export function InvestmentForm({ mode, defaultValues, onSuccess }: InvestmentFormProps) {
	const action = mode === FORM_MODE.CREATE ? createInvestmentAction : updateInvestmentAction
	const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE)

	useEffect(() => {
		if (state.success) {
			const message =
				mode === FORM_MODE.CREATE ? "Investment created successfully" : "Investment updated successfully"
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
				<Label htmlFor="inv-type">Type</Label>
				<select
					id="inv-type"
					name="type"
					defaultValue={defaultValues?.type ?? InvestmentType.STOCKS}
					className="border-input focus-visible:ring-ring flex h-9 w-full rounded-none border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
				>
					{Object.values(InvestmentType).map((t) => (
						<option key={t} value={t}>
							{INVESTMENT_TYPE_LABELS[t]}
						</option>
					))}
				</select>
				{!state.success && state.fieldErrors?.type && (
					<p className="text-destructive text-xs">{state.fieldErrors.type[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-name">Name</Label>
				<Input
					id="inv-name"
					name="name"
					type="text"
					defaultValue={defaultValues?.name}
					required
					placeholder="e.g. AAPL, Bitcoin, Savings Account"
				/>
				{!state.success && state.fieldErrors?.name && (
					<p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-institution">Institution</Label>
				<Input
					id="inv-institution"
					name="institution"
					type="text"
					defaultValue={defaultValues?.institution}
					required
					placeholder="e.g. Fidelity, Coinbase"
				/>
				{!state.success && state.fieldErrors?.institution && (
					<p className="text-destructive text-xs">{state.fieldErrors.institution[0]}</p>
				)}
			</div>

			{mode === FORM_MODE.CREATE && (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="inv-initialAmount">Initial Amount</Label>
					<AmountInput name="initialAmount" defaultValue={defaultValues?.initialAmount} />
					{!state.success && state.fieldErrors?.initialAmount && (
						<p className="text-destructive text-xs">{state.fieldErrors.initialAmount[0]}</p>
					)}
				</div>
			)}

			<input type="hidden" name="currency" value={defaultValues?.currency ?? "USD"} />

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Start Date</Label>
					<DatePicker
						name="startDate"
						defaultValue={defaultValues?.startDate}
						required
						placeholder="Select start date"
					/>
					{!state.success && state.fieldErrors?.startDate && (
						<p className="text-destructive text-xs">{state.fieldErrors.startDate[0]}</p>
					)}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>Maturity Date</Label>
					<DatePicker
						name="maturityDate"
						defaultValue={defaultValues?.maturityDate}
						placeholder="Select maturity date"
					/>
					{!state.success && state.fieldErrors?.maturityDate && (
						<p className="text-destructive text-xs">{state.fieldErrors.maturityDate[0]}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="inv-estimatedReturn">Estimated Return (% per year)</Label>
				<Input
					id="inv-estimatedReturn"
					name="estimatedReturn"
					type="text"
					inputMode="decimal"
					placeholder="e.g. 10.50"
					defaultValue={
						defaultValues?.estimatedReturn !== undefined
							? (defaultValues.estimatedReturn / 100).toFixed(2)
							: ""
					}
				/>
				{!state.success && state.fieldErrors?.estimatedReturn && (
					<p className="text-destructive text-xs">{state.fieldErrors.estimatedReturn[0]}</p>
				)}
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
					<Label htmlFor="inv-isActive">Active</Label>
				</div>
			)}

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? "Saving..." : mode === FORM_MODE.CREATE ? "Create Investment" : "Update Investment"}
			</Button>
		</form>
	)
}
