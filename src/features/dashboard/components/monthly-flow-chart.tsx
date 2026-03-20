"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { CurrencyBarTooltip } from "@/shared/components/chart-tooltip"

import type { MonthlyFlowItem } from "@/features/dashboard/types/dashboard.types"

function formatMonthLabel(monthKey: string, locale: string): string {
	const [year, month] = monthKey.split("-").map(Number)
	return new Date(year, month - 1).toLocaleDateString(locale, { month: "short" })
}

interface MonthlyFlowChartProps {
	data: MonthlyFlowItem[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	income: "var(--color-emerald-500)",
	expense: "var(--color-red-500)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

export function MonthlyFlowChart({ data, currency }: MonthlyFlowChartProps) {
	const t = useTranslations("dashboard")
	const locale = useLocale()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("monthlyFlow")}</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={data} barGap={4}>
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
							<Tooltip content={<CurrencyBarTooltip currency={currency} />} />
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Bar
								dataKey="income"
								name={t("income")}
								fill={CHART_COLORS.income}
								radius={[0, 0, 0, 0]}
							/>
							<Bar
								dataKey="expenses"
								name={t("expenses")}
								fill={CHART_COLORS.expense}
								radius={[0, 0, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
