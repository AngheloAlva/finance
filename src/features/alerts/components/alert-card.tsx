"use client"

import { useActionState } from "react"
import {
	Banknote,
	BarChart3,
	Check,
	Clock,
	CreditCard,
	Percent,
	Target,
	TrendingDown,
	TrendingUp,
	Trophy,
	TriangleAlert,
	X,
	Zap,
} from "lucide-react"
import type { Alert } from "@/generated/prisma/client"
import { AlertStatus } from "@/generated/prisma/enums"
import type { AlertType } from "@/generated/prisma/enums"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { markAlertReadAction } from "@/features/alerts/actions/mark-alert-read.action"
import { dismissAlertAction } from "@/features/alerts/actions/dismiss-alert.action"
import { INITIAL_VOID_STATE } from "@/shared/types/common.types"

const ALERT_TYPE_CONFIG: Record<AlertType, { icon: typeof TrendingUp; labelKey: string }> = {
	CATEGORY_THRESHOLD_EXCEEDED: { icon: TrendingUp, labelKey: "thresholdExceeded" },
	CATEGORY_SPENDING_SPIKE: { icon: Zap, labelKey: "spendingSpike" },
	CREDIT_CARD_HIGH_USAGE: { icon: CreditCard, labelKey: "highCcUsage" },
	CREDIT_CARD_PAYMENT_DUE: { icon: CreditCard, labelKey: "paymentDue" },
	GOAL_MILESTONE: { icon: Target, labelKey: "goalMilestone" },
	GOAL_DEADLINE_APPROACHING: { icon: Clock, labelKey: "deadlineNear" },
	GOAL_COMPLETED: { icon: Trophy, labelKey: "goalCompleted" },
	NEGATIVE_BALANCE_RISK: { icon: TrendingDown, labelKey: "balanceRisk" },
	FUTURE_OVERLOAD: { icon: TriangleAlert, labelKey: "futureOverload" },
	EXCESSIVE_INSTALLMENTS: { icon: Percent, labelKey: "installmentLoad" },
	INVESTMENT_SIGNIFICANT_CHANGE: { icon: BarChart3, labelKey: "investmentChange" },
	MISSING_INCOME: { icon: Banknote, labelKey: "missingIncome" },
} as const

const SEVERITY_STYLES = {
	INFO: "border-l-blue-500",
	WARNING: "border-l-amber-500",
	CRITICAL: "border-l-red-500",
} as const

const SEVERITY_ICON_STYLES = {
	INFO: "text-blue-500",
	WARNING: "text-amber-500",
	CRITICAL: "text-red-500",
} as const

function getRelativeTime(date: Date, tTime: (key: string, values?: Record<string, number>) => string): string {
	const now = Date.now()
	const diff = now - new Date(date).getTime()
	const minutes = Math.floor(diff / 60000)
	const hours = Math.floor(diff / 3600000)
	const days = Math.floor(diff / 86400000)

	if (minutes < 1) return tTime("justNow")
	if (minutes < 60) return tTime("minutesAgo", { count: minutes })
	if (hours < 24) return tTime("hoursAgo", { count: hours })
	if (days < 30) return tTime("daysAgo", { count: days })
	return tTime("monthsAgo", { count: Math.floor(days / 30) })
}

interface AlertCardProps {
	alert: Alert
}

export function AlertCard({ alert }: AlertCardProps) {
	const t = useTranslations("alerts")
	const tTypes = useTranslations("alerts.types")
	const tTime = useTranslations("alerts.time")
	const config = ALERT_TYPE_CONFIG[alert.type]
	const Icon = config.icon
	const isPending = alert.status === AlertStatus.PENDING

	const [, markReadAction, isMarkingRead] = useActionState(markAlertReadAction, INITIAL_VOID_STATE)
	const [, dismissAction, isDismissing] = useActionState(dismissAlertAction, INITIAL_VOID_STATE)

	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-none border border-l-4 p-4",
				SEVERITY_STYLES[alert.severity],
				alert.status === AlertStatus.DISMISSED && "opacity-50"
			)}
		>
			<div className={cn("mt-0.5 shrink-0", SEVERITY_ICON_STYLES[alert.severity])}>
				<Icon className="size-4" />
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-xs font-medium">{tTypes(config.labelKey)}</span>
					<span className="text-muted-foreground text-xs">{getRelativeTime(alert.createdAt, tTime)}</span>
				</div>
				<p className="text-sm">{alert.message}</p>
			</div>

			{isPending && (
				<div className="flex shrink-0 gap-1">
					<form action={markReadAction}>
						<input type="hidden" name="alertId" value={alert.id} />
						<Button
							type="submit"
							variant="ghost"
							size="sm"
							disabled={isMarkingRead}
							className="size-8 p-0"
						>
							<Check className="size-4" />
							<span className="sr-only">{t("markAsRead")}</span>
						</Button>
					</form>
					<form action={dismissAction}>
						<input type="hidden" name="alertId" value={alert.id} />
						<Button
							type="submit"
							variant="ghost"
							size="sm"
							disabled={isDismissing}
							className="size-8 p-0"
						>
							<X className="size-4" />
							<span className="sr-only">{t("dismiss")}</span>
						</Button>
					</form>
				</div>
			)}
		</div>
	)
}
