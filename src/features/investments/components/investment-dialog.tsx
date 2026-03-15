"use client"

import type { ReactNode } from "react"

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
	}
	trigger: ReactNode
}

export function InvestmentDialog({ mode, investment, trigger }: InvestmentDialogProps) {
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
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? "New Investment" : "Edit Investment"}
			description={
				mode === FORM_MODE.CREATE
					? "Add a new investment to track your portfolio."
					: "Update the investment details."
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<InvestmentForm mode={mode} defaultValues={defaultValues} onSuccess={onSuccess} />
			)}
		</FormDialog>
	)
}
