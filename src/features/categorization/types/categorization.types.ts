import type { CategorizationRule, Category } from "@/generated/prisma/client"
import type { MatchType } from "@/generated/prisma/enums"

export type CategorizationRuleWithCategory = CategorizationRule & {
	category: Pick<Category, "id" | "name" | "icon" | "color">
}

export const MATCH_TYPE_KEYS: Record<MatchType, string> = {
	EXACT: "exact",
	CONTAINS: "contains",
	STARTS_WITH: "startsWith",
} as const

export interface CategorySuggestion {
	ruleId: string
	categoryId: string
	categoryName: string
	categoryColor: string
	categoryIcon: string
}
