import { describe, expect, it } from "vitest"

import { getVisibleNavGroups } from "@/shared/lib/navigation"

const hrefs = (simpleMode: boolean) =>
	getVisibleNavGroups(simpleMode).flatMap((group) => group.items.map((item) => item.href))

describe("getVisibleNavGroups", () => {
	it("shows only the everyday sections and settings in simple mode", () => {
		expect(hrefs(true)).toEqual(["/", "/transactions", "/budgets", "/goals", "/settings"])
	})

	it("drops groups that end up empty in simple mode", () => {
		expect(getVisibleNavGroups(true).map((group) => group.key)).toEqual([
			"groupDaily",
			"groupPlan",
			"groupAccount",
		])
	})

	it("keeps the full navigation in its previous order when simple mode is off", () => {
		expect(hrefs(false)).toEqual([
			"/",
			"/transactions",
			"/budgets",
			"/recurring",
			"/analytics",
			"/goals",
			"/simulations",
			"/credit-cards",
			"/investments",
			"/alerts",
			"/categories",
			"/groups",
			"/settings",
		])
	})
})
