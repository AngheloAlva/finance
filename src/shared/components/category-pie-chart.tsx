"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { CurrencyPieTooltip } from "@/shared/components/chart-tooltip"

interface CategoryPieChartProps {
	data: Record<string, unknown>[]
	currency: CurrencyCode
	title?: string
	nameKey: string
	colorKey: string
	idKey?: string
	emptyMessage?: string
}

export function CategoryPieChart({
	data,
	currency,
	title = "Expenses by Category",
	nameKey,
	colorKey,
	idKey = "categoryId",
	emptyMessage = "No expenses this month",
}: CategoryPieChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">{emptyMessage}</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={data}
								dataKey="total"
								nameKey={nameKey}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={2}
							>
								{data.map((item) => (
									<Cell key={String(item[idKey])} fill={String(item[colorKey])} />
								))}
							</Pie>
							<Tooltip content={<CurrencyPieTooltip currency={currency} nameKey={nameKey} />} />
							<Legend
								verticalAlign="bottom"
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
						</PieChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
