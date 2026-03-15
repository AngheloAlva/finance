import type { InvestmentType } from "@/generated/prisma/enums"

import { prisma } from "@/shared/lib/prisma"
import type {
	Investment,
	InvestmentWithSnapshots,
} from "@/features/investments/types/investments.types"

export async function getInvestments(
	userId: string,
	filters?: { type?: InvestmentType; isActive?: boolean }
): Promise<Investment[]> {
	return prisma.investment.findMany({
		where: {
			userId,
			...(filters?.type && { type: filters.type }),
			...(filters?.isActive !== undefined && { isActive: filters.isActive }),
		},
		orderBy: { name: "asc" },
	})
}

export async function getInvestmentById(id: string, userId: string): Promise<Investment | null> {
	const investment = await prisma.investment.findUnique({
		where: { id },
	})

	if (!investment || investment.userId !== userId) {
		return null
	}

	return investment
}

export async function getInvestmentWithSnapshots(
	id: string,
	userId: string
): Promise<InvestmentWithSnapshots | null> {
	const investment = await prisma.investment.findUnique({
		where: { id },
		include: {
			snapshots: {
				orderBy: { date: "asc" },
			},
		},
	})

	if (!investment || investment.userId !== userId) {
		return null
	}

	return investment
}
