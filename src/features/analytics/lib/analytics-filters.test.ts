import { describe, expect, it } from "vitest"

import {
	buildTransactionFilterWhere,
	expandCategoryIds,
	getDateRangePresets,
	getPreviousPeriod,
	getTrendBuckets,
	getTrendGranularity,
	parseAnalyticsFilters,
	parseDateRange,
	toDateKey,
} from "@/features/analytics/lib/analytics-filters"

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day))

// Saturday 2026-11-07, local noon
const NOW = new Date(2026, 10, 7, 12)

describe("getDateRangePresets", () => {
	it("lists this month and last month before the rolling presets", () => {
		expect(getDateRangePresets(NOW).map((p) => p.value)).toEqual([
			"thisMonth",
			"lastMonth",
			"30d",
			"3m",
			"6m",
			"12m",
			"ytd",
		])
	})

	it("uses inclusive UTC days for every preset", () => {
		const byValue = Object.fromEntries(getDateRangePresets(NOW).map((p) => [p.value, p]))
		expect(toDateKey(byValue.thisMonth.from)).toBe("2026-11-01")
		expect(toDateKey(byValue.thisMonth.to)).toBe("2026-11-07")
		expect(toDateKey(byValue.lastMonth.from)).toBe("2026-10-01")
		expect(toDateKey(byValue.lastMonth.to)).toBe("2026-10-31")
		expect(toDateKey(byValue["30d"].from)).toBe("2026-10-09")
		expect(toDateKey(byValue.ytd.from)).toBe("2026-01-01")
	})
})

describe("rolling presets at month end", () => {
	it("start the day after the same day N months ago, clamped to that month's end", () => {
		const byValue = (now: Date) =>
			Object.fromEntries(getDateRangePresets(now).map((p) => [p.value, p]))
		// May 31: three months ago is Feb 28, so the window starts Mar 1
		expect(toDateKey(byValue(new Date(2026, 4, 31, 12))["3m"].from)).toBe("2026-03-01")
		// Feb 29 2028: a year ago is Feb 28 2027, so the window starts Mar 1 2027
		expect(toDateKey(byValue(new Date(2028, 1, 29, 12))["12m"].from)).toBe("2027-03-01")
		expect(toDateKey(byValue(NOW)["3m"].from)).toBe("2026-08-08")
	})
})

describe("parseDateRange", () => {
	it("resolves a known preset", () => {
		const range = parseDateRange({ preset: "lastMonth" }, NOW)
		expect(range.preset).toBe("lastMonth")
		expect(toDateKey(range.to)).toBe("2026-10-31")
	})

	it("reads custom days as UTC midnight, keeping the end day", () => {
		const range = parseDateRange({ from: "2026-01-01", to: "2026-02-01" }, NOW)
		expect(range.preset).toBe("custom")
		expect(range.from).toEqual(utc(2026, 1, 1))
		expect(range.to).toEqual(utc(2026, 2, 1))
	})

	it("swaps a reversed custom range", () => {
		const range = parseDateRange({ from: "2026-03-10", to: "2026-03-01" }, NOW)
		expect(toDateKey(range.from)).toBe("2026-03-01")
		expect(toDateKey(range.to)).toBe("2026-03-10")
	})

	it("limits a custom range to the five years before its end day", () => {
		const range = parseDateRange({ from: "1000-01-01", to: "2026-11-07" }, NOW)
		expect(toDateKey(range.from)).toBe("2021-11-08")
		expect(toDateKey(range.to)).toBe("2026-11-07")
	})

	it("falls back to the last 12 months for missing or invalid input", () => {
		expect(parseDateRange({}, NOW).preset).toBe("12m")
		expect(parseDateRange({ from: "nope", to: "2026-13-40" }, NOW).preset).toBe("12m")
		expect(parseDateRange({ preset: "999y" }, NOW).preset).toBe("12m")
	})
})

