"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import type { InvestmentType } from "@/generated/prisma/enums"
import { InvestmentForm } from "@/features/investments/components/investment-form"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface InvestmentDialogProps {
	mode: FormMode
	investment?: {
		id: string
		type: InvestmentType
		name: string
		institution: string
		initialAmount: number
		currency: string
		startDate: Date
		maturityDate: Date | null
		estimatedReturn: number | null
		isActive: boolean
		purchaseExchangeRate: number | null
		currentExchangeRate: number | null
		totalFees: number | null
	}
	trigger: ReactNode
}

export function InvestmentDialog({ mode, investment, trigger }: InvestmentDialogProps) {
	const t = useTranslations("investments.dialog")
	const defaultValues = investment
		? {
				id: investment.id,
				type: investment.type,
				name: investment.name,
				institution: investment.institution,
				initialAmount: investment.initialAmount,
				currency: investment.currency,
				startDate: investment.startDate.toISOString().split("T")[0],
				maturityDate: investment.maturityDate
					? investment.maturityDate.toISOString().split("T")[0]
					: undefined,
				estimatedReturn: investment.estimatedReturn ?? undefined,
				isActive: investment.isActive,
				purchaseExchangeRate: investment.purchaseExchangeRate ?? undefined,
				currentExchangeRate: investment.currentExchangeRate ?? undefined,
				totalFees: investment.totalFees ?? undefined,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? t("newTitle") : t("editTitle")}
			description={
				mode === FORM_MODE.CREATE
					? t("newDescription")
					: t("editDescription")
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<InvestmentForm mode={mode} defaultValues={defaultValues} onSuccess={onSuccess} />
			)}
		</FormDialog>
	)
}
