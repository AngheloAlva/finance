"use server"

import { prisma } from "@/shared/lib/prisma"
import { requireSession } from "@/shared/lib/auth"

export async function unsubscribePush(endpoint: string) {
	const session = await requireSession()

	await prisma.pushSubscription.deleteMany({
		where: { userId: session.user.id, endpoint },
	})
}
