import type { Prisma } from "@/generated/prisma/client"
import { PaymentMethod } from "@/generated/prisma/enums"

import type {
	AnalyticsFilters,
	DateRange,
	DateRangePreset,
	TrendGranularity,
} from "@/features/analytics/types/analytics.types"

/**
 * Dates picked without a time are stored as UTC midnight, so every range here
 * is a pair of UTC days and `to` is the last day included.
 */

const DAY_MS = 24 * 60 * 60 * 1000

type SearchParams = Record<string, string | string[] | undefined>

export const DATE_RANGE_PRESET_VALUES = [
	"thisMonth",
	"lastMonth",
	"30d",
	"3m",
	"6m",
	"12m",
	"ytd",
] as const

export type DateRangePresetValue = (typeof DATE_RANGE_PRESET_VALUES)[number]

const DEFAULT_PRESET: DateRangePresetValue = "12m"

function utcDay(year: number, monthIndex: number, day: number): Date {
	return new Date(Date.UTC(year, monthIndex, day))
}

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * DAY_MS)
}

function lastDayOfMonth(year: number, monthIndex: number): number {
	return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function getSingleParam(params: SearchParams, key: string): string | null {
	const value = params[key]
	return typeof value === "string" && value.length > 0 ? value : null
}

/** Formats a UTC day as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
	return date.toISOString().slice(0, 10)
}

/** Parses YYYY-MM-DD into its UTC midnight, rejecting impossible dates. */
export function parseDateKey(value: string | null): Date | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
	const [year, month, day] = value.split("-").map(Number)
	const date = utcDay(year, month - 1, day)
	return toDateKey(date) === value ? date : null
}

/** First instant after the range, for `lt` comparisons. */
export function getRangeEnd(to: Date): Date {
	return addDays(to, 1)
}

/** Localized "1 – 7 nov 2026" label for two date keys. */
export function formatRangeLabel(from: string, to: string, locale: string): string {
	const format = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	})
	return format.formatRange(new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`))
}

export function getDateRangePresets(now = new Date()): DateRangePreset[] {
	// The server's calendar day, expressed as the UTC day dates are stored on
	const year = now.getFullYear()
	const month = now.getMonth()
	const today = utcDay(year, month, now.getDate())

	return [
		{ value: "thisMonth", from: utcDay(year, month, 1), to: today },
		{
			value: "lastMonth",
			from: utcDay(year, month - 1, 1),
			to: utcDay(year, month - 1, lastDayOfMonth(year, month - 1)),
		},
		{ value: "30d", from: addDays(today, -29), to: today },
		{ value: "3m", from: utcDay(year, month - 3, now.getDate() + 1), to: today },
		{ value: "6m", from: utcDay(year, month - 6, now.getDate() + 1), to: today },
		{ value: "12m", from: utcDay(year - 1, month, now.getDate() + 1), to: today },
		{ value: "ytd", from: utcDay(year, 0, 1), to: today },
	]
}

export function parseDateRange(
	params: SearchParams,
	now = new Date(),
): DateRange & { preset: string } {
	const presets = getDateRangePresets(now)
	const rawPreset = getSingleParam(params, "preset")
	const matched = presets.find((preset) => preset.value === rawPreset)
	if (matched) return { from: matched.from, to: matched.to, preset: matched.value }

	const from = parseDateKey(getSingleParam(params, "from"))
	const to = parseDateKey(getSingleParam(params, "to"))
	if (from && to) {
		return from <= to
			? { from, to, preset: "custom" }
			: { from: to, to: from, preset: "custom" }
	}

	const fallback = presets.find((preset) => preset.value === DEFAULT_PRESET)!
	return { from: fallback.from, to: fallback.to, preset: fallback.value }
}

/**
 * The period a range is compared against. A range inside one month that starts
 * on the 1st is compared with the same days of the previous month; anything
 * else with the window of equal length right before it.
 */
export function getPreviousPeriod(from: Date, to: Date): DateRange {
	const sameMonth =
		from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth()

	if (from.getUTCDate() === 1 && sameMonth) {
		const year = from.getUTCFullYear()
		const prevMonth = from.getUTCMonth() - 1
		const prevLastDay = lastDayOfMonth(year, prevMonth)
		const toDay = to.getUTCDate() === lastDayOfMonth(year, to.getUTCMonth())
			? prevLastDay
			: Math.min(to.getUTCDate(), prevLastDay)
		return { from: utcDay(year, prevMonth, 1), to: utcDay(year, prevMonth, toDay) }
	}

	const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1
	return { from: addDays(from, -days), to: addDays(from, -1) }
}

export function getTrendGranularity(from: Date, to: Date): TrendGranularity {
	const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1
	if (days <= 31) return "day"
	if (days <= 92) return "week"
	return "month"
}

/** Chart buckets covering the range; each key is the bucket's first day. */
export function getTrendBuckets(
	from: Date,
	to: Date,
	granularity: TrendGranularity,
): Array<{ key: string; start: Date }> {
	const buckets: Array<{ key: string; start: Date }> = []
	let start = from

	while (start <= to) {
		buckets.push({ key: toDateKey(start), start })
		if (granularity === "day") start = addDays(start, 1)
		else if (granularity === "week") start = addDays(start, 7)
		else start = utcDay(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
	}

	return buckets
}

/** Key of the bucket a date falls in; buckets must be sorted ascending. */
export function findBucketKey(
	buckets: Array<{ key: string; start: Date }>,
	date: Date,
): string | null {
	let found: string | null = null
	for (const bucket of buckets) {
		if (bucket.start <= date) found = bucket.key
		else break
	}
	return found
}

const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod))

export function parseAnalyticsFilters(params: SearchParams): AnalyticsFilters {
	const rawCategories = getSingleParam(params, "categories")
	const categoryIds = rawCategories
		? [...new Set(rawCategories.split(",").filter(Boolean))]
		: []

	const creditCardId = getSingleParam(params, "card")
	const rawMethod = getSingleParam(params, "method")
	const paymentMethod =
		!creditCardId && rawMethod && PAYMENT_METHODS.has(rawMethod)
			? (rawMethod as PaymentMethod)
			: null

	return {
		categoryIds,
		paymentMethod,
		creditCardId,
		tagId: getSingleParam(params, "tag"),
	}
}

export function hasActiveFilters(filters: AnalyticsFilters): boolean {
	return (
		filters.categoryIds.length > 0 ||
		filters.paymentMethod !== null ||
		filters.creditCardId !== null ||
		filters.tagId !== null
	)
}

/** Selected categories plus the children of any selected parent. */
export function expandCategoryIds(
	selectedIds: string[],
	categories: Array<{ id: string; children: Array<{ id: string }> }>,
): string[] {
	const expanded = new Set(selectedIds)
	for (const category of categories) {
		if (expanded.has(category.id)) {
			for (const child of category.children) expanded.add(child.id)
		}
	}
	return [...expanded]
}

/** Transaction conditions for the filters; category IDs must already be expanded. */
export function buildTransactionFilterWhere(
	filters: AnalyticsFilters,
): Prisma.TransactionWhereInput {
	const where: Prisma.TransactionWhereInput = {}
	if (filters.categoryIds.length > 0) where.categoryId = { in: filters.categoryIds }
	if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod
	if (filters.creditCardId) where.creditCardId = filters.creditCardId
	if (filters.tagId) where.tags = { some: { tagId: filters.tagId } }
	return where
}
