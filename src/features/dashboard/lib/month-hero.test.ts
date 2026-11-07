import { describe, expect, it } from "vitest"

import { getMonthHero } from "@/features/dashboard/lib/month-hero"

const overview = { totalIncome: 500_000, totalExpenses: 120_000 }

describe("getMonthHero", () => {
	it("leads with the budget left when the month has budgets", () => {
		expect(
			getMonthHero(overview, { totalBudgeted: 200_000, totalSpent: 150_000 }),
		).toEqual({
			mode: "budget",
			amount: 50_000,
			spent: 150_000,
			budgeted: 200_000,
			percent: 75,
		})
	})

	it("reports the excess as a positive amount when over budget", () => {
		expect(
			getMonthHero(overview, { totalBudgeted: 100_000, totalSpent: 130_000 }),
		).toEqual({
			mode: "overBudget",
			amount: 30_000,
			spent: 130_000,
			budgeted: 100_000,
			percent: 100,
		})
	})

	it("leads with the total balance without budgets", () => {
		expect(getMonthHero({ totalIncome: 0, totalExpenses: 196_050 }, null, 583_422)).toEqual({
			mode: "balance",
			amount: 583_422,
		})
		expect(
			getMonthHero(overview, { totalBudgeted: 0, totalSpent: 0 }, 583_422),
		).toEqual({ mode: "balance", amount: 583_422 })
	})

	it("keeps the budget hero when the month has budgets and a balance", () => {
		expect(
			getMonthHero(overview, { totalBudgeted: 200_000, totalSpent: 150_000 }, 583_422).mode,
		).toBe("budget")
	})

	it("falls back to the month's net without budgets or balance", () => {
		expect(getMonthHero(overview, null)).toEqual({ mode: "net", amount: 380_000 })
		expect(
			getMonthHero(overview, { totalBudgeted: 0, totalSpent: 0 }),
		).toEqual({ mode: "net", amount: 380_000 })
	})
})
