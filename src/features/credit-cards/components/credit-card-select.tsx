"use client"

import { useMemo } from "react"
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
	const items = useMemo(
		() =>
			creditCards.map((card) => ({
				value: card.id,
				label: `${card.name} (*${card.lastFourDigits})`,
			})),
		[creditCards],
	)

	return (
		<div className="flex flex-col gap-1.5">
			<Select name={name} value={value} onValueChange={onChange} defaultValue={defaultValue} items={items}>
				<SelectTrigger className="w-full" aria-invalid={error ? true : undefined}>
					<SelectValue placeholder="Select credit card" />
				</SelectTrigger>
				<SelectContent>
					{creditCards.map((card) => (
						<SelectItem key={card.id} value={card.id}>
							{card.name} (*{card.lastFourDigits})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	)
}
