/**
 * Recurring transaction utility functions.
 *
 * Pure functions for computing next occurrence dates and generating
 * overdue instances for recurring transaction templates.
 */

import type { RecurrenceFrequency } from "@/generated/prisma/enums"

const FREQUENCY_MULTIPLIER = {
	DAILY: "days",
	WEEKLY: "days",
	BIWEEKLY: "days",
	MONTHLY: "months",
	BIMONTHLY: "months",
	QUARTERLY: "months",
	SEMIANNUAL: "months",
	ANNUAL: "years",
} as const

type TimeUnit = (typeof FREQUENCY_MULTIPLIER)[keyof typeof FREQUENCY_MULTIPLIER]

/**
 * Get the raw increment for a given frequency in its natural unit.
 */
function getIncrement(
	frequency: RecurrenceFrequency,
	interval: number
): { value: number; unit: TimeUnit } {
	switch (frequency) {
		case "DAILY":
			return { value: interval, unit: "days" }
		case "WEEKLY":
			return { value: interval * 7, unit: "days" }
		case "BIWEEKLY":
			return { value: interval * 14, unit: "days" }
		case "MONTHLY":
			return { value: interval, unit: "months" }
		case "BIMONTHLY":
			return { value: interval * 2, unit: "months" }
		case "QUARTERLY":
			return { value: interval * 3, unit: "months" }
		case "SEMIANNUAL":
			return { value: interval * 6, unit: "months" }
		case "ANNUAL":
			return { value: interval, unit: "years" }
	}
}

/**
 * Add days to a date, returning a new Date.
 */
function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

/**
 * Add months to a date, clamping to the last valid day of the target month.
 */
function addMonths(date: Date, months: number): Date {
	const result = new Date(date)
	const targetMonth = result.getMonth() + months
	const targetYear = result.getFullYear() + Math.floor(targetMonth / 12)
	const normalizedMonth = ((targetMonth % 12) + 12) % 12

	// Clamp day to last day of target month
	const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate()
	const day = Math.min(result.getDate(), lastDay)

	result.setFullYear(targetYear, normalizedMonth, day)
	return result
}

/**
 * Add years to a date, handling leap year edge cases (Feb 29 → Feb 28).
 */
function addYears(date: Date, years: number): Date {
	const result = new Date(date)
	const targetYear = result.getFullYear() + years

	// Clamp day for leap year edge case (Feb 29 in non-leap year)
	const lastDay = new Date(targetYear, result.getMonth() + 1, 0).getDate()
	const day = Math.min(result.getDate(), lastDay)

	result.setFullYear(targetYear, result.getMonth(), day)
	return result
}

/**
 * Compute the next occurrence date from a current date based on frequency and interval.
 *
 * Supports all RecurrenceFrequency values:
 * - DAILY: +interval days
 * - WEEKLY: +interval*7 days
 * - BIWEEKLY: +interval*14 days
 * - MONTHLY: +interval months
 * - BIMONTHLY: +interval*2 months
 * - QUARTERLY: +interval*3 months
 * - SEMIANNUAL: +interval*6 months
 * - ANNUAL: +interval years
 *
 * @param currentDate - The current occurrence date
 * @param frequency - The recurrence frequency
 * @param interval - How many frequency units between occurrences (default 1)
 */
export function computeNextDate(
	currentDate: Date,
	frequency: RecurrenceFrequency,
	interval: number
): Date {
	const { value, unit } = getIncrement(frequency, interval)

	switch (unit) {
		case "days":
			return addDays(currentDate, value)
		case "months":
			return addMonths(currentDate, value)
		case "years":
			return addYears(currentDate, value)
	}
}

interface RecurrenceRuleInput {
	nextGenerationDate: Date
	frequency: RecurrenceFrequency
	interval: number
	endDate: Date | null
}

/**
 * Generate all overdue occurrence dates for a recurring template.
 *
 * Loops from rule.nextGenerationDate forward while the date is <= today.
 * Collects each date and advances to the next occurrence.
 * Stops if the next date would exceed the rule's endDate.
 *
 * @param rule - The recurrence rule with nextGenerationDate, frequency, interval, endDate
 * @param today - The current date to check against
 * @returns Array of dates that are due for generation
 */
export function generateDueInstances(rule: RecurrenceRuleInput, today: Date): Date[] {
	const dates: Date[] = []
	let current = new Date(rule.nextGenerationDate)

	// Normalize today to start of day for comparison
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

	while (current <= todayStart) {
		// Check endDate — if current exceeds endDate, stop
		if (rule.endDate && current > rule.endDate) {
			break
		}

		dates.push(new Date(current))

		// Advance to next occurrence
		current = computeNextDate(current, rule.frequency, rule.interval)
	}

	return dates
}
