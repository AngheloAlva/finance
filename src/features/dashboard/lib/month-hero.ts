export type MonthHero =
	| { mode: "net"; amount: number }
	| {
			mode: "budget" | "overBudget"
			amount: number
			spent: number
			budgeted: number
			percent: number
	  }

/** Picks the single number the dashboard opens with. */
export function getMonthHero(
	overview: { totalIncome: number; totalExpenses: number },
	budgets: { totalBudgeted: number; totalSpent: number } | null,
): MonthHero {
	if (!budgets || budgets.totalBudgeted === 0) {
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
