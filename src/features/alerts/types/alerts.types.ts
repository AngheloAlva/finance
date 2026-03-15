import { Alert } from "@/generated/prisma/client"
import type {
	AlertStatus,
	GoalStatus,
	TransactionType,
	PaymentMethod,
} from "@/generated/prisma/enums"

export type AlertWithReference = Alert & {
	referenceName?: string
}

export interface AlertFilterParams {
	status?: AlertStatus
	page: number
	pageSize: number
}

export interface TransactionAlertContext {
	transactionId: string
	categoryId: string
	userId: string
	impactDate: Date
	amount: number
	type: TransactionType
	paymentMethod: PaymentMethod
	creditCardId: string | null
}

export interface GoalAlertContext {
	goalId: string
	userId: string
	goalName: string
	targetAmount: number
	totalContributed: number
	targetDate: Date | null
	status: GoalStatus
}

export interface InvestmentAlertContext {
	investmentId: string
	userId: string
	investmentName: string
	initialAmount: number
	currentValue: number
}
