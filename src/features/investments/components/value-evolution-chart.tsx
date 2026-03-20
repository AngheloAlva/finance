"use client"

import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"
import type { SnapshotPoint } from "@/features/investments/types/investments.types"

interface ValueEvolutionChartProps {
	data: SnapshotPoint[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	line: "var(--color-blue-500)",
	grid: "var(--color-border)",
	text: "var(--color-muted-foreground)",
} as const

interface TooltipPayloadItem {
	value: number
}

function CustomTooltip({
	active,
	payload,
	label,
	currency,
	valueLabel,
	locale,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	valueLabel: string
	locale?: string
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label}</p>
			<p style={{ color: CHART_COLORS.line }}>
				{valueLabel}: {formatCurrency(payload[0].value, currency, locale)}
			</p>
		</div>
	)
}

export function ValueEvolutionChart({ data, currency }: ValueEvolutionChartProps) {
	const t = useTranslations("investments.chart")
	const locale = useLocale()
	const hasHistory = data.length > 1

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">{t("valueEvolution")}</CardTitle>
			</CardHeader>
			<CardContent>
				{!hasHistory ? (
					<div className="flex h-[250px] items-center justify-center">
						<p className="text-muted-foreground text-sm">
							{t("noHistoricalData")}
						</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={250}>
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
							<XAxis
								dataKey="date"
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
							<Tooltip content={<CustomTooltip currency={currency} valueLabel={t("value")} locale={locale} />} />
							<Line
								type="monotone"
								dataKey="value"
								stroke={CHART_COLORS.line}
								strokeWidth={2}
								dot={{ r: 3 }}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	)
}
