import type { Goal, GoalContribution } from "@/generated/prisma/client"

export type GoalWithProgress = Goal & {
	currentAmount: number
	percentage: number
	contributionCount: number
}

export type GoalContributionItem = GoalContribution & {
	user: { id: string; name: string; image: string | null }
}

export type GoalDetail = GoalWithProgress & {
	contributions: GoalContributionItem[]
}

export interface GoalFormValues {
	id?: string
	name: string
	description?: string
	targetAmount: number
	targetDate?: string
	groupId?: string
}
