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

import { useLocale, useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CurrencyCode } from "@/shared/lib/constants"
import { formatCurrency } from "@/shared/lib/formatters"

import type { NetWorthPoint } from "@/features/analytics/types/analytics.types"

interface NetWorthChartProps {
	data: NetWorthPoint[]
	currency: CurrencyCode
}

const CHART_COLORS = {
	assets: "var(--color-emerald-500)",
	liabilities: "var(--color-red-500)",
	netWorth: "var(--color-blue-500)",
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
	locale,
}: {
	active?: boolean
	payload?: TooltipPayloadItem[]
	label?: string
	currency: CurrencyCode
	locale?: string
}) {
	if (!active || !payload?.length) return null

	return (
		<div className="bg-popover rounded-none border px-3 py-2 text-sm shadow-md">
			<p className="mb-1 font-medium">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }}>
					{entry.name}: {formatCurrency(entry.value, currency, locale)}
				</p>
			))}
		</div>
	)
}

export function NetWorthChart({ data, currency }: NetWorthChartProps) {
	const t = useTranslations("analytics.netWorth")
	const locale = useLocale()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center">
						<p className="text-muted-foreground text-sm">
							{t("noData")}
						</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<ComposedChart data={data}>
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
							<Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
							<Legend
								formatter={(value: string) => (
									<span className="text-foreground text-xs">{value}</span>
								)}
							/>
							<Area
								type="monotone"
								dataKey="assets"
								name={t("assets")}
								fill={CHART_COLORS.assets}
								fillOpacity={0.15}
								stroke={CHART_COLORS.assets}
								strokeWidth={1}
							/>
							<Area
								type="monotone"
								dataKey="liabilities"
								name={t("liabilities")}
								fill={CHART_COLORS.liabilities}
								fillOpacity={0.1}
								stroke={CHART_COLORS.liabilities}
								strokeWidth={1}
							/>
							<Line
								type="monotone"
								dataKey="netWorth"
								name={t("netWorth")}
								stroke={CHART_COLORS.netWorth}
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
