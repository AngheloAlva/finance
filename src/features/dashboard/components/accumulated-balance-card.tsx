"use client"

import { Landmark } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { AnimatedNumber } from "@/shared/components/animated-number"
import type { CurrencyCode } from "@/shared/lib/constants"
import { cn } from "@/lib/utils"

import { StatCard } from "./stat-card"

interface AccumulatedBalanceCardProps {
	balanceCents: number
	currency: CurrencyCode
}

/**
 * All-time accumulated balance card. Unlike the monthly overview cards, this
 * value is independent of the selected month — it always shows the balance
 * up to today.
 */
export function AccumulatedBalanceCard({ balanceCents, currency }: AccumulatedBalanceCardProps) {
	const t = useTranslations("dashboard")
	const locale = useLocale()

	return (
		<StatCard
			title={t("widgets.accumulatedBalance.name")}
			value={<AnimatedNumber valueCents={balanceCents} currency={currency} locale={locale} />}
			icon={Landmark}
			className={cn(
				balanceCents >= 0
					? "[&_[data-slot=card-content]_.size-5]:text-emerald-500"
					: "[&_[data-slot=card-content]_.size-5]:text-red-500"
			)}
		/>
	)
}
