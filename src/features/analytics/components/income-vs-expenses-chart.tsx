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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

import type { TrendPoint } from "@/features/analytics/types/analytics.types"

function formatMonthLabel(monthKey: string, locale: string): string {
	const [year, month] = monthKey.split("-").map(Number)
	return new Date(year, month - 1).toLocaleDateString(locale, { month: "short" })
}

interface IncomeVsExpensesChartProps {
	data: TrendPoint[]
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
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	locale?: string
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label ? formatMonthLabel(label, locale ?? "en") : label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency, locale)}
				</p>
			))}
		</div>
	)
}

export function IncomeVsExpensesChart({ data, currency }: IncomeVsExpensesChartProps) {
	const t = useTranslations("analytics.incomeVsExpenses")
	const locale = useLocale()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<ComposedChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
							<XAxis
								dataKey="month"
								tickFormatter={(value: string) => formatMonthLabel(value, locale)}
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCurrency(value, currency, locale)}
								width={80}
							/>
							<Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
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
