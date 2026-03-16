"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

import type { BudgetVsActualItem } from "@/features/analytics/types/analytics.types"

interface BudgetVsActualChartProps {
	data: BudgetVsActualItem[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	under: "var(--color-emerald-500)",
	warning: "var(--color-amber-500)",
	over: "var(--color-red-500)",
	budget: "var(--color-muted-foreground)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

function getBarColor(percentage: number): string {
	if (percentage > 100) return CHART_COLORS.over
	if (percentage >= 80) return CHART_COLORS.warning
	return CHART_COLORS.under
}

interface TooltipPayloadItem {
	name: string
	value: number
	color: string
	payload: BudgetVsActualItem
}

function CustomTooltip({
	active,
	payload,
	currency,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	currency: CurrencyCode
}) {
	if (!active || !payload?.length) return null

	const item = payload[0].payload

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{item.categoryName}</p>
			<p className="text-muted-foreground">Budget: {formatCurrency(item.budget, currency)}</p>
			<p style={{ color: getBarColor(item.percentage) }}>
				Actual: {formatCurrency(item.actual, currency)} ({item.percentage}%)
			</p>
		</div>
	)
}

export function BudgetVsActualChart({ data, currency }: BudgetVsActualChartProps) {
	// Create chart data with both budget and actual for overlay
	const chartData = data.map((item) => ({
		...item,
		// Cap the visual bar at 150% of budget to keep chart readable
		displayActual: Math.min(item.actual, item.budget * 1.5),
	}))

	return (
		<Card>
			<CardHeader>
				<CardTitle>Budget vs Actual</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">
							No budget thresholds set. Set category alert thresholds to track budgets.
						</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData} layout="vertical" barGap={0}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
							<XAxis
								type="number"
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCurrency(value, currency)}
							/>
							<YAxis
								type="category"
								dataKey="categoryName"
								tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								width={100}
							/>
							<Tooltip content={<CustomTooltip currency={currency} />} />
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Bar
								dataKey="budget"
								name="Budget"
								fill={CHART_COLORS.budget}
								fillOpacity={0.2}
								radius={[0, 0, 0, 0]}
							/>
							<Bar dataKey="actual" name="Actual" radius={[0, 0, 0, 0]}>
								{chartData.map((entry) => (
									<Cell key={entry.categoryId} fill={getBarColor(entry.percentage)} />
								))}
							</Bar>
							<ReferenceLine x={0} stroke={CHART_COLORS.grid} />
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
