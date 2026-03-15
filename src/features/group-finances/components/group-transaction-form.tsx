"use client"

import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { SplitRule } from "@/generated/prisma/enums"
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
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { createGroupTransactionAction } from "@/features/group-finances/actions/create-group-transaction.action"
import { SplitInput } from "@/features/group-finances/components/split-input"
import type { SplitMember } from "@/features/group-finances/lib/split.utils"
import { AmountInput } from "@/features/transactions/components/amount-input"
import type { CurrencyCode } from "@/shared/lib/constants"
import { parseCurrencyInput } from "@/shared/lib/formatters"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

interface GroupTransactionFormProps {
	groupId: string
	members: SplitMember[]
	categories: CategoryWithChildren[]
	currency: CurrencyCode
	onSuccess?: () => void
}

interface SplitData {
	userId: string
	amount?: number
	percentage?: number
}

export function GroupTransactionForm({
	groupId,
	members,
	categories,
	currency,
	onSuccess,
}: GroupTransactionFormProps) {
	const [state, formAction, isPending] = useActionState(createGroupTransactionAction, INITIAL_VOID_STATE)

	const [splitRule, setSplitRule] = useState<SplitRule>(SplitRule.EQUAL)
	const [splits, setSplits] = useState<SplitData[]>([])
	const [amountDisplay, setAmountDisplay] = useState("")

	const totalAmountCents = useMemo(() => {
		return parseCurrencyInput(amountDisplay)
	}, [amountDisplay])

	const handleSplitChange = useCallback((newSplits: SplitData[]) => {
		setSplits(newSplits)
	}, [])

	useEffect(() => {
		if (state.success) {
			toast.success("Group transaction created successfully")
			onSuccess?.()
		}
	}, [state, onSuccess])

	function handleSubmit(formData: FormData) {
		// Inject splits as JSON
		formData.set("splits", JSON.stringify(splits))
		formAction(formData)
	}

	return (
		<form action={handleSubmit} className="flex flex-col gap-4">
			<input type="hidden" name="groupId" value={groupId} />

			{!state.success && state.error && (
				<div className="border-destructive/50 bg-destructive/10 text-destructive rounded-none border px-3 py-2 text-xs">
					{state.error}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-amount">Amount</Label>
				<AmountInput name="amount" />
				<input
					type="hidden"
					name="_amountTracker"
					value=""
					ref={(el) => {
						// Sync amount display from the sibling AmountInput
						if (el) {
							const observer = new MutationObserver(() => {
								const amountInput =
									el.parentElement?.querySelector<HTMLInputElement>('input[name="amount"]')
								if (amountInput) {
									setAmountDisplay(amountInput.value)
								}
							})
							const amountInput =
								el.parentElement?.querySelector<HTMLInputElement>('input[name="amount"]')
							if (amountInput) {
								amountInput.addEventListener("input", () => {
									setAmountDisplay(amountInput.value)
								})
								amountInput.addEventListener("blur", () => {
									setAmountDisplay(amountInput.value)
								})
							}
							return () => observer.disconnect()
						}
					}}
				/>
				{!state.success && state.fieldErrors?.amount && (
					<p className="text-destructive text-xs">{state.fieldErrors.amount[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-description">Description</Label>
				<Input
					id="gtx-description"
					name="description"
					type="text"
					required
					placeholder="e.g. Dinner at restaurant"
				/>
				{!state.success && state.fieldErrors?.description && (
					<p className="text-destructive text-xs">{state.fieldErrors.description[0]}</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Type</Label>
					<Select name="type" defaultValue="EXPENSE">
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
					<Select name="paymentMethod" defaultValue="CASH">
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

			<div className="flex flex-col gap-1.5">
				<Label>Category</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>Date</Label>
				<DatePicker name="date" required placeholder="Select date" />
				{!state.success && state.fieldErrors?.date && (
					<p className="text-destructive text-xs">{state.fieldErrors.date[0]}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-notes">Notes (optional)</Label>
				<Textarea id="gtx-notes" name="notes" placeholder="Any additional details..." />
				{!state.success && state.fieldErrors?.notes && (
					<p className="text-destructive text-xs">{state.fieldErrors.notes[0]}</p>
				)}
			</div>

			{/* Split Rule */}
			<div className="flex flex-col gap-1.5">
				<Label>Split Rule</Label>
				<Select
					name="splitRule"
					value={splitRule}
					onValueChange={(value) => setSplitRule(value as SplitRule)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select split rule" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="EQUAL" label="Equal">Equal</SelectItem>
						<SelectItem value="PROPORTIONAL" label="Proportional">Proportional</SelectItem>
						<SelectItem value="CUSTOM" label="Custom">Custom</SelectItem>
					</SelectContent>
				</Select>
				{!state.success && state.fieldErrors?.splitRule && (
					<p className="text-destructive text-xs">{state.fieldErrors.splitRule[0]}</p>
				)}
			</div>

			{/* Split Input */}
			<SplitInput
				splitRule={splitRule}
				members={members}
				totalAmount={totalAmountCents}
				onChange={handleSplitChange}
			/>

			{!state.success && state.fieldErrors?.splits && (
				<p className="text-destructive text-xs">{state.fieldErrors.splits[0]}</p>
			)}

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? "Creating..." : "Create Transaction"}
			</Button>
		</form>
	)
}
