"use server"

import { prisma } from "@/shared/lib/prisma"
import { requireSession } from "@/shared/lib/auth"

interface SubscribeInput {
	endpoint: string
	keys: { p256dh: string; auth: string }
}

export async function subscribePush(input: SubscribeInput) {
	const session = await requireSession()

	const existing = await prisma.pushSubscription.findUnique({
		where: { endpoint: input.endpoint },
		select: { userId: true },
	})

	if (existing && existing.userId !== session.user.id) {
		await prisma.pushSubscription.delete({ where: { endpoint: input.endpoint } })
	}

	await prisma.pushSubscription.upsert({
		where: { endpoint: input.endpoint },
		create: {
			userId: session.user.id,
			endpoint: input.endpoint,
			p256dh: input.keys.p256dh,
			auth: input.keys.auth,
		},
		update: {
			p256dh: input.keys.p256dh,
			auth: input.keys.auth,
		},
	})
}
