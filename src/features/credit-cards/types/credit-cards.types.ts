import type { CreditCard } from "@/generated/prisma/client"

export type CreditCardWithUsage = CreditCard & {
	usedLimit: number
	availableLimit: number
}

export interface CreditCardFormValues {
	id?: string
	name: string
	lastFourDigits: string
	brand: string
	totalLimit: number
	closingDay: number
	paymentDay: number
	color: string
}
