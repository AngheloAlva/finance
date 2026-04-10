import type { Budget, Category } from "@/generated/prisma/client"

export const BUDGET_STATUS = {
	OK: "ok",
	WARNING: "warning",
	EXCEEDED: "exceeded",
} as const

export type BudgetStatus = (typeof BUDGET_STATUS)[keyof typeof BUDGET_STATUS]

export interface BudgetWithSpending {
	budget: Budget & {
		category: Pick<Category, "id" | "name" | "icon" | "color">
	}
	actual: number
	percentage: number
	status: BudgetStatus
}

export interface BudgetSummary {
	totalBudgeted: number
	totalSpent: number
	categoriesOnTrack: number
	categoriesWarning: number
	categoriesExceeded: number
	totalCategories: number
}
