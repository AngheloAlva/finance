"use client"

import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { SplitRule } from "@/generated/prisma/enums"
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
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { createGroupTransactionAction } from "@/features/group-finances/actions/create-group-transaction.action"
import { SplitInput } from "@/features/group-finances/components/split-input"
import type { SplitMember } from "@/features/group-finances/lib/split.utils"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { FieldError } from "@/shared/components/field-error"
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
	const t = useTranslations("groupFinances.form")
	const tTypes = useTranslations("groupFinances.types")
	const tMethods = useTranslations("groupFinances.paymentMethods")
	const tSplitRules = useTranslations("groupFinances.splitRules")
	const tErrors = useTranslations("errors")
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
			toast.success(t("createdSuccess"))
			onSuccess?.()
		}
	}, [state, onSuccess, t])

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
					{tErrors(state.error as Parameters<typeof tErrors>[0])}
				</div>
			)}

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-amount">{t("amount")}</Label>
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
				{!state.success && <FieldError errors={state.fieldErrors?.amount} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-description">{t("description")}</Label>
				<Input
					id="gtx-description"
					name="description"
					type="text"
					required
					placeholder={t("descriptionPlaceholder")}
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.description} />}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>{t("type")}</Label>
					<Select name="type" defaultValue="EXPENSE" items={[
						{ value: "INCOME", label: tTypes("income") },
						{ value: "EXPENSE", label: tTypes("expense") },
						{ value: "TRANSFER", label: tTypes("transfer") },
					]}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("selectType")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="INCOME">{tTypes("income")}</SelectItem>
							<SelectItem value="EXPENSE">{tTypes("expense")}</SelectItem>
							<SelectItem value="TRANSFER">{tTypes("transfer")}</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && <FieldError errors={state.fieldErrors?.type} />}
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>{t("paymentMethod")}</Label>
					<Select name="paymentMethod" defaultValue="CASH" items={[
						{ value: "CASH", label: tMethods("cash") },
						{ value: "DEBIT", label: tMethods("debit") },
						{ value: "CREDIT", label: tMethods("credit") },
						{ value: "TRANSFER", label: tMethods("transfer") },
						{ value: "OTHER", label: tMethods("other") },
					]}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("selectMethod")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="CASH">{tMethods("cash")}</SelectItem>
							<SelectItem value="DEBIT">{tMethods("debit")}</SelectItem>
							<SelectItem value="CREDIT">{tMethods("credit")}</SelectItem>
							<SelectItem value="TRANSFER">{tMethods("transfer")}</SelectItem>
							<SelectItem value="OTHER">{tMethods("other")}</SelectItem>
						</SelectContent>
					</Select>
					{!state.success && <FieldError errors={state.fieldErrors?.paymentMethod} />}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("category")}</Label>
				<CategorySelect
					categories={categories}
					name="categoryId"
					error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("date")}</Label>
				<DatePicker name="date" required placeholder={t("selectDate")} />
				{!state.success && <FieldError errors={state.fieldErrors?.date} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="gtx-notes">{t("notes")}</Label>
				<Textarea id="gtx-notes" name="notes" placeholder={t("notesPlaceholder")} />
				{!state.success && <FieldError errors={state.fieldErrors?.notes} />}
			</div>

			{/* Split Rule */}
			<div className="flex flex-col gap-1.5">
				<Label>{t("splitRule")}</Label>
				<Select
					name="splitRule"
					value={splitRule}
					onValueChange={(value) => setSplitRule(value as SplitRule)}
					items={[
						{ value: "EQUAL", label: tSplitRules("equal") },
						{ value: "PROPORTIONAL", label: tSplitRules("proportional") },
						{ value: "CUSTOM", label: tSplitRules("custom") },
					]}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={t("selectSplitRule")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="EQUAL">{tSplitRules("equal")}</SelectItem>
						<SelectItem value="PROPORTIONAL">{tSplitRules("proportional")}</SelectItem>
						<SelectItem value="CUSTOM">{tSplitRules("custom")}</SelectItem>
					</SelectContent>
				</Select>
				{!state.success && <FieldError errors={state.fieldErrors?.splitRule} />}
			</div>

			{/* Split Input */}
			<SplitInput
				splitRule={splitRule}
				members={members}
				totalAmount={totalAmountCents}
				onChange={handleSplitChange}
			/>

			{!state.success && <FieldError errors={state.fieldErrors?.splits} />}

			<Button type="submit" disabled={isPending} className="mt-2 w-full">
				{isPending ? t("creating") : t("createTransaction")}
			</Button>
		</form>
	)
}
