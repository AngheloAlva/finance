import { prisma } from "@/shared/lib/prisma"

import type { CategorizationRuleWithCategory } from "../types/categorization.types"

export async function getUserRules(userId: string): Promise<CategorizationRuleWithCategory[]> {
	return prisma.categorizationRule.findMany({
		where: { userId },
		include: {
			category: {
				select: { id: true, name: true, icon: true, color: true },
			},
		},
		orderBy: [{ hitCount: "desc" }, { createdAt: "desc" }],
	})
}

/**
 * Returns active rules for a user, sorted by hitCount descending so the
 * most-used rules are matched first by the engine.
 */
export async function getActiveRulesForMatching(userId: string) {
	return prisma.categorizationRule.findMany({
		where: { userId, isActive: true },
		include: {
			category: {
				select: { id: true, name: true, icon: true, color: true },
			},
		},
		orderBy: { hitCount: "desc" },
	})
}
