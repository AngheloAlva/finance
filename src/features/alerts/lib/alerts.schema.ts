import { AlertStatus } from "@/generated/prisma/enums"
import { z } from "zod"

export const markAlertReadSchema = z.object({
	alertId: z.string().min(1, { error: "Alert ID is required" }),
})

export const dismissAlertSchema = z.object({
	alertId: z.string().min(1, { error: "Alert ID is required" }),
})

export const alertFilterSchema = z.object({
	status: z.nativeEnum(AlertStatus).optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().default(20),
})

export type MarkAlertReadInput = z.infer<typeof markAlertReadSchema>
export type DismissAlertInput = z.infer<typeof dismissAlertSchema>
export type AlertFilterInput = z.infer<typeof alertFilterSchema>
