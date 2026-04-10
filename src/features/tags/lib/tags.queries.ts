import { prisma } from "@/shared/lib/prisma"

import type { TagOption, TagWithCount } from "../types/tags.types"

export async function getUserTags(userId: string): Promise<TagWithCount[]> {
	return prisma.tag.findMany({
		where: { userId },
		include: {
			_count: { select: { transactions: true } },
		},
		orderBy: { name: "asc" },
	})
}

export async function getUserTagOptions(userId: string): Promise<TagOption[]> {
	return prisma.tag.findMany({
		where: { userId },
		select: { id: true, name: true, color: true },
		orderBy: { name: "asc" },
	})
}
