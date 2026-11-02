import { describe, expect, it } from "vitest"

import {
	SYSTEM_CATEGORIES,
	localizeCategories,
	localizeCategoryName,
	systemCategoryId,
} from "@/features/categories/lib/system-categories"
import { ICON_MAP } from "@/shared/lib/icons"

const allEntries = SYSTEM_CATEGORIES.flatMap((root) => [
	root,
	...(root.children ?? []),
])

describe("SYSTEM_CATEGORIES", () => {
	it("gives every category a unique slug, both names and a known icon", () => {
		const slugs = allEntries.map((entry) => entry.slug)
		expect(new Set(slugs).size).toBe(slugs.length)

		for (const entry of allEntries) {
			expect(entry.name.en.trim()).not.toBe("")
			expect(entry.name.es.trim()).not.toBe("")
			expect(ICON_MAP[entry.icon], entry.icon).toBeDefined()
		}
	})

	it("keeps the slugs the demo seed and existing tests depend on", () => {
		const slugs = new Set(allEntries.map((entry) => entry.slug))
		for (const slug of [
			"restaurants",
			"groceries",
			"coffee",
			"fuel",
			"public-transit",
			"taxi-rideshare",
			"rent",
			"utilities",
			"entertainment",
			"salary",
			"freelance",
			"subscriptions",
			"shopping",
			"medical",
			"gym",
			"education",
			"transfer",
		]) {
			expect(slugs.has(slug), slug).toBe(true)
		}
	})

	it("offers a broad default set for every transaction type", () => {
		const count = (type: string) =>
			allEntries.filter(
				(entry) =>
					SYSTEM_CATEGORIES.find(
						(root) => root === entry || root.children?.includes(entry),
					)?.transactionType === type,
			).length

		expect(count("EXPENSE")).toBeGreaterThanOrEqual(80)
		expect(count("INCOME")).toBeGreaterThanOrEqual(8)
		expect(count("TRANSFER")).toBeGreaterThanOrEqual(3)
	})
})

describe("localizeCategoryName", () => {
	const groceries = { id: systemCategoryId("groceries"), name: "Groceries" }

	it("translates a system category to the active locale", () => {
		expect(localizeCategoryName(groceries, "es")).toBe("Supermercado")
		expect(localizeCategoryName(groceries, "en")).toBe("Groceries")
	})

	it("leaves user-created categories exactly as typed", () => {
		const custom = { id: "cuid123", name: "Mis cosas" }
		expect(localizeCategoryName(custom, "en")).toBe("Mis cosas")
		expect(localizeCategoryName(custom, "es")).toBe("Mis cosas")
	})

	it("falls back to the stored name for an unknown system id", () => {
		const unknown = { id: "sys_cat_removed", name: "Old" }
		expect(localizeCategoryName(unknown, "es")).toBe("Old")
	})
})

describe("localizeCategories", () => {
	it("translates roots and children and sorts both by the translated name", () => {
		const result = localizeCategories(
			[
				{
					id: systemCategoryId("transport"),
					name: "Transport",
					children: [
						{ id: systemCategoryId("fuel"), name: "Fuel" },
						{ id: systemCategoryId("public-transit"), name: "Public Transit" },
					],
				},
				{ id: systemCategoryId("food-dining"), name: "Food & Dining", children: [] },
			],
			"es",
		)

		expect(result.map((category) => category.name)).toEqual([
			"Comida",
			"Transporte",
		])
		expect(result[1]?.children.map((child) => child.name)).toEqual([
			"Bencina",
			"Transporte público",
		])
	})
})
