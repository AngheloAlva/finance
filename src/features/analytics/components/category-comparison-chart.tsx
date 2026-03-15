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

import type { CategoryComparisonItem } from "@/features/analytics/types/analytics.types"

interface CategoryComparisonChartProps {
	data: CategoryComparisonItem[]
	currency: CurrencyCode
	period1Label: string
	period2Label: string
}

const CHART_COLORS = {
	period1: "var(--color-blue-500)",
	period2: "var(--color-violet-500)",
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

export function CategoryComparisonChart({
	data,
	currency,
	period1Label,
	period2Label,
}: CategoryComparisonChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Category Comparison</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">No category data to compare</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={data} layout="vertical" barGap={2}>
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
								dataKey="period1Total"
								name={period1Label}
								fill={CHART_COLORS.period1}
								radius={[0, 4, 4, 0]}
							/>
							<Bar
								dataKey="period2Total"
								name={period2Label}
								fill={CHART_COLORS.period2}
								radius={[0, 4, 4, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
