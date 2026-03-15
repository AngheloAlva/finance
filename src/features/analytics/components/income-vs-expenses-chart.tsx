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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

import type { TrendPoint } from "@/features/analytics/types/analytics.types"

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
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency)}
				</p>
			))}
		</div>
	)
}

export function IncomeVsExpensesChart({ data, currency }: IncomeVsExpensesChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Income vs Expenses Trend</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">No transaction data available</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<ComposedChart data={data}>
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
							<Tooltip content={<CustomTooltip currency={currency} />} />
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Area
								type="monotone"
								dataKey="netSavings"
								name="Net Savings"
								fill={CHART_COLORS.income}
								fillOpacity={0.1}
								stroke="none"
							/>
							<Line
								type="monotone"
								dataKey="income"
								name="Income"
								stroke={CHART_COLORS.income}
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="expenses"
								name="Expenses"
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
