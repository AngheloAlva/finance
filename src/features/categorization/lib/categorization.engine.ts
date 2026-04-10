import type { CategorizationRule } from "@/generated/prisma/client"
import type { MatchType } from "@/generated/prisma/enums"

/**
 * Pure pattern matching for a single rule against a description.
 * Case-insensitive for all match types.
 */
export function ruleMatches(
	rule: Pick<CategorizationRule, "pattern" | "matchType" | "isActive">,
	description: string,
): boolean {
	if (!rule.isActive) return false

	const pattern = rule.pattern.toLowerCase().trim()
	const target = description.toLowerCase().trim()

	if (pattern.length === 0 || target.length === 0) return false

	return applyMatchType(target, pattern, rule.matchType)
}

function applyMatchType(target: string, pattern: string, matchType: MatchType): boolean {
	switch (matchType) {
		case "EXACT":
			return target === pattern
		case "STARTS_WITH":
			return target.startsWith(pattern)
		case "CONTAINS":
			return target.includes(pattern)
	}
}

/**
 * Find the first matching rule for a description. Rules must be pre-sorted
 * by hitCount descending so the most-used rules match first.
 */
export function findMatchingRule<T extends Pick<CategorizationRule, "pattern" | "matchType" | "isActive">>(
	rules: T[],
	description: string,
): T | null {
	for (const rule of rules) {
		if (ruleMatches(rule, description)) return rule
	}
	return null
}
