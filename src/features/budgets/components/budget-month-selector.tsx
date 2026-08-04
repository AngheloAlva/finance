"use client"

import { MonthSelector } from "@/shared/components/month-selector"

interface BudgetMonthSelectorProps {
	month: number
	year: number
}

export function BudgetMonthSelector({ month, year }: BudgetMonthSelectorProps) {
	return (
		<MonthSelector
			month={month}
			year={year}
			buildHref={(m, y) => `/budgets?month=${m}&year=${y}`}
		/>
	)
}
