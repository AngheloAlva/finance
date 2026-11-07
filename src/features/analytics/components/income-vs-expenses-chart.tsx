"use client"

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCompactCurrency, formatCurrency } from "@/shared/lib/formatters"

import type {
	IncomeVsExpensesTrend,
	TrendGranularity,
} from "@/features/analytics/types/analytics.types"

/** Bucket keys are UTC days (YYYY-MM-DD). */
function formatBucketLabel(
	key: string,
	granularity: TrendGranularity,
	locale: string,
	long = false,
): string {
	const date = new Date(`${key}T00:00:00Z`)
	if (granularity === "month") {
		return date.toLocaleDateString(locale, {
			month: long ? "long" : "short",
			...(long ? { year: "numeric" } : {}),
			timeZone: "UTC",
		})
	}
	return date.toLocaleDateString(locale, {
		day: "numeric",
		month: "short",
		...(long ? { year: "numeric" } : {}),
		timeZone: "UTC",
	})
}

interface IncomeVsExpensesChartProps {
	trend: IncomeVsExpensesTrend
	currency: CurrencyCode
}

const CHART_COLORS = {
	income: "var(--color-emerald-500)",
	expense: "var(--color-red-500)",
	net: "var(--color-blue-500)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

interface TooltipPayloadItem {
	name: string
	value: number
	color: string
}

function CustomTooltip({
	active,
	payload,
	label,
	currency,
	locale,
	formatLabel,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	locale?: string
	formatLabel: (key: string) => string
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-lg border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label ? formatLabel(label) : label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency, locale)}
				</p>
			))}
		</div>
	)
}

export function IncomeVsExpensesChart({ trend, currency }: IncomeVsExpensesChartProps) {
	const t = useTranslations("analytics.incomeVsExpenses")
	const locale = useLocale()
	const { granularity, points: data } = trend
	const hasData = data.some((point) => point.income !== 0 || point.expenses !== 0)

	function formatTooltipLabel(key: string): string {
		const label = formatBucketLabel(key, granularity, locale, true)
		return granularity === "week" ? t("weekOf", { date: label }) : label
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
				<CardDescription>{t(`granularity.${granularity}`)}</CardDescription>
			</CardHeader>
			<CardContent>
				{!hasData ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<ComposedChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
							<XAxis
								dataKey="key"
								tickFormatter={(value: string) => formatBucketLabel(value, granularity, locale)}
								minTickGap={16}
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
								width={80}
							/>
							<Tooltip
								content={
									<CustomTooltip
										currency={currency}
										locale={locale}
										formatLabel={formatTooltipLabel}
									/>
								}
							/>
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Area
								type="monotone"
								dataKey="netSavings"
								name={t("netSavings")}
								fill={CHART_COLORS.income}
								fillOpacity={0.1}
								stroke="none"
							/>
							<Line
								type="monotone"
								dataKey="income"
								name={t("income")}
								stroke={CHART_COLORS.income}
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="expenses"
								name={t("expenses")}
								stroke={CHART_COLORS.expense}
								strokeWidth={2}
								dot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