describe("getPreviousPeriod", () => {
	it("compares a month-to-date range with the same days of the previous month", () => {
		const prev = getPreviousPeriod(utc(2026, 11, 1), utc(2026, 11, 7))
		expect(toDateKey(prev.from)).toBe("2026-10-01")
		expect(toDateKey(prev.to)).toBe("2026-10-07")
	})

	it("compares a full month with the whole previous month", () => {
		const prev = getPreviousPeriod(utc(2026, 3, 1), utc(2026, 3, 31))
		expect(toDateKey(prev.from)).toBe("2026-02-01")
		expect(toDateKey(prev.to)).toBe("2026-02-28")
	})

	it("uses the window of equal length right before any other range", () => {
		const prev = getPreviousPeriod(utc(2026, 10, 9), utc(2026, 11, 7))
		expect(toDateKey(prev.from)).toBe("2026-09-09")
		expect(toDateKey(prev.to)).toBe("2026-10-08")
	})
})

describe("getTrendGranularity", () => {
	it("picks days up to a month, weeks up to a quarter, then months", () => {
		expect(getTrendGranularity(utc(2026, 10, 1), utc(2026, 10, 31))).toBe("day")
		expect(getTrendGranularity(utc(2026, 8, 1), utc(2026, 10, 31))).toBe("week")
		expect(getTrendGranularity(utc(2026, 1, 1), utc(2026, 10, 31))).toBe("month")
	})
})

describe("getTrendBuckets", () => {
	it("creates one bucket per day", () => {
		const buckets = getTrendBuckets(utc(2026, 11, 1), utc(2026, 11, 3), "day")
		expect(buckets.map((b) => b.key)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"])
	})

	it("creates seven-day buckets starting at the range start", () => {
		const buckets = getTrendBuckets(utc(2026, 11, 1), utc(2026, 11, 15), "week")
		expect(buckets.map((b) => b.key)).toEqual(["2026-11-01", "2026-11-08", "2026-11-15"])
	})

	it("creates calendar-month buckets, the first one starting at the range start", () => {
		const buckets = getTrendBuckets(utc(2026, 1, 15), utc(2026, 3, 2), "month")
		expect(buckets.map((b) => b.key)).toEqual(["2026-01-15", "2026-02-01", "2026-03-01"])
	})
})

describe("parseAnalyticsFilters", () => {
	it("reads categories, method, card and tag from the URL", () => {
		expect(
			parseAnalyticsFilters({ categories: "a,b,,a", method: "CASH", tag: "t1" }),
		).toEqual({ categoryIds: ["a", "b"], paymentMethod: "CASH", creditCardId: null, tagId: "t1" })
	})

	it("ignores unknown payment methods and lets a card win over a method", () => {
		expect(parseAnalyticsFilters({ method: "BITCOIN" }).paymentMethod).toBeNull()
		const filters = parseAnalyticsFilters({ method: "CASH", card: "c1" })
		expect(filters.creditCardId).toBe("c1")
		expect(filters.paymentMethod).toBeNull()
	})

	it("returns empty filters when nothing is set", () => {
		expect(parseAnalyticsFilters({})).toEqual({
			categoryIds: [],
			paymentMethod: null,
			creditCardId: null,
			tagId: null,
		})
	})
})

describe("expandCategoryIds", () => {
	const categories = [
		{ id: "food", children: [{ id: "groceries" }, { id: "restaurants" }] },
		{ id: "fun", children: [] },
	]

	it("adds the children of a selected parent", () => {
		expect(expandCategoryIds(["food"], categories).sort()).toEqual(
			["food", "groceries", "restaurants"].sort(),
		)
	})

	it("keeps a selected child alone", () => {
		expect(expandCategoryIds(["restaurants"], categories)).toEqual(["restaurants"])
	})
})

describe("buildTransactionFilterWhere", () => {
	it("returns no conditions without filters", () => {
		expect(
			buildTransactionFilterWhere({
				categoryIds: [],
				paymentMethod: null,
				creditCardId: null,
				tagId: null,
			}),
		).toEqual({})
	})

	it("maps every filter to its transaction condition", () => {
		expect(
			buildTransactionFilterWhere({
				categoryIds: ["food", "groceries"],
				paymentMethod: "DEBIT",
				creditCardId: null,
				tagId: "trip",
			}),
		).toEqual({
			categoryId: { in: ["food", "groceries"] },
			paymentMethod: "DEBIT",
			tags: { some: { tagId: "trip" } },
		})
		expect(
			buildTransactionFilterWhere({
				categoryIds: [],
				paymentMethod: null,
				creditCardId: "visa",
				tagId: null,
			}),
		).toEqual({ creditCardId: "visa" })
	})
})
