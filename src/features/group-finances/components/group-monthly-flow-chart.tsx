"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GroupMonthlyFlowItem } from "@/features/group-finances/types/group-finances.types"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import { CurrencyBarTooltip } from "@/shared/components/chart-tooltip"

interface GroupMonthlyFlowChartProps {
	data: GroupMonthlyFlowItem[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	bar: "var(--color-primary)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

export function GroupMonthlyFlowChart({ data, currency }: GroupMonthlyFlowChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Monthly Expenses</CardTitle>
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
								dataKey="month"
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
							<Bar dataKey="total" name="Expenses" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
