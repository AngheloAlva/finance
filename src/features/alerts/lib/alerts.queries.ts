import { unstable_cache } from "next/cache"

import { AlertStatus } from "@/generated/prisma/enums"
import { prisma } from "@/shared/lib/prisma"
import type { PaginatedResult } from "@/shared/types/common.types"
import type { AlertFilterParams } from "@/features/alerts/types/alerts.types"
import type { Alert } from "@/generated/prisma/client"

export async function getUserAlerts(
	userId: string,
	filters: AlertFilterParams
): Promise<PaginatedResult<Alert>> {
	const { status, page, pageSize } = filters

	const where = {
		userId,
		...(status ? { status } : {}),
	}

	const [data, total] = await Promise.all([
		prisma.alert.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		prisma.alert.count({ where }),
	])

	return {
		data,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	}
}

export const getUnreadAlertCount = unstable_cache(
	async (userId: string): Promise<number> => {
		return prisma.alert.count({
			where: { userId, status: AlertStatus.PENDING },
		})
	},
	["unread-alert-count"],
	{ tags: ["alerts"], revalidate: 60 }
)
