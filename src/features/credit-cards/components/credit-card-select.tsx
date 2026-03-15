"use client"

import type { CreditCard } from "@/generated/prisma/client"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface CreditCardSelectProps {
	creditCards: CreditCard[]
	name: string
	value?: string
	onChange?: (value: string | null) => void
	defaultValue?: string
	error?: string
}

export function CreditCardSelect({
	creditCards,
	name,
	value,
	onChange,
	defaultValue,
	error,
}: CreditCardSelectProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<Select name={name} value={value} onValueChange={onChange} defaultValue={defaultValue}>
				<SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
					<SelectValue placeholder="Select credit card" />
				</SelectTrigger>
				<SelectContent>
					{creditCards.map((card) => (
						<SelectItem key={card.id} value={card.id} label={`${card.name} (*${card.lastFourDigits})`}>
							{card.name} (*{card.lastFourDigits})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	)
}
