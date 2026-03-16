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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { CurrencyBarTooltip } from "@/shared/components/chart-tooltip"

import type { MonthlyFlowItem } from "@/features/dashboard/types/dashboard.types"

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
	return (
		<Card>
			<CardHeader>
				<CardTitle>Monthly Flow</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">No data available</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={data} barGap={4}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
							<XAxis
								dataKey="label"
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCurrency(value, currency)}
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
								name="Income"
								fill={CHART_COLORS.income}
								radius={[0, 0, 0, 0]}
							/>
							<Bar
								dataKey="expenses"
								name="Expenses"
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
