import { GoalStatus } from "@/generated/prisma/enums"

import { prisma } from "@/shared/lib/prisma"
import type { GoalWithProgress, GoalDetail } from "@/features/goals/types/goals.types"

function computeProgress(
	goal: { targetAmount: number },
	sum: number,
	count: number
): { currentAmount: number; percentage: number; contributionCount: number } {
	const currentAmount = sum
	const percentage = Math.min(Math.round((currentAmount / goal.targetAmount) * 100), 100)
	return { currentAmount, percentage, contributionCount: count }
}

async function attachProgress<T extends { id: string; targetAmount: number }>(
	goals: T[]
): Promise<(T & ReturnType<typeof computeProgress>)[]> {
	if (goals.length === 0) return []

	const goalIds = goals.map((g) => g.id)

	const aggregations = await prisma.goalContribution.groupBy({
		by: ["goalId"],
		where: { goalId: { in: goalIds } },
		_sum: { amount: true },
		_count: { id: true },
	})

	const aggMap = new Map(
		aggregations.map((a) => [a.goalId, { sum: a._sum.amount ?? 0, count: a._count.id }])
	)

	return goals.map((goal) => {
		const { sum, count } = aggMap.get(goal.id) ?? { sum: 0, count: 0 }
		return { ...goal, ...computeProgress(goal, sum, count) }
	})
}

export async function getUserGoals(
	userId: string,
	status?: GoalStatus
): Promise<GoalWithProgress[]> {
	const goals = await prisma.goal.findMany({
		where: {
			userId,
			groupId: null,
			...(status ? { status } : {}),
		},
		orderBy: { createdAt: "desc" },
	})

	return attachProgress(goals)
}

export async function getGoalById(goalId: string, userId: string): Promise<GoalDetail | null> {
	const goal = await prisma.goal.findUnique({
		where: { id: goalId },
		include: {
			contributions: {
				include: {
					user: { select: { id: true, name: true, image: true } },
				},
				orderBy: { date: "desc" },
			},
		},
	})

	if (!goal) return null

	const sum = goal.contributions.reduce((acc, c) => acc + c.amount, 0)
	const count = goal.contributions.length

	return { ...goal, ...computeProgress(goal, sum, count) }
}

export async function getGroupGoals(
	groupId: string,
	status?: GoalStatus
): Promise<GoalWithProgress[]> {
	const goals = await prisma.goal.findMany({
		where: {
			groupId,
			...(status ? { status } : {}),
		},
		orderBy: { createdAt: "desc" },
	})

	return attachProgress(goals)
}

export async function getTopActiveGoals(userId: string, limit = 3): Promise<GoalWithProgress[]> {
	const goals = await prisma.goal.findMany({
		where: {
			userId,
			groupId: null,
			status: GoalStatus.ACTIVE,
		},
		orderBy: { targetDate: "asc" },
		take: limit,
	})

	return attachProgress(goals)
}
