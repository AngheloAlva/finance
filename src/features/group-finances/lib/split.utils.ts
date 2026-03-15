/**
 * Split generation utilities for group transactions.
 *
 * All amounts are in integer cents. Splitting uses floor division with
 * deterministic remainder distribution to guarantee zero rounding drift:
 * the sum of all splits always equals the original total.
 */

import { SplitRule } from "@/generated/prisma/enums"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SplitMember {
	userId: string
	name: string
}

interface SplitRow {
	userId: string
	amount: number
}

interface ProportionalSplitInput {
	userId: string
	percentage: number
}

interface CustomSplitInput {
	userId: string
	amount: number
}

// ---------------------------------------------------------------------------
// Equal splits
// ---------------------------------------------------------------------------

/**
 * Distribute `totalAmount` equally among `members`.
 *
 * Each member gets `Math.floor(totalAmount / count)`.
 * The first N members (sorted alphabetically by userId) receive +1 cent
 * to absorb the remainder. This guarantees sum === totalAmount.
 */
function generateEqualSplits(totalAmount: number, members: SplitMember[]): SplitRow[] {
	if (members.length === 0) {
		throw new Error("Cannot split among zero members")
	}

	const count = members.length
	const base = Math.floor(totalAmount / count)
	const remainder = totalAmount - base * count

	const sorted = [...members].sort((a, b) => a.userId.localeCompare(b.userId))

	return sorted.map((member, i) => ({
		userId: member.userId,
		amount: i < remainder ? base + 1 : base,
	}))
}

// ---------------------------------------------------------------------------
// Proportional splits
// ---------------------------------------------------------------------------

/**
 * Distribute `totalAmount` proportionally based on percentages.
 *
 * Uses the largest-remainder method:
 *   1. Floor each member's share.
 *   2. Compute the shortfall (totalAmount - sum of floors).
 *   3. Award +1 cent to the members with the largest fractional remainders
 *      until the shortfall is zero.
 *
 * Rejects if percentages don't sum to 100.
 */
function generateProportionalSplits(
	totalAmount: number,
	members: ProportionalSplitInput[]
): SplitRow[] {
	if (members.length === 0) {
		throw new Error("Cannot split among zero members")
	}

	const totalPercentage = members.reduce((sum, m) => sum + m.percentage, 0)

	if (Math.abs(totalPercentage - 100) > 0.001) {
		throw new Error(`Percentages must sum to 100, got ${totalPercentage}`)
	}

	const rawShares = members.map((m) => {
		const exact = (totalAmount * m.percentage) / 100
		const floored = Math.floor(exact)
		return {
			userId: m.userId,
			floored,
			fractional: exact - floored,
		}
	})

	const allocated = rawShares.reduce((sum, s) => sum + s.floored, 0)
	let remaining = totalAmount - allocated

	// Sort by fractional remainder descending, break ties by userId ascending
	const ranked = [...rawShares].sort((a, b) => {
		const diff = b.fractional - a.fractional
		if (Math.abs(diff) > Number.EPSILON) return diff
		return a.userId.localeCompare(b.userId)
	})

	const result = new Map<string, number>()
	for (const s of rawShares) {
		result.set(s.userId, s.floored)
	}

	for (const s of ranked) {
		if (remaining <= 0) break
		result.set(s.userId, (result.get(s.userId) ?? 0) + 1)
		remaining--
	}

	return members.map((m) => ({
		userId: m.userId,
		amount: result.get(m.userId) ?? 0,
	}))
}

// ---------------------------------------------------------------------------
// Custom splits
// ---------------------------------------------------------------------------

/**
 * Validate and pass through custom split amounts.
 *
 * All amounts must be positive and their sum must equal `totalAmount`.
 */
function generateCustomSplits(totalAmount: number, members: CustomSplitInput[]): SplitRow[] {
	if (members.length === 0) {
		throw new Error("Cannot split among zero members")
	}

	for (const m of members) {
		if (m.amount <= 0) {
			throw new Error(`Amount must be positive for user ${m.userId}, got ${m.amount}`)
		}
	}

	const sum = members.reduce((acc, m) => acc + m.amount, 0)
	if (sum !== totalAmount) {
		throw new Error(`Custom split amounts must sum to ${totalAmount}, got ${sum}`)
	}

	return members.map((m) => ({
		userId: m.userId,
		amount: m.amount,
	}))
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

interface GenerateSplitsInput {
	totalAmount: number
	splitRule: SplitRule
	members: SplitMember[]
	proportionalSplits?: ProportionalSplitInput[]
	customSplits?: CustomSplitInput[]
}

/**
 * Route to the correct split generator based on `splitRule`.
 */
function generateSplits(input: GenerateSplitsInput): SplitRow[] {
	const { totalAmount, splitRule, members, proportionalSplits, customSplits } = input

	switch (splitRule) {
		case SplitRule.EQUAL:
			return generateEqualSplits(totalAmount, members)

		case SplitRule.PROPORTIONAL: {
			if (!proportionalSplits) {
				throw new Error("proportionalSplits is required when splitRule is PROPORTIONAL")
			}
			return generateProportionalSplits(totalAmount, proportionalSplits)
		}

		case SplitRule.CUSTOM: {
			if (!customSplits) {
				throw new Error("customSplits is required when splitRule is CUSTOM")
			}
			return generateCustomSplits(totalAmount, customSplits)
		}
	}
}

export { generateCustomSplits, generateEqualSplits, generateProportionalSplits, generateSplits }
export type { CustomSplitInput, GenerateSplitsInput, ProportionalSplitInput, SplitMember, SplitRow }
