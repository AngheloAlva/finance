import webpush from "web-push"

import { prisma } from "@/shared/lib/prisma"

let vapidConfigured = false

function configureVapid(): void {
	if (vapidConfigured) return
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
	const privateKey = process.env.VAPID_PRIVATE_KEY
	if (!publicKey || !privateKey) {
		throw new Error("VAPID keys are not configured")
	}
	webpush.setVapidDetails(
		`mailto:${process.env.VAPID_EMAIL ?? "admin@example.com"}`,
		publicKey,
		privateKey,
	)
	vapidConfigured = true
}

interface PushPayload {
	title: string
	body: string
	url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
	configureVapid()
	const subscriptions = await prisma.pushSubscription.findMany({
		where: { userId },
		select: { endpoint: true, p256dh: true, auth: true },
	})

	if (subscriptions.length === 0) return

	const results = await Promise.allSettled(
		subscriptions.map((sub) =>
			webpush.sendNotification(
				{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
				JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" })
			)
		)
	)

	const goneEndpoints = results
		.map((result, i) => ({ result, endpoint: subscriptions[i]!.endpoint }))
		.filter(({ result }) => {
			if (result.status !== "rejected") return false
			const status = (result.reason as { statusCode?: number })?.statusCode
			return status === 404 || status === 410
		})
		.map(({ endpoint }) => endpoint)

	if (goneEndpoints.length > 0) {
		await prisma.pushSubscription.deleteMany({
			where: { endpoint: { in: goneEndpoints } },
		})
	}
}
