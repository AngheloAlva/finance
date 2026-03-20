import type { Alert } from "@/generated/prisma/client"
import { useTranslations } from "next-intl"

import { AlertCard } from "@/features/alerts/components/alert-card"

interface AlertListProps {
	alerts: Alert[]
}

export function AlertList({ alerts }: AlertListProps) {
	const t = useTranslations("alerts")
	if (alerts.length === 0) {
		return (
			<div className="flex items-center justify-center rounded-none border py-12">
				<p className="text-muted-foreground text-sm">{t("noAlerts")}</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2">
			{alerts.map((alert) => (
				<AlertCard key={alert.id} alert={alert} />
			))}
		</div>
	)
}
