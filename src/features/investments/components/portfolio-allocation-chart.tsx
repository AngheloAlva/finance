"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import type { AllocationItem } from "@/features/investments/types/investments.types"

interface PortfolioAllocationChartProps {
	data: AllocationItem[]
	currency: CurrencyCode
}

interface TooltipPayloadItem {
	name: string
	value: number
	payload: AllocationItem
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

	const item = payload[0]

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="font-medium">{item.name}</p>
			<p style={{ color: item.payload.color }}>
				{formatCurrency(item.value, currency)} ({item.payload.percentage}%)
			</p>
		</div>
	)
}

export function PortfolioAllocationChart({ data, currency }: PortfolioAllocationChartProps) {
	if (data.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Portfolio Allocation</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={250}>
					<PieChart>
						<Pie
							data={data}
							dataKey="totalValue"
							nameKey="label"
							cx="50%"
							cy="50%"
							outerRadius={90}
							innerRadius={50}
						>
							{data.map((item) => (
								<Cell key={item.type} fill={item.color} />
							))}
						</Pie>
						<Tooltip content={<CustomTooltip currency={currency} />} />
						<Legend
							formatter={(value: string) => (
								<span className="text-foreground text-xs">{value}</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	)
}
