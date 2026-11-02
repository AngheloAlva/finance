"use client"

import { useLocale, useTranslations } from "next-intl"

import { getMonthHero } from "@/features/dashboard/lib/month-hero"
import type { MonthlyOverview } from "@/features/dashboard/types/dashboard.types"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "@/shared/components/animated-number"
import { CurrencyDisplay } from "@/shared/components/currency-display"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

interface OverviewCardsProps {
	overview: MonthlyOverview
	budgets: { totalBudgeted: number; totalSpent: number } | null
	totalBalance: number | null
	currency: CurrencyCode
}

const HERO_LABELS = {
	net: "hero.netThisMonth",
	budget: "hero.leftToSpend",
	overBudget: "hero.overBudget",
} as const

export function OverviewCards({ overview, budgets, totalBalance, currency }: OverviewCardsProps) {
	const t = useTranslations("dashboard")
	const locale = useLocale()
	const hero = getMonthHero(overview, budgets)

	const stats = [
		{ label: t("income"), cents: overview.totalIncome },
		{ label: t("expenses"), cents: overview.totalExpenses },
		...(totalBalance !== null ? [{ label: t("hero.totalBalance"), cents: totalBalance }] : []),
	]

	return (
		<section className="bg-card border p-4 md:p-6">
			<p className="text-muted-foreground text-xs font-medium">{t(HERO_LABELS[hero.mode])}</p>
			<p
				className={cn(
					"mt-1 text-4xl font-semibold tracking-tight tabular-nums",
					(hero.mode === "overBudget" || hero.amount < 0) && "text-destructive",
				)}
			>
				<AnimatedNumber valueCents={hero.amount} currency={currency} locale={locale} />
			</p>

			{hero.mode !== "net" && (
				<div className="mt-4">
					<div className="bg-muted h-1.5 overflow-hidden">
						<div
							className={cn(
								"h-full transition-[width] duration-[var(--duration-normal)]",
								hero.mode === "overBudget" ? "bg-destructive" : "bg-foreground",
							)}
							style={{ width: `${hero.percent}%` }}
						/>
					</div>
					<p className="text-muted-foreground mt-1.5 text-xs tabular-nums">
						{t("hero.spentOf", {
							spent: formatCurrency(hero.spent, currency, locale),
							budget: formatCurrency(hero.budgeted, currency, locale),
						})}
					</p>
				</div>
			)}

			<dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
				{stats.map((stat) => (
					<div key={stat.label} className="min-w-0">
						<dt className="text-muted-foreground truncate text-xs">{stat.label}</dt>
						<dd className="mt-0.5 truncate text-xs font-medium tabular-nums md:text-sm">
							<CurrencyDisplay cents={stat.cents} currency={currency} locale={locale} />
						</dd>
					</div>
				))}
			</dl>
		</section>
	)
}
