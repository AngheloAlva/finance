"use server"

import { findMatchingRule } from "@/features/categorization/lib/categorization.engine"
import { getActiveRulesForMatching } from "@/features/categorization/lib/categorization.queries"
import type { CategorySuggestion } from "@/features/categorization/types/categorization.types"
import { requireSession } from "@/shared/lib/auth"

/**
 * Server action called from the client (not a form action).
 * Returns a category suggestion if any rule matches the description.
 */
export async function suggestCategoryAction(description: string): Promise<CategorySuggestion | null> {
	if (!description || description.trim().length === 0) return null
	if (description.length > 500) return null

	const session = await requireSession()

	const rules = await getActiveRulesForMatching(session.user.id)
	if (rules.length === 0) return null

	const match = findMatchingRule(rules, description)
	if (!match) return null

	return {
		ruleId: match.id,
		categoryId: match.category.id,
		categoryName: match.category.name,
		categoryColor: match.category.color,
		categoryIcon: match.category.icon,
	}
}
