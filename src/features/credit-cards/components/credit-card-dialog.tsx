"use client"

import type { ReactNode } from "react"

import { CreditCardForm } from "@/features/credit-cards/components/credit-card-form"
import type { CreditCardWithUsage } from "@/features/credit-cards/types/credit-cards.types"
import { FormDialog } from "@/shared/components/form-dialog"
import { FORM_MODE, type FormMode } from "@/shared/types/common.types"

interface CreditCardDialogProps {
	mode: FormMode
	creditCard?: CreditCardWithUsage
	trigger: ReactNode
}

export function CreditCardDialog({ mode, creditCard, trigger }: CreditCardDialogProps) {
	const defaultValues = creditCard
		? {
				id: creditCard.id,
				name: creditCard.name,
				lastFourDigits: creditCard.lastFourDigits,
				brand: creditCard.brand,
				totalLimit: creditCard.totalLimit,
				closingDay: creditCard.closingDay,
				paymentDay: creditCard.paymentDay,
				color: creditCard.color,
			}
		: undefined

	return (
		<FormDialog
			trigger={trigger}
			title={mode === FORM_MODE.CREATE ? "New Credit Card" : "Edit Credit Card"}
			description={
				mode === FORM_MODE.CREATE
					? "Add a new credit card to track your spending."
					: "Update the credit card details."
			}
			className="sm:max-w-md"
		>
			{(onSuccess) => (
				<CreditCardForm mode={mode} defaultValues={defaultValues} onSuccess={onSuccess} />
			)}
		</FormDialog>
	)
}
