"use client"

import { TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"

interface TrendAlertBadgeProps {
	increasePercent: number
}

export function TrendAlertBadge({ increasePercent }: TrendAlertBadgeProps) {
	const t = useTranslations("comparison")

	return (
		<Badge variant="secondary" className="gap-1 text-amber-500">
			<TriangleAlert className="size-3" />
			{t("risingTrend", { percent: increasePercent })}
		</Badge>
	)
}
