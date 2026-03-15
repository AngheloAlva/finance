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

import type { ForecastPoint } from "@/features/analytics/types/analytics.types"

interface CashFlowForecastChartProps {
	data: ForecastPoint[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	income: "var(--color-emerald-500)",
	expense: "var(--color-red-500)",
	net: "var(--color-blue-500)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
	projected: "var(--color-muted)",
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
	data,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	data: ForecastPoint[]
}) {
	if (!active || !payload?.length || !label) return null

	const point = data.find((d) => d.label === label)

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">
				{label} {point?.isProjected ? "(Projected)" : ""}
			</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency)}
				</p>
			))}
		</div>
	)
}

export function CashFlowForecastChart({ data, currency }: CashFlowForecastChartProps) {
	// Split into actual and projected segments for visual distinction
	const chartData = data.map((point) => ({
		...point,
		actualIncome: point.isProjected ? undefined : point.income,
		actualExpenses: point.isProjected ? undefined : point.expenses,
		projectedIncome: point.isProjected ? point.income : undefined,
		projectedExpenses: point.isProjected ? point.expenses : undefined,
		// Bridge: last actual point duplicated in projected for continuity
	}))

	// Add bridge point: copy last actual values into first projected
	const lastActualIdx = data.findLastIndex((d) => !d.isProjected)
	const firstProjectedIdx = data.findIndex((d) => d.isProjected)
	if (lastActualIdx >= 0 && firstProjectedIdx >= 0) {
		chartData[firstProjectedIdx] = {
			...chartData[firstProjectedIdx],
			projectedIncome: data[lastActualIdx].income,
			projectedExpenses: data[lastActualIdx].expenses,
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Cash Flow Forecast</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">Not enough data to forecast</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<ComposedChart data={chartData}>
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
							<Tooltip content={<CustomTooltip currency={currency} data={data} />} />
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							{/* Actual lines (solid) */}
							<Line
								type="monotone"
								dataKey="actualIncome"
								name="Income"
								stroke={CHART_COLORS.income}
								strokeWidth={2}
								dot={false}
								connectNulls={false}
							/>
							<Line
								type="monotone"
								dataKey="actualExpenses"
								name="Expenses"
								stroke={CHART_COLORS.expense}
								strokeWidth={2}
								dot={false}
								connectNulls={false}
							/>
							{/* Projected lines (dashed) */}
							<Line
								type="monotone"
								dataKey="projectedIncome"
								name="Projected Income"
								stroke={CHART_COLORS.income}
								strokeWidth={2}
								strokeDasharray="6 3"
								dot={false}
								connectNulls={false}
							/>
							<Line
								type="monotone"
								dataKey="projectedExpenses"
								name="Projected Expenses"
								stroke={CHART_COLORS.expense}
								strokeWidth={2}
								strokeDasharray="6 3"
								dot={false}
								connectNulls={false}
							/>
							{/* Projected area background */}
							<Area
								type="monotone"
								dataKey="projectedIncome"
								fill={CHART_COLORS.projected}
								fillOpacity={0.05}
								stroke="none"
							/>
						</ComposedChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
