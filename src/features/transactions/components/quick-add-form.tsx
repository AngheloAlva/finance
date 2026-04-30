"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { Camera, Loader2 } from "lucide-react"
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
import { CategorySuggestion } from "@/features/categorization/components/category-suggestion"
import { useCategorySuggestion } from "@/features/categorization/hooks/use-category-suggestion"
import { CategorySelect } from "@/features/categories/components/category-select"
import type { CategoryWithChildren } from "@/features/categories/types/categories.types"
import { createTransactionAction } from "@/features/transactions/actions/create-transaction.action"
import { AmountInput } from "@/features/transactions/components/amount-input"
import { getPaymentMethodOptions } from "@/features/transactions/lib/payment-method-options"
import { FieldError } from "@/shared/components/field-error"
import { cn } from "@/lib/utils"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"
import { PaymentMethod, TransactionType } from "@/generated/prisma/enums"

interface QuickAddFormProps {
	categories: CategoryWithChildren[]
	onSuccess: () => void
}

type QuickAddType = typeof TransactionType.EXPENSE | typeof TransactionType.INCOME

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

export function QuickAddForm({ categories, onSuccess }: QuickAddFormProps) {
	const t = useTranslations("transactions")
	const tc = useTranslations("common")
	const tErrors = useTranslations("errors")

	const [txType, setTxType] = useState<QuickAddType>(TransactionType.EXPENSE)
	const [description, setDescription] = useState("")
	const [categoryId, setCategoryId] = useState("")
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
	const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
	const [defaultAmount, setDefaultAmount] = useState<number | undefined>(undefined)
	const [isScanning, setIsScanning] = useState(false)

	const { suggestion, accept: acceptSuggestion, dismiss: dismissSuggestion } = useCategorySuggestion({
		description,
		categoryId,
	})
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [state, formAction, isPending] = useActionState(createTransactionAction, INITIAL_VOID_STATE)
	const paymentMethodOptions = getPaymentMethodOptions(t)

	useEffect(() => {
		if (state.success) {
			toast.success(t("form.createdSuccess"))
			onSuccess()
		}
	}, [state.success, onSuccess, t])

	async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > MAX_RECEIPT_BYTES) {
			toast.error(t("quickAdd.scanTooLarge"))
			if (fileInputRef.current) fileInputRef.current.value = ""
			return
		}

		setIsScanning(true)
		try {
			const formData = new FormData()
			formData.append("image", file)

			const res = await fetch("/api/scan-receipt", { method: "POST", body: formData })

			if (res.status === 413) {
				toast.error(t("quickAdd.scanTooLarge"))
				return
			}
			if (!res.ok) throw new Error("scan failed")

			const data = await res.json()

			if (data.description) setDescription(data.description)
			if (data.paymentMethod) setPaymentMethod(data.paymentMethod as PaymentMethod)
			if (data.date) setDate(data.date)
			if (data.amount != null) setDefaultAmount(Math.round(data.amount * 100))

			toast.success(t("quickAdd.scanSuccess"))
		} catch {
			toast.error(t("quickAdd.scanError"))
		} finally {
			setIsScanning(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	return (
		<div className="flex flex-col gap-4 px-4 pb-6">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="hidden"
				onChange={handleScan}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				disabled={isScanning}
				className="text-muted-foreground hover:border-foreground hover:text-foreground flex items-center justify-center gap-2 rounded-none border border-dashed px-3 py-2 text-xs transition-colors disabled:opacity-50"
			>
				{isScanning ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Camera className="h-3.5 w-3.5" />
				)}
				{isScanning ? tc("loading") : t("quickAdd.scan")}
			</button>

			<form action={formAction} className="flex flex-col gap-4">
			<input type="hidden" name="date" value={date} />
			<input type="hidden" name="impactDate" value={date} />
			<input type="hidden" name="type" value={txType} />

			{!state.success && state.error && (
				<div className="border-destructive/50 bg-destructive/10 text-destructive rounded-none border px-3 py-2 text-xs">
					{tErrors(state.error as Parameters<typeof tErrors>[0])}
				</div>
			)}

			<div className="grid grid-cols-2 gap-1 rounded-none border p-1">
				<button
					type="button"
					onClick={() => setTxType(TransactionType.EXPENSE)}
					className={cn(
						"rounded-none py-1.5 text-xs font-medium transition-colors",
						txType === TransactionType.EXPENSE
							? "bg-foreground text-background"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("types.expense")}
				</button>
				<button
					type="button"
					onClick={() => setTxType(TransactionType.INCOME)}
					className={cn(
						"rounded-none py-1.5 text-xs font-medium transition-colors",
						txType === TransactionType.INCOME
							? "bg-foreground text-background"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("types.income")}
				</button>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("form.amount")}</Label>
				<AmountInput key={defaultAmount ?? "empty"} name="amount" defaultValue={defaultAmount} />
				{!state.success && <FieldError errors={state.fieldErrors?.amount} />}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>{t("form.description")}</Label>
				<Input
					name="description"
					type="text"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					required
					placeholder={t("form.descriptionPlaceholder")}
					autoComplete="off"
				/>
				{!state.success && <FieldError errors={state.fieldErrors?.description} />}
				{suggestion && (
					<CategorySuggestion
						suggestion={suggestion}
						onAccept={(id) => acceptSuggestion(id, setCategoryId)}
						onDismiss={dismissSuggestion}
					/>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>{t("form.paymentMethod")}</Label>
					<Select
						name="paymentMethod"
						value={paymentMethod}
						onValueChange={(v) => v && setPaymentMethod(v as PaymentMethod)}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{paymentMethodOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label>{t("form.category")}</Label>
					<CategorySelect
						categories={categories}
						name="categoryId"
						value={categoryId}
						onValueChange={(v) => setCategoryId(v ?? "")}
						error={!state.success ? state.fieldErrors?.categoryId?.[0] : undefined}
					/>
				</div>
			</div>

			<Button type="submit" disabled={isPending} className="w-full">
				{isPending ? tc("saving") : t("quickAdd.save")}
			</Button>
			</form>
		</div>
	)
}
