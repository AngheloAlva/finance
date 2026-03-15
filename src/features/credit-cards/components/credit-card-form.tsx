"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCreditCardAction } from "@/features/credit-cards/actions/create-credit-card.action"
import { updateCreditCardAction } from "@/features/credit-cards/actions/update-credit-card.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { FORM_MODE, INITIAL_VOID_STATE, type FormMode } from "@/shared/types/common.types"

const CARD_COLORS = [
	{ value: "#1e293b", label: "Slate" },
	{ value: "#1e3a5f", label: "Navy" },
	{ value: "#064e3b", label: "Emerald" },
	{ value: "#7c2d12", label: "Amber" },
	{ value: "#581c87", label: "Purple" },
	{ value: "#9f1239", label: "Rose" },
	{ value: "#0f172a", label: "Dark" },
	{ value: "#334155", label: "Gray" },
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
	const action = mode === FORM_MODE.CREATE ? createCreditCardAction : updateCreditCardAction
	const [state, formAction, isPending] = useActionState(action, INITIAL_VOID_STATE)

	useEffect(() => {
		if (state.success) {
			const message =
				mode === FORM_MODE.CREATE
					? "Credit card created successfully"
					: "Credit card updated successfully"
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
				<Label htmlFor="cc-name">Card Name</Label>
				<Input
					id="cc-name"
					name="name"
					type="text"
					defaultValue={defaultValues?.name}
					required
					placeholder="e.g. My Visa Card"
				/>
				{!state.success && state.fieldErrors?.name && (
					<p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-lastFourDigits">Last 4 Digits</Label>
					<Input
						id="cc-lastFourDigits"
						name="lastFourDigits"
						type="text"
						maxLength={4}
						defaultValue={defaultValues?.lastFourDigits}
						required
						placeholder="1234"
					/>
					{!state.success && state.fieldErrors?.lastFourDigits && (
						<p className="text-destructive text-xs">{state.fieldErrors.lastFourDigits[0]}</p>
					)}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-brand">Brand</Label>
					<Input
						id="cc-brand"
						name="brand"
						type="text"
						defaultValue={defaultValues?.brand}
						required
						placeholder="e.g. Visa, Mastercard"
					/>
					{!state.success && state.fieldErrors?.brand && (
						<p className="text-destructive text-xs">{state.fieldErrors.brand[0]}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="cc-totalLimit">Credit Limit</Label>
				<AmountInput name="totalLimit" defaultValue={defaultValues?.totalLimit} />
				{!state.success && state.fieldErrors?.totalLimit && (
					<p className="text-destructive text-xs">{state.fieldErrors.totalLimit[0]}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-closingDay">Closing Day</Label>
					<Input
						id="cc-closingDay"
						name="closingDay"
						type="number"
						min={1}
						max={31}
						defaultValue={defaultValues?.closingDay}
						required
						placeholder="1-31"
					/>
					{!state.success && state.fieldErrors?.closingDay && (
						<p className="text-destructive text-xs">{state.fieldErrors.closingDay[0]}</p>
					)}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="cc-paymentDay">Payment Day</Label>
					<Input
						id="cc-paymentDay"
						name="paymentDay"
						type="number"
						min={1}
						max={31}
						defaultValue={defaultValues?.paymentDay}
						required
						placeholder="1-31"
					/>
					{!state.success && state.fieldErrors?.paymentDay && (
						<p className="text-destructive text-xs">{state.fieldErrors.paymentDay[0]}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>Card Color</Label>
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
								title={cardColor.label}
							/>
						</label>
					))}
				</div>
				{!state.success && state.fieldErrors?.color && (
					<p className="text-destructive text-xs">{state.fieldErrors.color[0]}</p>
				)}
			</div>

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending
					? "Saving..."
					: mode === FORM_MODE.CREATE
						? "Create Credit Card"
						: "Update Credit Card"}
			</Button>
		</form>
	)
}
