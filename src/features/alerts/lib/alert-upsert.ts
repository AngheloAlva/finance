import { AlertType, AlertSeverity } from "@/generated/prisma/enums"

import { prisma } from "@/shared/lib/prisma"
import { sendPushToUser } from "@/features/notifications/lib/send-push"

export type AlertReferenceType = "category" | "creditCard" | "goal" | "user" | "investment" | "budget"

export interface AlertUpsertArgs {
	userId: string
	type: AlertType
	referenceId: string
	deduplicationKey: string
	message: string
	severity: AlertSeverity
	referenceType: AlertReferenceType
}

export async function upsertAlertWithPush(args: AlertUpsertArgs): Promise<void> {
	const alert = await prisma.alert.upsert({
		where: {
			userId_type_referenceId_deduplicationKey: {
				userId: args.userId,
				type: args.type,
				referenceId: args.referenceId,
				deduplicationKey: args.deduplicationKey,
			},
		},
		create: {
			type: args.type,
			message: args.message,
			severity: args.severity,
			referenceType: args.referenceType,
			referenceId: args.referenceId,
			deduplicationKey: args.deduplicationKey,
			userId: args.userId,
		},
		update: {
			message: args.message,
			severity: args.severity,
			updatedAt: new Date(),
		},
		select: { createdAt: true, updatedAt: true },
	})

	if (alert.createdAt.getTime() === alert.updatedAt.getTime()) {
		void sendPushToUser(args.userId, {
			title: "Finance Alert",
			body: args.message,
			url: "/alerts",
		}).catch(() => {})
	}
}
