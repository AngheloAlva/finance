export type MonthHero =
	| { mode: "balance" | "net"; amount: number }
	| {
			mode: "budget" | "overBudget"
			amount: number
			spent: number
			budgeted: number
			percent: number
	  }

/**
 * Picks the single number the dashboard opens with: the budget left when the
 * month has budgets, otherwise the total balance (what the user has today),
 * and the month's net only when no balance is available.
 */
export function getMonthHero(
	overview: { totalIncome: number; totalExpenses: number },
	budgets: { totalBudgeted: number; totalSpent: number } | null,
	totalBalance: number | null = null,
): MonthHero {
	if (!budgets || budgets.totalBudgeted === 0) {
		if (totalBalance !== null) return { mode: "balance", amount: totalBalance }
		return { mode: "net", amount: overview.totalIncome - overview.totalExpenses }
	}

	const { totalBudgeted: budgeted, totalSpent: spent } = budgets
	const left = budgeted - spent

	return {
		mode: left >= 0 ? "budget" : "overBudget",
		amount: Math.abs(left),
		spent,
		budgeted,
		percent: Math.min(Math.round((spent / budgeted) * 100), 100),
	}
}
