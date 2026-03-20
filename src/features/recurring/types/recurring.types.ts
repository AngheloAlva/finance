import type { Category, RecurrenceRule, Transaction } from "@/generated/prisma/client"
import type { RecurrenceFrequency } from "@/generated/prisma/enums"

export type RecurringTemplateWithRule = Transaction & {
	recurrenceRule: Pick<
		RecurrenceRule,
		"id" | "frequency" | "interval" | "nextGenerationDate" | "endDate" | "isActive"
	>
	category: Pick<Category, "id" | "name" | "icon" | "color">
}

export interface RecurrenceFormValues {
	description: string
	amount: string
	type: string
	categoryId: string
	paymentMethod: string
	notes?: string
	frequency: RecurrenceFrequency
	interval: number
	startDate: string
	endDate?: string
}

export const FREQUENCY_KEYS: Record<RecurrenceFrequency, string> = {
	DAILY: "daily",
	WEEKLY: "weekly",
	BIWEEKLY: "biweekly",
	MONTHLY: "monthly",
	BIMONTHLY: "bimonthly",
	QUARTERLY: "quarterly",
	SEMIANNUAL: "semiannual",
	ANNUAL: "annual",
} as const
