"use client"

import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

interface BarTooltipPayloadItem {
	name: string
	value: number
	color: string
}

interface CurrencyBarTooltipProps {
	active?: boolean
	payload?: BarTooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
}

export function CurrencyBarTooltip({ active, payload, label, currency }: CurrencyBarTooltipProps) {
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

interface PieTooltipItem {
	total: number
	percentage: number
	[key: string]: unknown
}

interface PieTooltipPayloadItem {
	payload: PieTooltipItem
}

interface CurrencyPieTooltipProps {
	active?: boolean
	payload?: PieTooltipPayloadItem[]
	currency: CurrencyCode
	nameKey: string
}

export function CurrencyPieTooltip({ active, payload, currency, nameKey }: CurrencyPieTooltipProps) {
	if (!active || !payload?.length) return null

	const item = payload[0].payload

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="font-medium">{String(item[nameKey])}</p>
			<p className="text-muted-foreground">
				{formatCurrency(item.total, currency)} ({item.percentage}%)
			</p>
		</div>
	)
}
